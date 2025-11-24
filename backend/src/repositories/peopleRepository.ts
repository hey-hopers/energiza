// backend/src/repositories/peopleRepository.ts
import { getPool } from '../config/database';
import { Person, Address, Document, Identification } from '../types';
import sql from 'mssql';

/**
 * Mapeia um registro do banco de dados para um objeto Person estruturado.
 * Faz o JOIN entre PESSOAS_FJ, IDENTIFICACAO, ENDERECOS e DOCUMENTOS.
 */
const mapRecordToPerson = (record: any): Person => {
    const identification: Identification = {
        id: record.ID_IDENTIFICACAO,
        name: record.NOME || '',
        nickname: record.APELIDO_IDENTIFICACAO,
        email: record.EMAIL,
        phone: record.TELEFONE,
    };

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
        country: record.PAIS || '',
    } : undefined;

    const document: Document | undefined = record.ID_DOCUMENTO ? {
        id: record.ID_DOCUMENTO,
        type: record.NOME_DOCUMENTO || '',
        number: record.NUMERO_DOCUMENTO || '',
    } : undefined;

    return {
        id: record.ID_PESSOAS_FJ,
        type: record.TIPO || '',
        nickname: record.APELIDO,
        identification,
        address,
        document,
        socialNetworksId: record.ID_REDES_SOCIAIS,
        userId: record.ID_USUARIO,
    };
};

/**
 * Query base para buscar pessoas com todos os dados relacionados.
 * Faz JOINs com IDENTIFICACAO, ENDERECOS e DOCUMENTOS.
 */
const BASE_PERSON_QUERY = `
  SELECT 
    P.ID_PESSOAS_FJ,
    P.APELIDO,
    P.TIPO,
    P.ID_ENDERECO,
    P.ID_DOCUMENTO,
    P.ID_IDENTIFICACAO,
    P.ID_REDES_SOCIAIS,
    P.ID_USUARIO,
    -- Dados de IDENTIFICACAO
    I.NOME,
    I.APELIDO AS APELIDO_IDENTIFICACAO,
    I.EMAIL,
    I.TELEFONE,
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
    E.PAIS,
    -- Dados de DOCUMENTOS
    D.NOME_DOCUMENTO,
    D.NUMERO_DOCUMENTO
  FROM PESSOAS_FJ P
  LEFT JOIN IDENTIFICACAO I ON P.ID_IDENTIFICACAO = I.ID_IDENTIFICACAO
  LEFT JOIN ENDERECOS E ON P.ID_ENDERECO = E.ID_ENDERECO
  LEFT JOIN DOCUMENTOS D ON P.ID_DOCUMENTO = D.ID_DOCUMENTO
`;

/**
 * Busca todas as pessoas.
 */
export const findAll = async (): Promise<Person[]> => {
    const pool = await getPool();
    const result = await pool.request().query(BASE_PERSON_QUERY);
    return result.recordset.map(mapRecordToPerson);
};

/**
 * Busca uma pessoa pelo ID.
 */
export const findById = async (id: number): Promise<Person | null> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`${BASE_PERSON_QUERY} WHERE P.ID_PESSOAS_FJ = @id`);

    if (result.recordset.length === 0) {
        return null;
    }
    return mapRecordToPerson(result.recordset[0]);
};
  

/**
 * Cria uma nova pessoa.
 * Insere nas tabelas IDENTIFICACAO, ENDERECOS, DOCUMENTOS e PESSOAS_FJ.
 */
export const create = async (personData: Omit<Person, 'id'>): Promise<Person> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        
        // 1. Inserir em IDENTIFICACAO
        const identRequest = new sql.Request(transaction);
        identRequest
        .input('nome', sql.VarChar, personData.identification.name)
        .input('apelido', sql.VarChar, personData.identification.nickname || null)
        .input('email', sql.VarChar, personData.identification.email || null)
        .input('telefone', sql.VarChar, personData.identification.phone || null);
        
        const identResult = await identRequest.query(`
        INSERT INTO IDENTIFICACAO (NOME, APELIDO, EMAIL, TELEFONE)
        OUTPUT INSERTED.ID_IDENTIFICACAO
        VALUES (@nome, @apelido, @email, @telefone)
        `);
        const idIdentificacao = identResult.recordset[0].ID_IDENTIFICACAO;

        // 2. Inserir em ENDERECOS (se fornecido)
        let idEndereco: number | null = null;
        if (personData.address) {
        const endRequest = new sql.Request(transaction);
        endRequest
            .input('cep', sql.VarChar, personData.address.cep)
            .input('endereco', sql.VarChar, personData.address.street)
            .input('numero', sql.VarChar, personData.address.number)
            .input('complemento', sql.VarChar, personData.address.complement || null)
            .input('referencia', sql.VarChar, personData.address.reference || null)
            .input('bairro', sql.VarChar, personData.address.neighborhood)
            .input('codigoPostal', sql.VarChar, personData.address.postalCode || null)
            .input('cidade', sql.VarChar, personData.address.city)
            .input('estado', sql.VarChar, personData.address.state)
            .input('pais', sql.VarChar, personData.address.country);
        
        const endResult = await endRequest.query(`
            INSERT INTO ENDERECOS (CEP, ENDERECO, NUMERO, COMPLEMENTO, REFERENCIA, BAIRRO, CODIGO_POSTAL, CIDADE, ESTADO, PAIS)
            OUTPUT INSERTED.ID_ENDERECO
            VALUES (@cep, @endereco, @numero, @complemento, @referencia, @bairro, @codigoPostal, @cidade, @estado, @pais)
        `);
        idEndereco = endResult.recordset[0].ID_ENDERECO;
        }

        // 3. Inserir em DOCUMENTOS (se fornecido)
        let idDocumento: number | null = null;
        if (personData.document) {
        const docRequest = new sql.Request(transaction);
        docRequest
            .input('numeroDocumento', sql.VarChar, personData.document.number)
            .input('nomeDocumento', sql.VarChar, personData.document.type);
        
        const docResult = await docRequest.query(`
            INSERT INTO DOCUMENTOS (NUMERO_DOCUMENTO, NOME_DOCUMENTO)
            OUTPUT INSERTED.ID_DOCUMENTO
            VALUES (@numeroDocumento, @nomeDocumento)
        `);
        idDocumento = docResult.recordset[0].ID_DOCUMENTO;
        }

        // 4. Inserir em PESSOAS_FJ
        const pessoaRequest = new sql.Request(transaction);
        pessoaRequest
        .input('apelido', sql.VarChar, personData.nickname || null)
        .input('tipo', sql.VarChar, personData.type)
        .input('idEndereco', sql.Int, idEndereco)
        .input('idDocumento', sql.Int, idDocumento)
        .input('idIdentificacao', sql.Int, idIdentificacao);
        
        const pessoaResult = await pessoaRequest.query(`
        INSERT INTO PESSOAS_FJ (APELIDO, TIPO, ID_ENDERECO, ID_DOCUMENTO, ID_IDENTIFICACAO)
        OUTPUT INSERTED.ID_PESSOAS_FJ
        VALUES (@apelido, @tipo, @idEndereco, @idDocumento, @idIdentificacao)
        `);
        const idPessoa = pessoaResult.recordset[0].ID_PESSOAS_FJ;

        await transaction.commit();
        
        // Buscar a pessoa criada com todos os dados
        const createdPerson = await findById(idPessoa);
        if (!createdPerson) throw new Error("Falha ao recuperar pessoa criada.");
        return createdPerson;

    } catch (err) {
        await transaction.rollback();
        console.error("Transação revertida para createPerson:", err);
        throw err;
    }
};

/**
 * Atualiza uma pessoa existente.
 */
export const update = async (id: number, personData: Partial<Omit<Person, 'id'>>): Promise<Person | null> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
  
      // Buscar pessoa atual para obter os IDs relacionados
      const currentPerson = await findById(id);
      if (!currentPerson) {
        throw new Error("Pessoa não encontrada.");
      }
  
      // 1. Atualizar IDENTIFICACAO (se fornecido)
      if (personData.identification && currentPerson.identification.id) {
        const identRequest = new sql.Request(transaction);
        const updates: string[] = [];
        
        if (personData.identification.name !== undefined) {
          identRequest.input('nome', sql.VarChar, personData.identification.name);
          updates.push('NOME = @nome');
        }
        if (personData.identification.nickname !== undefined) {
          identRequest.input('apelido', sql.VarChar, personData.identification.nickname);
          updates.push('APELIDO = @apelido');
        }
        if (personData.identification.email !== undefined) {
          identRequest.input('email', sql.VarChar, personData.identification.email);
          updates.push('EMAIL = @email');
        }
        if (personData.identification.phone !== undefined) {
          identRequest.input('telefone', sql.VarChar, personData.identification.phone);
          updates.push('TELEFONE = @telefone');
        }
        
        if (updates.length > 0) {
          identRequest.input('id', sql.Int, currentPerson.identification.id);
          await identRequest.query(`
            UPDATE IDENTIFICACAO 
            SET ${updates.join(', ')}
            WHERE ID_IDENTIFICACAO = @id
          `);
        }
      }
  
      // 2. Atualizar ENDERECOS (se fornecido)
      if (personData.address) {
        if (currentPerson.address?.id) {
          // Atualizar endereço existente
          const endRequest = new sql.Request(transaction);
          const updates: string[] = [];
          
          if (personData.address.cep !== undefined) {
            endRequest.input('cep', sql.VarChar, personData.address.cep);
            updates.push('CEP = @cep');
          }
          if (personData.address.street !== undefined) {
            endRequest.input('endereco', sql.VarChar, personData.address.street);
            updates.push('ENDERECO = @endereco');
          }
          if (personData.address.number !== undefined) {
            endRequest.input('numero', sql.VarChar, personData.address.number);
            updates.push('NUMERO = @numero');
          }
          if (personData.address.complement !== undefined) {
            endRequest.input('complemento', sql.VarChar, personData.address.complement || null);
            updates.push('COMPLEMENTO = @complemento');
          }
          if (personData.address.neighborhood !== undefined) {
            endRequest.input('bairro', sql.VarChar, personData.address.neighborhood);
            updates.push('BAIRRO = @bairro');
          }
          if (personData.address.city !== undefined) {
            endRequest.input('cidade', sql.VarChar, personData.address.city);
            updates.push('CIDADE = @cidade');
          }
          if (personData.address.state !== undefined) {
            endRequest.input('estado', sql.VarChar, personData.address.state);
            updates.push('ESTADO = @estado');
          }
          if (personData.address.country !== undefined) {
            endRequest.input('pais', sql.VarChar, personData.address.country);
            updates.push('PAIS = @pais');
          }
          if (personData.address.postalCode !== undefined) {
            endRequest.input('codigoPostal', sql.VarChar, personData.address.postalCode || null);
            updates.push('CODIGO_POSTAL = @codigoPostal');
          }
          if (personData.address.reference !== undefined) {
            endRequest.input('referencia', sql.VarChar, personData.address.reference || null);
            updates.push('REFERENCIA = @referencia');
          }
          
          if (updates.length > 0) {
            endRequest.input('id', sql.Int, currentPerson.address.id);
            await endRequest.query(`
              UPDATE ENDERECOS 
              SET ${updates.join(', ')}
              WHERE ID_ENDERECO = @id
            `);
          }
        } else {
          // Criar novo endereço
          const endRequest = new sql.Request(transaction);
          endRequest
            .input('cep', sql.VarChar, personData.address.cep || '')
            .input('endereco', sql.VarChar, personData.address.street || '')
            .input('numero', sql.VarChar, personData.address.number || '')
            .input('complemento', sql.VarChar, personData.address.complement || null)
            .input('referencia', sql.VarChar, personData.address.reference || null)
            .input('bairro', sql.VarChar, personData.address.neighborhood || '')
            .input('codigoPostal', sql.VarChar, personData.address.postalCode || null)
            .input('cidade', sql.VarChar, personData.address.city || '')
            .input('estado', sql.VarChar, personData.address.state || '')
            .input('pais', sql.VarChar, personData.address.country || '');
          
          const endResult = await endRequest.query(`
            INSERT INTO ENDERECOS (CEP, ENDERECO, NUMERO, COMPLEMENTO, REFERENCIA, BAIRRO, CODIGO_POSTAL, CIDADE, ESTADO, PAIS)
            OUTPUT INSERTED.ID_ENDERECO
            VALUES (@cep, @endereco, @numero, @complemento, @referencia, @bairro, @codigoPostal, @cidade, @estado, @pais)
          `);
          const newIdEndereco = endResult.recordset[0].ID_ENDERECO;
          
          // Atualizar FK em PESSOAS_FJ
          await transaction.request()
            .input('idPessoa', sql.Int, id)
            .input('idEndereco', sql.Int, newIdEndereco)
            .query('UPDATE PESSOAS_FJ SET ID_ENDERECO = @idEndereco WHERE ID_PESSOAS_FJ = @idPessoa');
        }
      }
  
      // 3. Atualizar DOCUMENTOS (se fornecido) - similar ao endereço
      if (personData.document) {
        if (currentPerson.document?.id) {
          const docRequest = new sql.Request(transaction);
          const updates: string[] = [];
          
          if (personData.document.number !== undefined) {
            docRequest.input('numero', sql.VarChar, personData.document.number);
            updates.push('NUMERO_DOCUMENTO = @numero');
          }
          if (personData.document.type !== undefined) {
            docRequest.input('nome', sql.VarChar, personData.document.type);
            updates.push('NOME_DOCUMENTO = @nome');
          }
          
          if (updates.length > 0) {
            docRequest.input('id', sql.Int, currentPerson.document.id);
            await docRequest.query(`
              UPDATE DOCUMENTOS 
              SET ${updates.join(', ')}
              WHERE ID_DOCUMENTO = @id
            `);
          }
        } else {
          // Criar novo documento
          const docRequest = new sql.Request(transaction);
          docRequest
            .input('numero', sql.VarChar, personData.document.number || '')
            .input('nome', sql.VarChar, personData.document.type || '');
          
          const docResult = await docRequest.query(`
            INSERT INTO DOCUMENTOS (NUMERO_DOCUMENTO, NOME_DOCUMENTO)
            OUTPUT INSERTED.ID_DOCUMENTO
            VALUES (@numero, @nome)
          `);
          const newIdDocumento = docResult.recordset[0].ID_DOCUMENTO;
          
          // Atualizar FK em PESSOAS_FJ
          await transaction.request()
            .input('idPessoa', sql.Int, id)
            .input('idDocumento', sql.Int, newIdDocumento)
            .query('UPDATE PESSOAS_FJ SET ID_DOCUMENTO = @idDocumento WHERE ID_PESSOAS_FJ = @idPessoa');
        }
      }
  
      // 4. Atualizar PESSOAS_FJ
      if (personData.type !== undefined || personData.nickname !== undefined) {
        const pessoaRequest = new sql.Request(transaction);
        const updates: string[] = [];
        
        if (personData.type !== undefined) {
          pessoaRequest.input('tipo', sql.VarChar, personData.type);
          updates.push('TIPO = @tipo');
        }
        if (personData.nickname !== undefined) {
          pessoaRequest.input('apelido', sql.VarChar, personData.nickname);
          updates.push('APELIDO = @apelido');
        }
        
        if (updates.length > 0) {
          pessoaRequest.input('id', sql.Int, id);
          await pessoaRequest.query(`
            UPDATE PESSOAS_FJ 
            SET ${updates.join(', ')}
            WHERE ID_PESSOAS_FJ = @id
          `);
        }
      }
      
      await transaction.commit();
  
      return findById(id);
  
    } catch (err) {
      await transaction.rollback();
      console.error("Transação revertida para updatePerson:", err);
      throw err;
    }
  };

/**
 * Remove uma pessoa.
 * Nota: Dependendo das configurações de FK, pode ser necessário
 * deletar manualmente os registros relacionados.
 */
export const remove = async (id: number): Promise<boolean> => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Buscar pessoa para obter IDs relacionados
      const person = await findById(id);
      if (!person) {
        return false;
      }
      
      // Deletar PESSOAS_FJ (se houver CASCADE, deleta automaticamente)
      await transaction.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM PESSOAS_FJ WHERE ID_PESSOAS_FJ = @id');
      
      // Deletar registros relacionados (se não houver CASCADE)
      // Nota: Ajuste conforme suas regras de negócio
      if (person.identification.id) {
        await transaction.request()
          .input('id', sql.Int, person.identification.id)
          .query('DELETE FROM IDENTIFICACAO WHERE ID_IDENTIFICACAO = @id');
      }
      
      await transaction.commit();
      return true;
      
    } catch (err) {
      await transaction.rollback();
      console.error("Erro ao deletar pessoa:", err);
      throw err;
    }
  };