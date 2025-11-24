// backend/src/types.ts

// These types mirror the frontend types.ts for consistency.
// Maintaining a separate file on the backend is a good practice for decoupling.

/**
 * Representa um endereço completo.
 * Mapeia para a tabela ENDERECOS no banco de dados.
 */
export interface Address {
  id?: number; // ID_ENDERECO (opcional, pois pode não existir ainda)
  cep: string; // CEP
  street: string; // ENDERECO
  number: string; // NUMERO
  complement?: string; // COMPLEMENTO
  reference?: string; // REFERENCIA
  neighborhood: string; // BAIRRO
  postalCode?: string; // CODIGO_POSTAL
  city: string; // CIDADE
  state: string; // ESTADO
  country: string; // PAIS
}

/**
 * Representa um documento de identificação.
 * Mapeia para a tabela DOCUMENTOS no banco de dados.
 */
export interface Document {
  id?: number; // ID_DOCUMENTO (opcional)
  type: string; // NOME_DOCUMENTO (ex: 'CPF', 'CNPJ', 'RG')
  number: string; // NUMERO_DOCUMENTO
  image?: Buffer; // DOCUMENTO_IMAGEM (varbinary)
}

/**
 * Representa informações de identificação de uma pessoa.
 * Mapeia para a tabela IDENTIFICACAO no banco de dados.
 */
export interface Identification {
  id?: number; // ID_IDENTIFICACAO (opcional)
  name: string; // NOME
  nickname?: string; // APELIDO
  email?: string; // EMAIL
  phone?: string; // TELEFONE
  image?: Buffer; // IMAGEM (varbinary)
}


/**
 * Representa uma pessoa (física ou jurídica).
 * 
 * Estrutura no banco:
 * - PESSOAS_FJ: tabela principal com FKs para outras tabelas
 * - IDENTIFICACAO: dados de identificação (nome, email, telefone)
 * - ENDERECOS: dados de endereço
 * - DOCUMENTOS: documentos da pessoa
 * 
 * O repositório faz JOINs para buscar todos os dados relacionados.
 */
export interface Person {
  id: number; // ID_PESSOAS_FJ
  type: string; // TIPO ('Física' ou 'Jurídica')
  nickname?: string; // APELIDO (da tabela PESSOAS_FJ)
  identification: Identification; // Dados da tabela IDENTIFICACAO
  address?: Address; // Dados da tabela ENDERECOS (opcional)
  document?: Document; // Dados da tabela DOCUMENTOS (opcional)
  // Campos opcionais para FKs que podem não estar implementados ainda
  socialNetworksId?: number; // ID_REDES_SOCIAIS
  userId?: number; // ID_USUARIO
}

/**
 * Tipo para criar uma nova pessoa (sem IDs).
 * Usado no repositório para operações de INSERT.
 */
export type CreatePersonInput = Omit<Person, 'id'> & {
  identification: Omit<Identification, 'id'>;
  address?: Omit<Address, 'id'>;
  document?: Omit<Document, 'id'>;
};

/**
 * Tipo para atualizar uma pessoa (todos os campos opcionais exceto id).
 * Usado no repositório para operações de UPDATE.
 */
export type UpdatePersonInput = Partial<Omit<Person, 'id'>> & {
  identification?: Partial<Omit<Identification, 'id'>>;
  address?: Partial<Omit<Address, 'id'>>;
  document?: Partial<Omit<Document, 'id'>>;
};

/**
 * Representa um usuário do sistema.
 * Mapeia para a tabela USUARIO no banco de dados.
 */
export interface Usuario {
  id: number; // ID
  nome: string; // NOME
  email: string; // EMAIL
  senhaHash: string; // SENHA_HASH (não deve ser retornado nas respostas)
  whatsapp?: string; // WHATSAPP
  telefone?: string; // TELEFONE
  dhCadastro: Date; // DH_CADASTRO
  dataNascimento?: Date; // DATA_NASCIMENTO
}

/**
 * Dados de login do usuário.
 */
export interface LoginInput {
  email: string;
  senha: string;
}

/**
 * Dados retornados após login bem-sucedido.
 */
export interface AuthResponse {
  user: Omit<Usuario, 'senhaHash'>;
  token: string;
  sessionId: string;
}

/**
 * Dados de sessão do usuário.
 * Mapeia para a tabela USER_SESSIONS.
 */
export interface UserSession {
  sessionId: string; // SESSION_ID
  userId: number; // USER_ID
  loginTime: Date; // LOGIN_TIME
  lastActivity: Date; // LAST_ACTIVITY
  ipAddress?: string; // IP_ADDRESS
  userAgent?: string; // USER_AGENT
  isActive: boolean; // IS_ACTIVE
}

/**
 * Dados para registro de novo usuário.
 */
export interface RegisterInput {
  nome: string;
  email: string;
  senha: string;
  whatsapp?: string;
  telefone?: string;
  dataNascimento?: Date;
}

/**
 * Representa um Operador Energético (negócio).
 * Mapeia para a tabela OPERADOR_ENERGETICO no banco de dados.
 */
export interface OperadorEnergetico {
  id: number; // ID_OPERADOR_ENERGETICO
  identificacaoId?: number; // ID_IDENTIFICACAO
  documentoId?: number; // ID_DOCUMENTO
  pessoasFjId?: number; // ID_PESSOAS_FJ
  enderecoId?: number; // ID_ENDERECO
  usuarioId?: number; // ID_USUARIO
  // Dados relacionados (populados via JOIN)
  identificacao?: Identification;
}

/**
 * Tipo para criar/atualizar operador energético (baseado no formulário do frontend).
 */
export interface OperadorEnergeticoInput {
  name: string; // Mapeia para IDENTIFICACAO.NOME
  email: string; // Mapeia para IDENTIFICACAO.EMAIL
  phone: string; // Mapeia para IDENTIFICACAO.TELEFONE
  responsiblePersonId?: string | null; // Mapeia para OPERADOR_ENERGETICO.ID_PESSOAS_FJ
}

/**
 * Representa uma distribuidora de energia.
 * Mapeia para a tabela UC_DISTRIBUIDORA no banco de dados.
 */
export interface Distributor {
  id: string; // ID_UC_DISTRIBUIDORA convertido para string
  name: string; // NOME
}

/**
 * Representa uma unidade de consumo.
 * Mapeia para a tabela UNIDADE_CONSUMO no banco de dados.
 */
export interface ConsumptionUnit {
  id: string; // ID_UNIDADE_CONSUMO convertido para string
  name: string; // Nome amigável (usando UC_CODIGO)
  ucCode: string; // UC_CODIGO
  isGenerator: boolean; // EH_GERADORA
  meterNumber: string; // MEDIDOR
  distributorId: string; // ID_UC_DISTRIBUIDORA convertido para string
  address: Address; // Dados da tabela ENDERECOS
  ownerId: string; // ID_PESSOA_FJ_PROPRIETARIO convertido para string
  averageConsumption: number; // Campo não existe na tabela, manter 0
  distributorLogin?: string; // USUARIO_LOGIN
  distributorPassword?: string; // SENHA_LOGIN
  // Campos de leitura não existem na tabela
  lastReadingDate?: string;
  currentReadingDate?: string;
  nextReadingDate?: string;
  lastReading?: number;
  currentReading?: number;
  nextReading?: number;
}

/**
 * Representa uma usina.
 * Mapeia para a tabela UC_USINAS no banco de dados.
 */
export interface PowerPlant {
  id: number; // ID_UC_USINAS
  identification: string; // IDENTIFICACAO
  monthlyLossPercentage?: number; // PERC_PERDA_MES
  consumptionUnitId: number; // ID_UNIDADE_CONSUMO (FK para UNIDADE_CONSUMO)
  kwhGenerated?: number; // KWH_GERADO
  operationTime?: number; // TEMPO_OPERACAO
}