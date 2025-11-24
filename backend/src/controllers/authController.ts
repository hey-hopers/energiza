import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

export const register = async (
  req: Request,
  res: Response<SuccessResponse<{ user: any }>>,
  next: NextFunction
) => {
  try {
    const { nome, email, senha, whatsapp, telefone, dataNascimento } = req.body;
    
    const novoUsuario = await authService.register({
      nome,
      email,
      senha,
      whatsapp,
      telefone,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
    });

    res.status(201).json({
      success: true,
      data: { user: novoUsuario },
    });
  } catch (error: any) {
    if (error.message === 'Email já cadastrado') {
      return res.status(409).json({
        success: false,
        message: error.message,
      } as any);
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response<SuccessResponse<{ user: any; token: string; sessionId: string }>>,
  next: NextFunction
) => {
  try {
    const { email, senha } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;
    const userAgent = req.headers['user-agent'];

    const authResponse = await authService.login(
      { email, senha },
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      data: authResponse,
    });
  } catch (error: any) {
    if (error.message === 'Email ou senha inválidos') {
      return res.status(401).json({
        success: false,
        message: error.message,
      } as any);
    }
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response<SuccessResponse<any>>,
  next: NextFunction
) => {
  try {
    // O middleware de autenticação adiciona req.user
    const user = (req as any).user;
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = (req as any).sessionId;
    if (sessionId) {
      await authService.logout(sessionId);
    }
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};