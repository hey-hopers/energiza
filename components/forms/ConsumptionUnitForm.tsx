import React, { useState, useEffect, useCallback } from 'react';
import { ConsumptionUnit, Address, Person, Distributor } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ConsumptionUnitFormProps {
  onSubmit: (unit: Omit<ConsumptionUnit, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: ConsumptionUnit | null;
  people: Person[];
  distributors: Distributor[];
  onAddNewOwnerClick: (currentData: Omit<ConsumptionUnit, 'id'>) => void;
}

const initialAddress: Address = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', country: 'Brasil' };
const initialUnitState: Omit<ConsumptionUnit, 'id' | 'name'> = {
    ucCode: '',
    isGenerator: false,
    meterNumber: '',
    distributorId: '',
    address: initialAddress,
    ownerId: '',
    averageConsumption: 0,
    distributorLogin: '',
    distributorPassword: '',
    lastReadingDate: '',
    currentReadingDate: '',
    nextReadingDate: '',
    lastReading: 0,
    currentReading: 0,
    nextReading: 0,
};

const ConsumptionUnitForm: React.FC<ConsumptionUnitFormProps> = ({ onSubmit, onCancel, initialData, people, distributors, onAddNewOwnerClick }) => {
  const [unit, setUnit] = useState(initialUnitState);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const { name, ...restOfData } = initialData;
      setUnit({
          ...initialUnitState,
          ...restOfData,
          lastReadingDate: initialData.lastReadingDate?.split('T')[0] || '',
          currentReadingDate: initialData.currentReadingDate?.split('T')[0] || '',
          nextReadingDate: initialData.nextReadingDate?.split('T')[0] || '',
      });
    } else {
      setUnit(initialUnitState);
    }
  }, [initialData]);

  const handleCepLookup = useCallback(async () => {
    const cep = unit.address.zipCode.replace(/\D/g, '');
    if (cep.length !== 8) {
      setCepError("CEP deve conter 8 dígitos.");
      return;
    }

    setIsCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('Erro na consulta do CEP');
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado.');
      
      setUnit(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          country: 'Brasil'
        }
      }));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Ocorreu um erro.";
        setCepError(`Erro: ${message}`);
        setUnit(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            country: 'Brasil'
          }
        }));
    } finally {
      setIsCepLoading(false);
    }
  }, [unit.address.zipCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setUnit(prev => ({...prev, [name]: checked}));
    } else {
        const numericFields = ['averageConsumption', 'lastReading', 'currentReading', 'nextReading'];
        setUnit(prev => ({ ...prev, [name]: numericFields.includes(name) ? (Number(value) || 0) : value }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUnit(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
    if (name === 'zipCode') {
      setCepError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...unit, name: unit.ucCode, id: initialData?.id });
  };
  
  const selectClassName = "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="ucCode" className="block text-sm font-medium text-gray-700">Código UC</label>
            <Input id="ucCode" name="ucCode" type="text" value={unit.ucCode} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
        <div>
            <label htmlFor="meterNumber" className="block text-sm font-medium text-gray-700">Medidor</label>
            <Input id="meterNumber" name="meterNumber" type="text" value={unit.meterNumber} onChange={handleChange} className="mt-1 rounded-md"/>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="distributorId" className="block text-sm font-medium text-gray-700">Distribuidora</label>
            <select id="distributorId" name="distributorId" value={unit.distributorId} onChange={handleChange} required className={`mt-1 ${selectClassName}`}>
                <option value="" disabled>Selecione...</option>
                {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
        </div>
         <div>
            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">Proprietário</label>
            <select id="ownerId" name="ownerId" value={unit.ownerId} onChange={handleChange} required className={`mt-1 ${selectClassName}`}>
                 <option value="" disabled>Selecione...</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-right mt-1">
                <button
                  type="button"
                  // FIX: Added 'name' property to the object passed to onAddNewOwnerClick to satisfy the expected type.
                  onClick={() => onAddNewOwnerClick({ ...unit, name: unit.ucCode })}
                  className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline focus:outline-none"
                >
                  Deseja cadastrar um novo proprietário?
                </button>
            </div>
        </div>
      </div>

      <div className="flex items-center">
        <input id="isGenerator" name="isGenerator" type="checkbox" checked={unit.isGenerator} onChange={handleChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"/>
        <label htmlFor="isGenerator" className="ml-2 block text-sm text-gray-900">É Geradora</label>
      </div>

      <fieldset className="border-t pt-4">
        <legend className="text-lg font-medium text-secondary">Informações de Acesso da Distribuidora</legend>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="distributorLogin" className="block text-sm font-medium text-gray-700">Usuário de Login</label>
                <Input id="distributorLogin" name="distributorLogin" type="text" value={unit.distributorLogin || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="distributorPassword" className="block text-sm font-medium text-gray-700">Senha de Login</label>
                <Input id="distributorPassword" name="distributorPassword" type="password" value={unit.distributorPassword || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
        </div>
      </fieldset>

      <fieldset className="border-t pt-4">
        <legend className="text-lg font-medium text-secondary">Dados da Leitura</legend>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="lastReadingDate" className="block text-sm font-medium text-gray-700">Data Última Leitura</label>
                <Input id="lastReadingDate" name="lastReadingDate" type="date" value={unit.lastReadingDate || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="currentReadingDate" className="block text-sm font-medium text-gray-700">Data Leitura Atual</label>
                <Input id="currentReadingDate" name="currentReadingDate" type="date" value={unit.currentReadingDate || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="nextReadingDate" className="block text-sm font-medium text-gray-700">Data Proxima Leitura</label>
                <Input id="nextReadingDate" name="nextReadingDate" type="date" value={unit.nextReadingDate || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="lastReading" className="block text-sm font-medium text-gray-700">Ultima Leitura</label>
                <Input id="lastReading" name="lastReading" type="number" step="0.01" value={unit.lastReading || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="currentReading" className="block text-sm font-medium text-gray-700">Leitura Atual</label>
                <Input id="currentReading" name="currentReading" type="number" step="0.01" value={unit.currentReading || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
            <div>
                <label htmlFor="nextReading" className="block text-sm font-medium text-gray-700">Proxima Leitura</label>
                <Input id="nextReading" name="nextReading" type="number" step="0.01" value={unit.nextReading || ''} onChange={handleChange} className="mt-1 rounded-md"/>
            </div>
        </div>
      </fieldset>
      
      <fieldset className="border-t pt-4">
        <legend className="text-lg font-medium text-secondary">Endereço</legend>
        <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">CEP</label>
              <Input 
                id="zipCode" 
                name="zipCode" 
                type="text" 
                value={unit.address.zipCode} 
                onChange={handleAddressChange} 
                onBlur={handleCepLookup} 
                required 
                className="mt-1 rounded-md"
              />
              {isCepLoading && <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>}
              {cepError && <p className="text-xs text-red-600 mt-1">{cepError}</p>}
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">Endereço</label>
              <Input id="street" name="street" type="text" value={unit.address.street} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
              <Input id="neighborhood" name="neighborhood" type="text" value={unit.address.neighborhood} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
              <Input id="city" name="city" type="text" value={unit.address.city} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
              <Input id="state" name="state" type="text" value={unit.address.state} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
              <Input id="country" name="country" type="text" value={unit.address.country} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número</label>
              <Input id="number" name="number" type="text" value={unit.address.number} onChange={handleAddressChange} required className="mt-1 rounded-md"/>
            </div>
            <div>
              <label htmlFor="complement" className="block text-sm font-medium text-gray-700">Complemento</label>
              <Input id="complement" name="complement" type="text" value={unit.address.complement || ''} onChange={handleAddressChange} className="mt-1 rounded-md"/>
            </div>
          </div>
        </div>
      </fieldset>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar Alterações' : 'Criar Unidade'}
        </Button>
      </div>
    </form>
  );
};

export default ConsumptionUnitForm;