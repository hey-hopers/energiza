import * as distributorRepository from '../repositories/distributorRepository';
import { Distributor } from '../types';

export const getAllDistributors = async (): Promise<Distributor[]> => {
    return distributorRepository.findAll();
};

export const getDistributorById = async (id: number): Promise<Distributor | null> => {
    return distributorRepository.findById(id);
};