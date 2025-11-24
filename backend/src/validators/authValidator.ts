import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    whatsapp: z.string().optional(),
    telefone: z.string().optional(),
    dataNascimento: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  }),
});