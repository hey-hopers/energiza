import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import * as userRepository from '../repositories/userRepository';

export interface AuthenticatedRequest extends Request {
  user?: any;
  sessionId?: string;
}

/**
 * Middleware para verificar autenticação via JWT token e sessão.
 * Obtém o USER_ID da tabela USER_SESSIONS.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
    }

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session ID não fornecido',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
    // Validar token JWT
    const decoded = await authService.validateToken(token);
    
    // Buscar sessão e obter USER_ID da tabela USER_SESSIONS
    const session = await userRepository.findSessionById(sessionId);
    
    if (!session || !session.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida ou expirada',
      });
    }

    // Verificar se o USER_ID da sessão corresponde ao do token
    if (session.userId !== decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Sessão não corresponde ao usuário',
      });
    }

    // Buscar dados completos do usuário usando o USER_ID da sessão
    const user = await userRepository.findById(session.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Adicionar usuário e sessionId à requisição
    req.user = user;
    req.sessionId = sessionId;
    
    // Atualizar última atividade da sessão
    await userRepository.updateSessionActivity(sessionId);

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido',
    });
  }
};