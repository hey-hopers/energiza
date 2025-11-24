import { Request, Response, NextFunction } from 'express';
import * as consumptionUnitService from '../services/consumptionUnitService';
import { ConsumptionUnit } from '../types';

interface SuccessResponse<T> {
    success: true;
    data: T;
}

export const getAllConsumptionUnits = async (
    req: Request,
    res: Response<SuccessResponse<ConsumptionUnit[]>>,
    next: NextFunction
) => {
    try {
        const units = await consumptionUnitService.getAllConsumptionUnits();
        res.status(200).json({ success: true, data: units });
    } catch (error) {
        next(error);
    }
};

export const getConsumptionUnitById = async (
    req: Request,
    res: Response<SuccessResponse<ConsumptionUnit>>,
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

        const unit = await consumptionUnitService.getConsumptionUnitById(id);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unidade de consumo não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

export const createConsumptionUnit = async (
    req: Request,
    res: Response<SuccessResponse<ConsumptionUnit>>,
    next: NextFunction
) => {
    try {
        const unit = await consumptionUnitService.createConsumptionUnit(req.body);
        res.status(201).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

export const updateConsumptionUnit = async (
    req: Request,
    res: Response<SuccessResponse<ConsumptionUnit>>,
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

        const unit = await consumptionUnitService.updateConsumptionUnit(id, req.body);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unidade de consumo não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

export const deleteConsumptionUnit = async (
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

        const deleted = await consumptionUnitService.deleteConsumptionUnit(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Unidade de consumo não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: { message: 'Unidade de consumo excluída com sucesso' } });
    } catch (error) {
        next(error);
    }
};