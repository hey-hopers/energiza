import * as operadorRepository from '../repositories/operadorEnergeticoRepository';
import { OperadorEnergetico, OperadorEnergeticoInput } from '../types';

export const getByUserId = async (userId: number): Promise<OperadorEnergetico | null> => {
  return operadorRepository.findByUserId(userId);
};

export const create = async (
  data: OperadorEnergeticoInput,
  userId: number
): Promise<OperadorEnergetico> => {
  return operadorRepository.create(data, userId);
};

export const update = async (
  id: number,
  data: OperadorEnergeticoInput,
  userId: number
): Promise<OperadorEnergetico | null> => {
  return operadorRepository.update(id, data, userId);
};