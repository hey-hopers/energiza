// backend/src/controllers/peopleController.ts
import { Request, Response, NextFunction } from 'express';
import * as peopleService from '../services/peopleService';
import { Person } from '../types';

// Standardized success response structure
interface SuccessResponse<T> {
  success: true;
  data: T;
}

export const getAllPeople = async (req: Request, res: Response<SuccessResponse<Person[]>>, next: NextFunction) => {
  try {
    const people = await peopleService.getAllPeople();
    res.status(200).json({ success: true, data: people });
  } catch (error) {
    next(error);
  }
};

export const getPersonById = async (req: Request, res: Response<SuccessResponse<Person>>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' } as any);
    }
    
    const person = await peopleService.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Pessoa não encontrada' } as any);
    }
    res.status(200).json({ success: true, data: person });
  } catch (error) {
    next(error);
  }
};

export const createPerson = async (req: Request, res: Response<SuccessResponse<Person>>, next: NextFunction) => {
  try {
    const newPerson = await peopleService.createPerson(req.body);
    res.status(201).json({ success: true, data: newPerson });
  } catch (error) {
    next(error);
  }
};

export const updatePerson = async (req: Request, res: Response<SuccessResponse<Person>>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' } as any);
    }
    
    const updatedPerson = await peopleService.updatePerson(personId, req.body);
    if (!updatedPerson) {
      return res.status(404).json({ success: false, message: 'Pessoa não encontrada' } as any);
    }
    res.status(200).json({ success: true, data: updatedPerson });
  } catch (error) {
    next(error);
  }
};

export const deletePerson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id, 10);
    
    if (isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    
    const success = await peopleService.deletePerson(personId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Pessoa não encontrada' });
    }
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};