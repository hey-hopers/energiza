import { Request, Response, NextFunction } from 'express';
import * as powerPlantService from '../services/powerPlantService';
import { PowerPlant } from '../types';

interface SuccessResponse<T> {
    success: true;
    data: T;
}

export const getAllPowerPlants = async (
    req: Request,
    res: Response<SuccessResponse<PowerPlant[]>>,
    next: NextFunction
) => {
    try {
        const powerPlants = await powerPlantService.getAllPowerPlants();
        res.status(200).json({ success: true, data: powerPlants });
    } catch (error) {
        next(error);
    }
};

export const getPowerPlantById = async (
    req: Request,
    res: Response<SuccessResponse<PowerPlant>>,
    next: NextFunction
) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido',
            } as any);
        }

        const powerPlant = await powerPlantService.getPowerPlantById(id);
        if (!powerPlant) {
            return res.status(404).json({
                success: false,
                message: 'Usina não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: powerPlant });
    } catch (error) {
        next(error);
    }
};

export const createPowerPlant = async (
    req: Request,
    res: Response<SuccessResponse<PowerPlant>>,
    next: NextFunction
) => {
    try {
        const powerPlant = await powerPlantService.createPowerPlant(req.body);
        res.status(201).json({ success: true, data: powerPlant });
    } catch (error) {
        next(error);
    }
};

export const updatePowerPlant = async (
    req: Request,
    res: Response<SuccessResponse<PowerPlant>>,
    next: NextFunction
) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido',
            } as any);
        }

        const powerPlant = await powerPlantService.updatePowerPlant(id, req.body);
        if (!powerPlant) {
            return res.status(404).json({
                success: false,
                message: 'Usina não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: powerPlant });
    } catch (error) {
        next(error);
    }
};

export const deletePowerPlant = async (
    req: Request,
    res: Response<SuccessResponse<{ message: string }>>,
    next: NextFunction
) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido',
            } as any);
        }

        const deleted = await powerPlantService.deletePowerPlant(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Usina não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: { message: 'Usina excluída com sucesso' } });
    } catch (error) {
        next(error);
    }
};