import { z } from 'zod';

export const createPowerPlantSchema = z.object({
    body: z.object({
        identification: z.string().min(1, 'A identificação da usina é obrigatória.'),
        monthlyLossPercentage: z.number().min(0).max(100).optional().nullable(),
        consumptionUnitId: z.number().int().positive('O ID da unidade de consumo deve ser um número inteiro positivo.'),
        kwhGenerated: z.number().int().positive('O kWh gerado deve ser um número inteiro positivo.').optional().nullable(),
        operationTime: z.number().int().positive('O tempo de operação deve ser um número inteiro positivo.').optional().nullable(),
    }),
});

export const updatePowerPlantSchema = z.object({
    body: z.object({
        identification: z.string().min(1, 'A identificação da usina é obrigatória.').optional(),
        monthlyLossPercentage: z.number().min(0).max(100).optional().nullable(),
        consumptionUnitId: z.number().int().positive('O ID da unidade de consumo deve ser um número inteiro positivo.').optional(),
        kwhGenerated: z.number().int().positive('O kWh gerado deve ser um número inteiro positivo.').optional().nullable(),
        operationTime: z.number().int().positive('O tempo de operação deve ser um número inteiro positivo.').optional().nullable(),
    }),
    params: z.object({
        id: z.string().min(1, 'ID da usina é obrigatório.'),
    }),
});