import { Request, Response, NextFunction } from 'express';
import * as distributorService from '../services/distributorService';
import { Distributor } from '../types';

interface SuccessResponse<T> {
    success: true;
    data: T;
}

export const getAllDistributors = async (
    req: Request,
    res: Response<SuccessResponse<Distributor[]>>,
    next: NextFunction
) => {
    try {
        const distributors = await distributorService.getAllDistributors();
        res.status(200).json({ success: true, data: distributors });
    } catch (error) {
        next(error);
    }
};

export const getDistributorById = async (
    req: Request,
    res: Response<SuccessResponse<Distributor>>,
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

        const distributor = await distributorService.getDistributorById(id);
        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distribuidora não encontrada',
            } as any);
        }

        res.status(200).json({ success: true, data: distributor });
    } catch (error) {
        next(error);
    }
};