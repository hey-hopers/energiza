import * as powerPlantRepository from '../repositories/powerPlantRepository';
import { PowerPlant } from '../types';

export const getAllPowerPlants = async (): Promise<PowerPlant[]> => {
    return powerPlantRepository.findAll();
};

export const getPowerPlantById = async (id: number): Promise<PowerPlant | null> => {
    return powerPlantRepository.findById(id);
};

export const createPowerPlant = async (powerPlantData: Omit<PowerPlant, 'id'>): Promise<PowerPlant> => {
    // Adicionar lógica de negócio aqui, se necessário
    return powerPlantRepository.create(powerPlantData);
};

export const updatePowerPlant = async (id: number, powerPlantData: Partial<Omit<PowerPlant, 'id'>>): Promise<PowerPlant | null> => {
    return powerPlantRepository.update(id, powerPlantData);
};

export const deletePowerPlant = async (id: number): Promise<boolean> => {
    return powerPlantRepository.remove(id);
};