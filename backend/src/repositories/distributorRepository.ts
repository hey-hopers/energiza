import { getPool } from '../config/database';
import { Distributor } from '../types';
import sql from 'mssql';

/**
 * Mapeia um registro do banco de dados para um objeto Distributor.
 */
const mapRecordToDistributor = (record: any): Distributor => {
    return {
        id: record.ID_UC_DISTRIBUIDORA.toString(),
        name: record.NOME || '',
    };
};

/**
 * Busca todas as distribuidoras.
 */
export const findAll = async (): Promise<Distributor[]> => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT ID_UC_DISTRIBUIDORA, NOME
        FROM UC_DISTRIBUIDORA
        ORDER BY NOME
    `);
    return result.recordset.map(mapRecordToDistributor);
};

/**
 * Busca uma distribuidora pelo ID.
 */
export const findById = async (id: number): Promise<Distributor | null> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT ID_UC_DISTRIBUIDORA, NOME
            FROM UC_DISTRIBUIDORA
            WHERE ID_UC_DISTRIBUIDORA = @id
        `);

    if (result.recordset.length === 0) {
        return null;
    }
    return mapRecordToDistributor(result.recordset[0]);
};