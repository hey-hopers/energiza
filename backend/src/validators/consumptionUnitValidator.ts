import { z } from 'zod';

const addressSchema = z.object({
    cep: z.string().optional().nullable(), // Adicionado .nullable()
    zipCode: z.string().min(1, 'CEP é obrigatório').optional().nullable(), // Adicionado .nullable()
    street: z.string().min(1, 'Endereço é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional().nullable(), // Adicionado .nullable()
    reference: z.string().optional().nullable(), // Adicionado .nullable()
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    postalCode: z.string().optional().nullable(), // Adicionado .nullable()
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    country: z.string().min(1, 'País é obrigatório').nullable(), // Adicionado .nullable()
});

export const createConsumptionUnitSchema = z.object({
    body: z.object({
        ucCode: z.string().min(1, 'Código UC é obrigatório'),
        isGenerator: z.boolean().default(false),
        meterNumber: z.string().min(1, 'Número do medidor é obrigatório'),
        distributorId: z.string().min(1, 'Distribuidora é obrigatória'),
        address: addressSchema,
        ownerId: z.string().min(1, 'Proprietário é obrigatório'),
        distributorLogin: z.string().optional().nullable(), // Adicionado .nullable()
        distributorPassword: z.string().optional().nullable(), // Adicionado .nullable()
        // Campos opcionais de leitura
        lastReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        currentReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        nextReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        lastReading: z.number().optional().nullable(), // Adicionado .nullable()
        currentReading: z.number().optional().nullable(), // Adicionado .nullable()
        nextReading: z.number().optional().nullable(), // Adicionado .nullable()
    }),
});

export const updateConsumptionUnitSchema = z.object({
    body: z.object({
        ucCode: z.string().optional(),
        isGenerator: z.boolean().optional(),
        meterNumber: z.string().optional(),
        distributorId: z.string().optional(),
        address: addressSchema.partial().optional(),
        ownerId: z.string().optional(),
        distributorLogin: z.string().optional().nullable(), // Adicionado .nullable()
        distributorPassword: z.string().optional().nullable(), // Adicionado .nullable()
        lastReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        currentReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        nextReadingDate: z.string().optional().nullable(), // Adicionado .nullable()
        lastReading: z.number().optional().nullable(), // Adicionado .nullable()
        currentReading: z.number().optional().nullable(), // Adicionado .nullable()
        nextReading: z.number().optional().nullable(), // Adicionado .nullable()
    }),
    params: z.object({
        id: z.string().min(1, 'ID da unidade de consumo é obrigatório'),
    })
});