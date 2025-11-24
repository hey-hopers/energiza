import { getPool } from '../config/database';
import { OperadorEnergetico, OperadorEnergeticoInput, Identification } from '../types';
import sql from 'mssql';

/**
 * Query base para buscar operador energético com dados de identificação.
 */
const BASE_OPERADOR_QUERY = `
  SELECT 
    OE.ID_OPERADOR_ENERGETICO,
    OE.ID_IDENTIFICACAO,
    OE.ID_DOCUMENTO,
    OE.ID_PESSOAS_FJ,
    OE.ID_ENDERECO,
    OE.ID_USUARIO,
    -- Dados de IDENTIFICACAO
    I.NOME,
    I.APELIDO,
    I.EMAIL,
    I.TELEFONE
  FROM OPERADOR_ENERGETICO OE
  LEFT JOIN IDENTIFICACAO I ON OE.ID_IDENTIFICACAO = I.ID_IDENTIFICACAO
`;

/**
 * Mapeia um registro do banco para um objeto OperadorEnergetico.
 */
const mapRecordToOperador = (record: any): OperadorEnergetico => {
  // Garantir que sempre temos identificacao, mesmo se os campos vierem null
  const identificacao: Identification | undefined = record.ID_IDENTIFICACAO ? {
    id: record.ID_IDENTIFICACAO,
    name: record.NOME || '',
    nickname: record.APELIDO || undefined,
    email: record.EMAIL || '',
    phone: record.TELEFONE || '',
  } : undefined;

  return {
    id: record.ID_OPERADOR_ENERGETICO,
    identificacaoId: record.ID_IDENTIFICACAO || undefined,
    documentoId: record.ID_DOCUMENTO || undefined,
    pessoasFjId: record.ID_PESSOAS_FJ || undefined,
    enderecoId: record.ID_ENDERECO || undefined,
    usuarioId: record.ID_USUARIO || undefined,
    identificacao,
  };
};

/**
 * Busca o operador energético do usuário logado.
 * Usa o ID_USUARIO que vem da sessão.
 */
export const findByUserId = async (userId: number): Promise<OperadorEnergetico | null> => {
  const pool = await getPool();
  
  try {
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`${BASE_OPERADOR_QUERY} WHERE OE.ID_USUARIO = @userId`);

    if (result.recordset.length === 0) {
      return null;
    }

    const record = result.recordset[0];
    
    // Validar se temos pelo menos o ID do operador
    if (!record.ID_OPERADOR_ENERGETICO) {
      return null;
    }

    return mapRecordToOperador(record);
  } catch (error) {
    console.error('Erro ao buscar operador por userId:', error);
    throw error;
  }
};

/**
 * Cria um novo operador energético.
 */
export const create = async (
  data: OperadorEnergeticoInput,
  userId: number
): Promise<OperadorEnergetico> => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Criar IDENTIFICACAO com os dados do formulário
    const identRequest = new sql.Request(transaction);
    identRequest
      .input('nome', sql.VarChar, data.name)
      .input('email', sql.VarChar, data.email)
      .input('telefone', sql.VarChar, data.phone);

    const identResult = await identRequest.query(`
      INSERT INTO IDENTIFICACAO (NOME, EMAIL, TELEFONE)
      OUTPUT INSERTED.ID_IDENTIFICACAO
      VALUES (@nome, @email, @telefone)
    `);
    const idIdentificacao = identResult.recordset[0].ID_IDENTIFICACAO;

    // 2. Criar OPERADOR_ENERGETICO
    const operadorRequest = new sql.Request(transaction);
    operadorRequest
      .input('idIdentificacao', sql.Int, idIdentificacao)
      .input('idPessoasFj', sql.Int, data.responsiblePersonId ? parseInt(data.responsiblePersonId) : null)
      .input('idUsuario', sql.BigInt, userId);

    const operadorResult = await operadorRequest.query(`
      INSERT INTO OPERADOR_ENERGETICO (ID_IDENTIFICACAO, ID_PESSOAS_FJ, ID_USUARIO)
      OUTPUT INSERTED.ID_OPERADOR_ENERGETICO
      VALUES (@idIdentificacao, @idPessoasFj, @idUsuario)
    `);
    const idOperador = operadorResult.recordset[0].ID_OPERADOR_ENERGETICO;

    await transaction.commit();

    // Buscar o operador criado
    const created = await findById(idOperador);
    if (!created) throw new Error('Falha ao recuperar operador criado.');
    return created;

  } catch (err) {
    await transaction.rollback();
    console.error('Transação revertida para createOperadorEnergetico:', err);
    throw err;
  }
};

/**
 * Busca um operador energético pelo ID.
 */
export const findById = async (id: number): Promise<OperadorEnergetico | null> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`${BASE_OPERADOR_QUERY} WHERE OE.ID_OPERADOR_ENERGETICO = @id`);

  if (result.recordset.length === 0) {
    return null;
  }

  return mapRecordToOperador(result.recordset[0]);
};

/**
 * Atualiza um operador energético existente.
 */
export const update = async (
  id: number,
  data: OperadorEnergeticoInput,
  userId: number
): Promise<OperadorEnergetico | null> => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Buscar operador atual
    const current = await findById(id);
    if (!current || current.usuarioId !== userId) {
      throw new Error('Operador energético não encontrado ou sem permissão.');
    }

    // Atualizar IDENTIFICACAO
    if (current.identificacaoId) {
      const identRequest = new sql.Request(transaction);
      identRequest
        .input('id', sql.Int, current.identificacaoId)
        .input('nome', sql.VarChar, data.name)
        .input('email', sql.VarChar, data.email)
        .input('telefone', sql.VarChar, data.phone);

      await identRequest.query(`
        UPDATE IDENTIFICACAO 
        SET NOME = @nome, EMAIL = @email, TELEFONE = @telefone
        WHERE ID_IDENTIFICACAO = @id
      `);
    } else {
      // Criar nova identificação se não existir
      const identRequest = new sql.Request(transaction);
      identRequest
        .input('nome', sql.VarChar, data.name)
        .input('email', sql.VarChar, data.email)
        .input('telefone', sql.VarChar, data.phone);

      const identResult = await identRequest.query(`
        INSERT INTO IDENTIFICACAO (NOME, EMAIL, TELEFONE)
        OUTPUT INSERTED.ID_IDENTIFICACAO
        VALUES (@nome, @email, @telefone)
      `);
      const newIdIdentificacao = identResult.recordset[0].ID_IDENTIFICACAO;

      // Atualizar FK no OPERADOR_ENERGETICO
      await transaction.request()
        .input('idOperador', sql.Int, id)
        .input('idIdentificacao', sql.Int, newIdIdentificacao)
        .query('UPDATE OPERADOR_ENERGETICO SET ID_IDENTIFICACAO = @idIdentificacao WHERE ID_OPERADOR_ENERGETICO = @idOperador');
    }

    // Atualizar ID_PESSOAS_FJ se fornecido
    if (data.responsiblePersonId !== undefined) {
      const operadorRequest = new sql.Request(transaction);
      operadorRequest
        .input('id', sql.Int, id)
        .input('idPessoasFj', sql.Int, data.responsiblePersonId ? parseInt(data.responsiblePersonId) : null);

      await operadorRequest.query(`
        UPDATE OPERADOR_ENERGETICO 
        SET ID_PESSOAS_FJ = @idPessoasFj
        WHERE ID_OPERADOR_ENERGETICO = @id
      `);
    }

    await transaction.commit();

    return await findById(id);

  } catch (err) {
    await transaction.rollback();
    console.error('Transação revertida para updateOperadorEnergetico:', err);
    throw err;
  }
};