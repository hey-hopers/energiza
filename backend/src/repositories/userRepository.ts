import { getPool } from '../config/database';
import { Usuario, UserSession } from '../types';
import sql from 'mssql';

/**
 * Cria um novo usuário.
 */
export const create = async (usuarioData: {
  nome: string;
  email: string;
  senhaHash: string;
  whatsapp?: string;
  telefone?: string;
  dataNascimento?: Date;
}): Promise<Omit<Usuario, 'senhaHash'>> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('nome', sql.VarChar, usuarioData.nome)
    .input('email', sql.VarChar, usuarioData.email)
    .input('senhaHash', sql.VarChar, usuarioData.senhaHash)
    .input('whatsapp', sql.VarChar, usuarioData.whatsapp || null)
    .input('telefone', sql.VarChar, usuarioData.telefone || null)
    .input('dataNascimento', sql.Date, usuarioData.dataNascimento || null)
    .query(`
      INSERT INTO USUARIO (NOME, EMAIL, SENHA_HASH, WHATSAPP, TELEFONE, DATA_NASCIMENTO)
      OUTPUT INSERTED.ID, INSERTED.NOME, INSERTED.EMAIL, INSERTED.WHATSAPP, INSERTED.TELEFONE, INSERTED.DH_CADASTRO, INSERTED.DATA_NASCIMENTO
      VALUES (@nome, @email, @senhaHash, @whatsapp, @telefone, @dataNascimento)
    `);

  const record = result.recordset[0];
  return {
    id: record.ID,
    nome: record.NOME,
    email: record.EMAIL,
    whatsapp: record.WHATSAPP,
    telefone: record.TELEFONE,
    dhCadastro: record.DH_CADASTRO,
    dataNascimento: record.DATA_NASCIMENTO,
  };
};

/**
 * Busca um usuário pelo email.
 */
export const findByEmail = async (email: string): Promise<Usuario | null> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`
      SELECT 
        ID,
        NOME,
        EMAIL,
        SENHA_HASH,
        WHATSAPP,
        TELEFONE,
        DH_CADASTRO,
        DATA_NASCIMENTO
      FROM USUARIO
      WHERE EMAIL = @email
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const record = result.recordset[0];
  return {
    id: record.ID,
    nome: record.NOME,
    email: record.EMAIL,
    senhaHash: record.SENHA_HASH,
    whatsapp: record.WHATSAPP,
    telefone: record.TELEFONE,
    dhCadastro: record.DH_CADASTRO,
    dataNascimento: record.DATA_NASCIMENTO,
  };
};

/**
 * Busca um usuário pelo ID.
 */
export const findById = async (id: number): Promise<Omit<Usuario, 'senhaHash'> | null> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        ID,
        NOME,
        EMAIL,
        WHATSAPP,
        TELEFONE,
        DH_CADASTRO,
        DATA_NASCIMENTO
      FROM USUARIO
      WHERE ID = @id
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const record = result.recordset[0];
  return {
    id: record.ID,
    nome: record.NOME,
    email: record.EMAIL,
    whatsapp: record.WHATSAPP,
    telefone: record.TELEFONE,
    dhCadastro: record.DH_CADASTRO,
    dataNascimento: record.DATA_NASCIMENTO,
  };
};

/**
 * Cria uma nova sessão de usuário.
 */
export const createSession = async (
  sessionId: string,
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<UserSession> => {
  const pool = await getPool();
  const now = new Date();
  
  await pool.request()
    .input('sessionId', sql.VarChar, sessionId)
    .input('userId', sql.Int, userId)
    .input('loginTime', sql.DateTime, now)
    .input('lastActivity', sql.DateTime, now)
    .input('ipAddress', sql.VarChar, ipAddress || null)
    .input('userAgent', sql.VarChar, userAgent || null)
    .query(`
      INSERT INTO USER_SESSIONS (SESSION_ID, USER_ID, LOGIN_TIME, LAST_ACTIVITY, IP_ADDRESS, USER_AGENT, IS_ACTIVE)
      VALUES (@sessionId, @userId, @loginTime, @lastActivity, @ipAddress, @userAgent, 1)
    `);

  return {
    sessionId,
    userId,
    loginTime: now,
    lastActivity: now,
    ipAddress,
    userAgent,
    isActive: true,
  };
};

/**
 * Busca uma sessão pelo ID.
 */
export const findSessionById = async (sessionId: string): Promise<UserSession | null> => {
  const pool = await getPool();
  const result = await pool.request()
    .input('sessionId', sql.VarChar, sessionId)
    .query(`
      SELECT 
        SESSION_ID,
        USER_ID,
        LOGIN_TIME,
        LAST_ACTIVITY,
        IP_ADDRESS,
        USER_AGENT,
        IS_ACTIVE
      FROM USER_SESSIONS
      WHERE SESSION_ID = @sessionId AND IS_ACTIVE = 1
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const record = result.recordset[0];
  return {
    sessionId: record.SESSION_ID,
    userId: record.USER_ID,
    loginTime: record.LOGIN_TIME,
    lastActivity: record.LAST_ACTIVITY,
    ipAddress: record.IP_ADDRESS,
    userAgent: record.USER_AGENT,
    isActive: record.IS_ACTIVE,
  };
};

/**
 * Atualiza a última atividade de uma sessão.
 */
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const pool = await getPool();
  await pool.request()
    .input('sessionId', sql.VarChar, sessionId)
    .input('lastActivity', sql.DateTime, new Date())
    .query(`
      UPDATE USER_SESSIONS
      SET LAST_ACTIVITY = @lastActivity
      WHERE SESSION_ID = @sessionId
    `);
};

/**
 * Invalida uma sessão (logout).
 */
export const invalidateSession = async (sessionId: string): Promise<void> => {
  const pool = await getPool();
  await pool.request()
    .input('sessionId', sql.VarChar, sessionId)
    .query(`
      UPDATE USER_SESSIONS
      SET IS_ACTIVE = 0
      WHERE SESSION_ID = @sessionId
    `);
};

/**
 * Invalida todas as sessões ativas.
 */
export const invalidateAllSessions = async (): Promise<void> => {
  const pool = await getPool();
  await pool.request()
    .query(`
      UPDATE USER_SESSIONS
      SET IS_ACTIVE = 0
      WHERE IS_ACTIVE = 1
    `);
};