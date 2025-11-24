export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Document {
  type: 'CPF' | 'CNPJ' | 'RG';
  number: string;
}

export interface Person {
  id: string;
  name: string;
  nickname: string;
  personType: 'Física' | 'Jurídica';
  email: string;
  phone: string;
  birthDate?: string;
  address: Address;
  documents: Document[];
  createdAt: string;
}

export interface ConsumptionUnit {
  id: string;
  name: string; // Friendly name
  ucCode: string; // Unique code
  isGenerator: boolean;
  meterNumber: string;
  distributorId: string;
  address: Address;
  ownerId: string;
  averageConsumption: number; // in kWh
  distributorLogin?: string;
  distributorPassword?: string;
  lastReadingDate?: string;
  currentReadingDate?: string;
  nextReadingDate?: string;
  lastReading?: number;
  currentReading?: number;
  nextReading?: number;
}

export interface Distribution {
  consumptionUnitId: string;
  percentage: number;
}

export interface PowerPlant {
  id: string;
  name: string; // 'Identificação'
  consumptionUnitId: string;
  monthlyLossPercentage: number;
  generatedKwh: number;
  operatingYears: number;
  distribution: Distribution[];
}

export type InvoiceStatus = 'gerada' | 'enviada' | 'pendente' | 'paga' | 'protestada';

export interface Invoice {
  id: string;
  consumptionUnitId: string;
  referenceDate: string; // "YYYY-MM" format
  dueDate: string; // "YYYY-MM-DD" format
  amount: number;
  status: InvoiceStatus;
  observation?: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  responsiblePersonId: string | null;
}

export interface Distributor {
    id: string;
    name: string;
}