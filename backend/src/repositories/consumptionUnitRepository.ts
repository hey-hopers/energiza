import { getPool } from '../config/database';
import { ConsumptionUnit, Address } from '../types';
import sql from 'mssql';

/**
 * Mapeia um registro do banco de dados para um objeto ConsumptionUnit estruturado.
 * Faz o JOIN entre UNIDADE_CONSUMO, UC_DISTRIBUIDORA, PESSOAS_FJ e ENDERECOS.
 */
const mapRecordToConsumptionUnit = (record: any): ConsumptionUnit => {
    const address: Address | undefined = record.ID_ENDERECO ? {
        id: record.ID_ENDERECO,
        cep: record.CEP || '',
        street: record.ENDERECO || '',
        number: record.NUMERO || '',
        complement: record.COMPLEMENTO,
        reference: record.REFERENCIA,
        neighborhood: record.BAIRRO || '',
        postalCode: record.CODIGO_POSTAL,
        city: record.CIDADE || '',
        state: record.ESTADO || '',
        country: record.PAIS || 'Brasil',
    } : undefined;

    return {
        id: record.ID_UNIDADE_CONSUMO.toString(),
        name: record.UC_CODIGO, // Usando UC_CODIGO como name
        ucCode: record.UC_CODIGO || '',
        isGenerator: record.EH_GERADORA === true || record.EH_GERADORA === 1,
        meterNumber: record.MEDIDOR || '',
        distributorId: record.ID_UC_DISTRIBUIDORA?.toString() || '',
        address: address || {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Brasil'
        },
        ownerId: record.ID_PESSOA_FJ_PROPRIETARIO?.toString() || '',
        averageConsumption: 0, // Campo não existe na tabela, manter 0
        distributorLogin: record.USUARIO_LOGIN || '',
        distributorPassword: record.SENHA_LOGIN || '',
        // Campos de leitura não existem na tabela, manter vazios
        lastReadingDate: undefined,
        currentReadingDate: undefined,
        nextReadingDate: undefined,
        lastReading: undefined,
        currentReading: undefined,
        nextReading: undefined,
    };
};

/**
 * Query base para buscar unidades de consumo com todos os dados relacionados.
 * Faz JOINs com UC_DISTRIBUIDORA, PESSOAS_FJ e ENDERECOS.
 */
const BASE_CONSUMPTION_UNIT_QUERY = `
  SELECT 
    UC.ID_UNIDADE_CONSUMO,
    UC.ID_OPERADOR_ENERGETICO,
    UC.UC_CODIGO,
    UC.EH_GERADORA,
    UC.ID_UC_DISTRIBUIDORA,
    UC.ID_PESSOA_FJ_PROPRIETARIO,
    UC.ID_UC_CONFIGURACAO,
    UC.ID_ENDERECO,
    UC.MEDIDOR,
    UC.ID_UC_CLIENTES,
    UC.USUARIO_LOGIN,
    UC.SENHA_LOGIN,
    -- Dados de UC_DISTRIBUIDORA
    D.NOME AS DISTRIBUIDORA_NOME,
    -- Dados de ENDERECOS
    E.CEP,
    E.ENDERECO,
    E.NUMERO,
    E.COMPLEMENTO,
    E.REFERENCIA,
    E.BAIRRO,
    E.CODIGO_POSTAL,
    E.CIDADE,
    E.ESTADO,
    E.PAIS
  FROM UNIDADE_CONSUMO UC
  LEFT JOIN UC_DISTRIBUIDORA D ON UC.ID_UC_DISTRIBUIDORA = D.ID_UC_DISTRIBUIDORA
  LEFT JOIN ENDERECOS E ON UC.ID_ENDERECO = E.ID_ENDERECO
`;

/**
 * Busca todas as unidades de consumo.
 */
export const findAll = async (): Promise<ConsumptionUnit[]> => {
    const pool = await getPool();
    const result = await pool.request().query(BASE_CONSUMPTION_UNIT_QUERY);
    return result.recordset.map(mapRecordToConsumptionUnit);
};

/**
 * Busca uma unidade de consumo pelo ID.
 */
export const findById = async (id: number): Promise<ConsumptionUnit | null> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`${BASE_CONSUMPTION_UNIT_QUERY} WHERE UC.ID_UNIDADE_CONSUMO = @id`);

    if (result.recordset.length === 0) {
        return null;
    }
    return mapRecordToConsumptionUnit(result.recordset[0]);
};

/**
 * Cria uma nova unidade de consumo.
 * Insere nas tabelas ENDERECOS e UNIDADE_CONSUMO.
 */
export const create = async (unitData: Omit<ConsumptionUnit, 'id'>): Promise<ConsumptionUnit> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        
        // 1. Inserir em ENDERECOS
        let idEndereco: number;
        const endRequest = new sql.Request(transaction);
        endRequest
            .input('cep', sql.VarChar, unitData.address.zipCode || unitData.address.cep || '')
            .input('endereco', sql.VarChar, unitData.address.street)
            .input('numero', sql.VarChar, unitData.address.number)
            .input('complemento', sql.VarChar, unitData.address.complement || null)
            .input('referencia', sql.VarChar, unitData.address.reference || null)
            .input('bairro', sql.VarChar, unitData.address.neighborhood)
            .input('codigoPostal', sql.VarChar, unitData.address.postalCode || null)
            .input('cidade', sql.VarChar, unitData.address.city)
            .input('estado', sql.VarChar, unitData.address.state)
            .input('pais', sql.VarChar, unitData.address.country || 'Brasil');
        
        const endResult = await endRequest.query(`
            INSERT INTO ENDERECOS (CEP, ENDERECO, NUMERO, COMPLEMENTO, REFERENCIA, BAIRRO, CODIGO_POSTAL, CIDADE, ESTADO, PAIS)
            OUTPUT INSERTED.ID_ENDERECO
            VALUES (@cep, @endereco, @numero, @complemento, @referencia, @bairro, @codigoPostal, @cidade, @estado, @pais)
        `);
        idEndereco = endResult.recordset[0].ID_ENDERECO;

        // 2. Inserir em UNIDADE_CONSUMO
        const unitRequest = new sql.Request(transaction);
        unitRequest
            .input('idOperadorEnergetico', sql.Int, null) // Pode ser obtido do usuário logado
            .input('ucCodigo', sql.VarChar, unitData.ucCode)
            .input('ehGeradora', sql.Bit, unitData.isGenerator ? 1 : 0)
            .input('idUcDistribuidora', sql.Int, parseInt(unitData.distributorId))
            .input('idPessoaFjProprietario', sql.Int, parseInt(unitData.ownerId))
            .input('idUcConfiguracao', sql.Int, null)
            .input('idEndereco', sql.Int, idEndereco)
            .input('medidor', sql.VarChar, unitData.meterNumber)
            .input('idUcClientes', sql.Int, null)
            .input('usuarioLogin', sql.VarChar, unitData.distributorLogin || null)
            .input('senhaLogin', sql.VarChar, unitData.distributorPassword || null);
        
        const unitResult = await unitRequest.query(`
            INSERT INTO UNIDADE_CONSUMO (
                ID_OPERADOR_ENERGETICO, UC_CODIGO, EH_GERADORA, ID_UC_DISTRIBUIDORA,
                ID_PESSOA_FJ_PROPRIETARIO, ID_UC_CONFIGURACAO, ID_ENDERECO, MEDIDOR,
                ID_UC_CLIENTES, USUARIO_LOGIN, SENHA_LOGIN
            )
            OUTPUT INSERTED.ID_UNIDADE_CONSUMO
            VALUES (
                @idOperadorEnergetico, @ucCodigo, @ehGeradora, @idUcDistribuidora,
                @idPessoaFjProprietario, @idUcConfiguracao, @idEndereco, @medidor,
                @idUcClientes, @usuarioLogin, @senhaLogin
            )
        `);
        const idUnidadeConsumo = unitResult.recordset[0].ID_UNIDADE_CONSUMO;

        await transaction.commit();
        
        // Buscar a unidade criada com todos os dados
        const createdUnit = await findById(idUnidadeConsumo);
        if (!createdUnit) throw new Error("Falha ao recuperar unidade de consumo criada.");
        return createdUnit;

    } catch (err) {
        await transaction.rollback();
        console.error("Transação revertida para createConsumptionUnit:", err);
        throw err;
    }
};

/**
 * Atualiza uma unidade de consumo existente.
 */
export const update = async (id: number, unitData: Partial<Omit<ConsumptionUnit, 'id'>>): Promise<ConsumptionUnit | null> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
  
        // Buscar unidade atual para obter os IDs relacionados
        const currentUnit = await findById(id);
        if (!currentUnit) {
            throw new Error("Unidade de consumo não encontrada.");
        }
  
        // 1. Atualizar ENDERECOS (se fornecido)
        if (unitData.address) {
            if (currentUnit.address?.id) {
                // Atualizar endereço existente
                const endRequest = new sql.Request(transaction);
                const updates: string[] = [];
                
                if (unitData.address.cep !== undefined || unitData.address.zipCode !== undefined) {
                    const cep = unitData.address.zipCode || unitData.address.cep || '';
                    endRequest.input('cep', sql.VarChar, cep);
                    updates.push('CEP = @cep');
                }
                if (unitData.address.street !== undefined) {
                    endRequest.input('endereco', sql.VarChar, unitData.address.street);
                    updates.push('ENDERECO = @endereco');
                }
                if (unitData.address.number !== undefined) {
                    endRequest.input('numero', sql.VarChar, unitData.address.number);
                    updates.push('NUMERO = @numero');
                }
                if (unitData.address.complement !== undefined) {
                    endRequest.input('complemento', sql.VarChar, unitData.address.complement || null);
                    updates.push('COMPLEMENTO = @complemento');
                }
                if (unitData.address.neighborhood !== undefined) {
                    endRequest.input('bairro', sql.VarChar, unitData.address.neighborhood);
                    updates.push('BAIRRO = @bairro');
                }
                if (unitData.address.city !== undefined) {
                    endRequest.input('cidade', sql.VarChar, unitData.address.city);
                    updates.push('CIDADE = @cidade');
                }
                if (unitData.address.state !== undefined) {
                    endRequest.input('estado', sql.VarChar, unitData.address.state);
                    updates.push('ESTADO = @estado');
                }
                if (unitData.address.country !== undefined) {
                    endRequest.input('pais', sql.VarChar, unitData.address.country);
                    updates.push('PAIS = @pais');
                }
                if (unitData.address.postalCode !== undefined) {
                    endRequest.input('codigoPostal', sql.VarChar, unitData.address.postalCode || null);
                    updates.push('CODIGO_POSTAL = @codigoPostal');
                }
                if (unitData.address.reference !== undefined) {
                    endRequest.input('referencia', sql.VarChar, unitData.address.reference || null);
                    updates.push('REFERENCIA = @referencia');
                }
                
                if (updates.length > 0) {
                    endRequest.input('id', sql.Int, currentUnit.address.id);
                    await endRequest.query(`
                        UPDATE ENDERECOS 
                        SET ${updates.join(', ')}
                        WHERE ID_ENDERECO = @id
                    `);
                }
            } else {
                // Criar novo endereço
                const endRequest = new sql.Request(transaction);
                const cep = unitData.address.zipCode || unitData.address.cep || '';
                endRequest
                    .input('cep', sql.VarChar, cep)
                    .input('endereco', sql.VarChar, unitData.address.street || '')
                    .input('numero', sql.VarChar, unitData.address.number || '')
                    .input('complemento', sql.VarChar, unitData.address.complement || null)
                    .input('referencia', sql.VarChar, unitData.address.reference || null)
                    .input('bairro', sql.VarChar, unitData.address.neighborhood || '')
                    .input('codigoPostal', sql.VarChar, unitData.address.postalCode || null)
                    .input('cidade', sql.VarChar, unitData.address.city || '')
                    .input('estado', sql.VarChar, unitData.address.state || '')
                    .input('pais', sql.VarChar, unitData.address.country || 'Brasil');
                
                const endResult = await endRequest.query(`
                    INSERT INTO ENDERECOS (CEP, ENDERECO, NUMERO, COMPLEMENTO, REFERENCIA, BAIRRO, CODIGO_POSTAL, CIDADE, ESTADO, PAIS)
                    OUTPUT INSERTED.ID_ENDERECO
                    VALUES (@cep, @endereco, @numero, @complemento, @referencia, @bairro, @codigoPostal, @cidade, @estado, @pais)
                `);
                const newIdEndereco = endResult.recordset[0].ID_ENDERECO;
                
                // Atualizar FK em UNIDADE_CONSUMO
                await transaction.request()
                    .input('idUnidade', sql.Int, id)
                    .input('idEndereco', sql.Int, newIdEndereco)
                    .query('UPDATE UNIDADE_CONSUMO SET ID_ENDERECO = @idEndereco WHERE ID_UNIDADE_CONSUMO = @idUnidade');
            }
        }
  
        // 2. Atualizar UNIDADE_CONSUMO
        if (unitData.ucCode !== undefined || unitData.isGenerator !== undefined || 
            unitData.distributorId !== undefined || unitData.ownerId !== undefined ||
            unitData.meterNumber !== undefined || unitData.distributorLogin !== undefined ||
            unitData.distributorPassword !== undefined) {
            const unitRequest = new sql.Request(transaction);
            const updates: string[] = [];
            
            if (unitData.ucCode !== undefined) {
                unitRequest.input('ucCodigo', sql.VarChar, unitData.ucCode);
                updates.push('UC_CODIGO = @ucCodigo');
            }
            if (unitData.isGenerator !== undefined) {
                unitRequest.input('ehGeradora', sql.Bit, unitData.isGenerator ? 1 : 0);
                updates.push('EH_GERADORA = @ehGeradora');
            }
            if (unitData.distributorId !== undefined) {
                unitRequest.input('idUcDistribuidora', sql.Int, parseInt(unitData.distributorId));
                updates.push('ID_UC_DISTRIBUIDORA = @idUcDistribuidora');
            }
            if (unitData.ownerId !== undefined) {
                unitRequest.input('idPessoaFjProprietario', sql.Int, parseInt(unitData.ownerId));
                updates.push('ID_PESSOA_FJ_PROPRIETARIO = @idPessoaFjProprietario');
            }
            if (unitData.meterNumber !== undefined) {
                unitRequest.input('medidor', sql.VarChar, unitData.meterNumber);
                updates.push('MEDIDOR = @medidor');
            }
            if (unitData.distributorLogin !== undefined) {
                unitRequest.input('usuarioLogin', sql.VarChar, unitData.distributorLogin || null);
                updates.push('USUARIO_LOGIN = @usuarioLogin');
            }
            if (unitData.distributorPassword !== undefined) {
                unitRequest.input('senhaLogin', sql.VarChar, unitData.distributorPassword || null);
                updates.push('SENHA_LOGIN = @senhaLogin');
            }
            
            if (updates.length > 0) {
                unitRequest.input('id', sql.Int, id);
                await unitRequest.query(`
                    UPDATE UNIDADE_CONSUMO 
                    SET ${updates.join(', ')}
                    WHERE ID_UNIDADE_CONSUMO = @id
                `);
            }
        }
        
        await transaction.commit();
  
        return findById(id);
  
    } catch (err) {
        await transaction.rollback();
        console.error("Transação revertida para updateConsumptionUnit:", err);
        throw err;
    }
};

/**
 * Remove uma unidade de consumo.
 */
export const remove = async (id: number): Promise<boolean> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // Buscar unidade para obter ID do endereço
        const unit = await findById(id);
        if (!unit) {
            return false;
        }
        
        // Deletar UNIDADE_CONSUMO (se houver CASCADE, deleta automaticamente o endereço)
        await transaction.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM UNIDADE_CONSUMO WHERE ID_UNIDADE_CONSUMO = @id');
        
        // Deletar endereço se não houver CASCADE
        // Nota: Ajuste conforme suas regras de negócio
        if (unit.address?.id) {
            await transaction.request()
                .input('id', sql.Int, unit.address.id)
                .query('DELETE FROM ENDERECOS WHERE ID_ENDERECO = @id');
        }
        
        await transaction.commit();
        return true;
        
    } catch (err) {
        await transaction.rollback();
        console.error("Erro ao deletar unidade de consumo:", err);
        throw err;
    }
};