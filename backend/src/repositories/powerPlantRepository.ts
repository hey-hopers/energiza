import { getPool } from '../config/database';
import { PowerPlant } from '../types';
import sql from 'mssql';

/**
 * Mapeia um registro do banco de dados para um objeto PowerPlant estruturado.
 */
const mapRecordToPowerPlant = (record: any): PowerPlant => {
    return {
        id: record.ID_UC_USINAS,
        identification: record.IDENTIFICACAO,
        monthlyLossPercentage: record.PERC_PERDA_MES,
        consumptionUnitId: record.ID_UNIDADE_CONSUMO,
        kwhGenerated: record.KWH_GERADO,
        operationTime: record.TEMPO_OPERACAO,
    };
};

/**
 * Query base para buscar usinas.
 */
const BASE_POWER_PLANT_QUERY = `
    SELECT 
        ID_UC_USINAS,
        IDENTIFICACAO,
        PERC_PERDA_MES,
        ID_UNIDADE_CONSUMO,
        KWH_GERADO,
        TEMPO_OPERACAO
    FROM UC_USINAS
`;

/**
 * Busca todas as usinas.
 */
export const findAll = async (): Promise<PowerPlant[]> => {
    const pool = await getPool();
    const result = await pool.request().query(BASE_POWER_PLANT_QUERY);
    return result.recordset.map(mapRecordToPowerPlant);
};

/**
 * Busca uma usina pelo ID.
 */
export const findById = async (id: number): Promise<PowerPlant | null> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`${BASE_POWER_PLANT_QUERY} WHERE ID_UC_USINAS = @id`);

    if (result.recordset.length === 0) {
        return null;
    }
    return mapRecordToPowerPlant(result.recordset[0]);
};

/**
 * Cria uma nova usina.
 */
export const create = async (powerPlantData: Omit<PowerPlant, 'id'>): Promise<PowerPlant> => {
    const pool = await getPool();
    const request = pool.request();
    
    request
        .input('identificacao', sql.VarChar, powerPlantData.identification)
        .input('percPerdaMes', sql.Decimal(5, 2), powerPlantData.monthlyLossPercentage || null)
        .input('idUnidadeConsumo', sql.Int, powerPlantData.consumptionUnitId)
        .input('kwhGerado', sql.Int, powerPlantData.kwhGenerated || null)
        .input('tempoOperacao', sql.Int, powerPlantData.operationTime || null);
    
    const result = await request.query(`
        INSERT INTO UC_USINAS (IDENTIFICACAO, PERC_PERDA_MES, ID_UNIDADE_CONSUMO, KWH_GERADO, TEMPO_OPERACAO)
        OUTPUT INSERTED.ID_UC_USINAS
        VALUES (@identificacao, @percPerdaMes, @idUnidadeConsumo, @kwhGerado, @tempoOperacao)
    `);

    const idUsina = result.recordset[0].ID_UC_USINAS;
    const createdPowerPlant = await findById(idUsina);
    if (!createdPowerPlant) throw new Error("Falha ao recuperar usina criada.");
    return createdPowerPlant;
};

/**
 * Atualiza uma usina existente.
 */
export const update = async (id: number, powerPlantData: Partial<Omit<PowerPlant, 'id'>>): Promise<PowerPlant | null> => {
    const pool = await getPool();
    const request = pool.request();
    const updates: string[] = [];

    if (powerPlantData.identification !== undefined) {
        request.input('identificacao', sql.VarChar, powerPlantData.identification);
        updates.push('IDENTIFICACAO = @identificacao');
    }
    if (powerPlantData.monthlyLossPercentage !== undefined) {
        request.input('percPerdaMes', sql.Decimal(5, 2), powerPlantData.monthlyLossPercentage || null);
        updates.push('PERC_PERDA_MES = @percPerdaMes');
    }
    if (powerPlantData.consumptionUnitId !== undefined) {
        request.input('idUnidadeConsumo', sql.Int, powerPlantData.consumptionUnitId);
        updates.push('ID_UNIDADE_CONSUMO = @idUnidadeConsumo');
    }
    if (powerPlantData.kwhGenerated !== undefined) {
        request.input('kwhGerado', sql.Int, powerPlantData.kwhGenerated || null);
        updates.push('KWH_GERADO = @kwhGerado');
    }
    if (powerPlantData.operationTime !== undefined) {
        request.input('tempoOperacao', sql.Int, powerPlantData.operationTime || null);
        updates.push('TEMPO_OPERACAO = @tempoOperacao');
    }

    if (updates.length === 0) {
        return findById(id); // Nada para atualizar
    }

    request.input('id', sql.Int, id);
    await request.query(`
        UPDATE UC_USINAS 
        SET ${updates.join(', ')}
        WHERE ID_UC_USINAS = @id
    `);

    return findById(id);
};

/**
 * Remove uma usina.
 */
export const remove = async (id: number): Promise<boolean> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM UC_USINAS WHERE ID_UC_USINAS = @id');
    
    return result.rowsAffected[0] > 0;
};