import { Response, NextFunction } from 'express';
import * as operadorService from '../services/operadorEnergeticoService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Converte OperadorEnergetico para formato Business do frontend
const mapToBusiness = (operador: any) => {
  // Garantir que sempre retorna um objeto válido, mesmo se identificacao for null
  if (!operador || !operador.identificacao) {
    return {
      id: operador?.id?.toString() || '',
      name: '',
      email: '',
      phone: '',
      responsiblePersonId: operador?.pessoasFjId ? operador.pessoasFjId.toString() : null,
    };
  }

  return {
    id: operador.id.toString(),
    name: operador.identificacao.name || '',
    email: operador.identificacao.email || '',
    phone: operador.identificacao.phone || '',
    responsiblePersonId: operador.pessoasFjId ? operador.pessoasFjId.toString() : null,
  };
};

export const getMyOperador = async (
  req: AuthenticatedRequest,
  res: Response<SuccessResponse<any>>,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const operador = await operadorService.getByUserId(userId);
    
    if (!operador) {
      // Retornar objeto vazio em vez de null para o frontend poder trabalhar
      return res.status(200).json({ 
        success: true, 
        data: {
          id: '',
          name: '',
          email: '',
          phone: '',
          responsiblePersonId: null,
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      data: mapToBusiness(operador) 
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateOperador = async (
  req: AuthenticatedRequest,
  res: Response<SuccessResponse<any>>,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    
    // Verificar se já existe operador para este usuário
    const existing = await operadorService.getByUserId(userId);
    
    let operador;
    if (existing) {
      // Atualizar existente
      operador = await operadorService.update(existing.id, req.body, userId);
    } else {
      // Criar novo
      operador = await operadorService.create(req.body, userId);
    }

    if (!operador) {
      return res.status(404).json({ 
        success: false, 
        message: 'Erro ao salvar operador energético' 
      } as any);
    }

    res.status(200).json({ 
      success: true, 
      data: mapToBusiness(operador) 
    });
  } catch (error) {
    next(error);
  }
};