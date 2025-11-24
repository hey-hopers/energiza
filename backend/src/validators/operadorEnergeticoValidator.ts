import { z } from 'zod';

export const operadorEnergeticoSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'Telefone é obrigatório'),
    responsiblePersonId: z.string().nullable().optional(),
  }),
});