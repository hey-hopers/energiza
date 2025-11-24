import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as userRepository from '../repositories/userRepository';
import { LoginInput, AuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Autentica um usuário e retorna token e sessão.
 */
export const login = async (
  loginData: LoginInput,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponse> => {
  // Buscar usuário pelo email
  const usuario = await userRepository.findByEmail(loginData.email);
  
  if (!usuario) {
    throw new Error('Email ou senha inválidos');
  }

  // Verificar senha
  const senhaValida = await bcrypt.compare(loginData.senha, usuario.senhaHash);
  
  if (!senhaValida) {
    throw new Error('Email ou senha inválidos');
  }

  // Gerar token JWT
  const token = jwt.sign(
    { userId: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Criar sessão
  const sessionId = uuidv4();
  await userRepository.createSession(sessionId, usuario.id, ipAddress, userAgent);

  // Retornar dados do usuário (sem senha) e token
  const { senhaHash, ...userWithoutPassword } = usuario;
  
  return {
    user: userWithoutPassword,
    token,
    sessionId,
  };
};

/**
 * Valida um token JWT e retorna os dados do usuário.
 */
export const validateToken = async (token: string): Promise<{ userId: number; email: string }> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

/**
 * Registra um novo usuário.
 */
export const register = async (
  registerData: {
    nome: string;
    email: string;
    senha: string;
    whatsapp?: string;
    telefone?: string;
    dataNascimento?: Date;
  }
): Promise<Omit<Usuario, 'senhaHash'>> => {
  // Verificar se o email já existe
  const existingUser = await userRepository.findByEmail(registerData.email);
  
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  // Hash da senha
  const saltRounds = 10;
  const senhaHash = await bcrypt.hash(registerData.senha, saltRounds);

  // Criar usuário
  const novoUsuario = await userRepository.create({
    nome: registerData.nome,
    email: registerData.email,
    senhaHash,
    whatsapp: registerData.whatsapp,
    telefone: registerData.telefone,
    dataNascimento: registerData.dataNascimento,
  });

  return novoUsuario;
};

/**
 * Busca dados do usuário pelo ID.
 */
export const getUserById = async (id: number) => {
  return await userRepository.findById(id);
};

/**
 * Faz logout invalidando a sessão.
 */
export const logout = async (sessionId: string): Promise<void> => {
  await userRepository.invalidateSession(sessionId);
};