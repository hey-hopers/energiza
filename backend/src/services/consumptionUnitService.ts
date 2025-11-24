import * as consumptionUnitRepository from '../repositories/consumptionUnitRepository';
import { ConsumptionUnit } from '../types';

export const getAllConsumptionUnits = async (): Promise<ConsumptionUnit[]> => {
    return consumptionUnitRepository.findAll();
};

export const getConsumptionUnitById = async (id: number): Promise<ConsumptionUnit | null> => {
    return consumptionUnitRepository.findById(id);
};

export const createConsumptionUnit = async (unitData: Omit<ConsumptionUnit, 'id'>): Promise<ConsumptionUnit> => {
    // Aqui você pode adicionar lógica de negócio, ex: verificar se UC_CODIGO já existe
    return consumptionUnitRepository.create(unitData);
};

export const updateConsumptionUnit = async (id: number, unitData: Partial<Omit<ConsumptionUnit, 'id'>>): Promise<ConsumptionUnit | null> => {
    return consumptionUnitRepository.update(id, unitData);
};

export const deleteConsumptionUnit = async (id: number): Promise<boolean> => {
    return consumptionUnitRepository.remove(id);
};