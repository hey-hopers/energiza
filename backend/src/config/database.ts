// backend/src/config/database.ts
import './dotenv'; // Load environment variables
import sql from 'mssql';

const sqlConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 1433,
  pool: {
    max: 10, // Máximo de conexões no pool
    min: 0, // Mínimo de conexões no pool
    idleTimeoutMillis: 30000 // Tempo de espera antes de fechar conexões inativas
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure SQL Database, or if you have a certificate
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || false, // true para desenvolvimento local
    enableArithAbort: true, // Recomendado para melhor performance
    requestTimeout: 30000 // Timeout de requisição em ms // Change to false for production with a trusted certificate
  }
};

let pool: sql.ConnectionPool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(sqlConfig).connect();
      console.log('Connected to SQL Server');
    }
    return pool;
  } catch (err) {
    console.error('Database Connection Failed', err);
    // Exit process with failure
    process.exit(1);
  }
};

export const getPool = async () => {
  if (!pool || !pool.connected) {
    return await connectDB();
  }
  return pool;
};

export const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null as any;
    console.log('Conexão com o banco de dados fechada');
  }
};

// Immediately connect on startup
connectDB();