// backend/src/services/peopleService.ts
import * as peopleRepository from '../repositories/peopleRepository';
import { Person } from '../types';

export const getAllPeople = async (): Promise<Person[]> => {
  return peopleRepository.findAll();
};

export const getPersonById = async (id: number): Promise<Person | null> => {
  return peopleRepository.findById(id);
};

export const createPerson = async (personData: Omit<Person, 'id'>): Promise<Person> => {
  // Aqui você pode adicionar lógica de negócio, ex: verificar se email já existe
  return peopleRepository.create(personData);
};

export const updatePerson = async (id: number, personData: Partial<Omit<Person, 'id'>>): Promise<Person | null> => {
  return peopleRepository.update(id, personData);
};

export const deletePerson = async (id: number): Promise<boolean> => {
  return peopleRepository.remove(id);
};