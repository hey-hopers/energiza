// backend/src/validators/peopleValidator.ts
import { z } from 'zod';

const addressSchema = z.object({
  cep: z.string().min(1, 'CEP é obrigatório'),
  street: z.string().min(1, 'Endereço é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  reference: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  postalCode: z.string().optional(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  country: z.string().min(1, 'País é obrigatório'),
});

const documentSchema = z.object({
  type: z.string().min(1, 'Tipo de documento é obrigatório'), // NOME_DOCUMENTO
  number: z.string().min(1, 'Número do documento é obrigatório'), // NUMERO_DOCUMENTO
});

const identificationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  nickname: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
});

export const createPersonSchema = z.object({
  body: z.object({
    type: z.string().min(1, 'Tipo de pessoa é obrigatório'), // 'Física' ou 'Jurídica'
    nickname: z.string().optional(),
    identification: identificationSchema,
    address: addressSchema.optional(),
    document: documentSchema.optional(),
  }),
});

export const updatePersonSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    nickname: z.string().optional(),
    identification: identificationSchema.partial().optional(),
    address: addressSchema.partial().optional(),
    document: documentSchema.partial().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID da pessoa é obrigatório'),
  })
});