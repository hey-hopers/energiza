import React, { useState, useEffect, useCallback } from 'react';
import { Person, Address, Document } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PersonFormProps {
  onSubmit: (person: Omit<Person, 'id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Person | null;
}

const initialAddress: Address = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', country: 'Brasil' };
const initialDocument: Document = { type: 'CPF', number: '' };
const initialPersonState: Omit<Person, 'id' | 'createdAt'> = {
    name: '',
    nickname: '',
    personType: 'Física',
    email: '',
    phone: '',
    birthDate: '',
    address: initialAddress,
    documents: [initialDocument],
};

const PersonForm: React.FC<PersonFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [person, setPerson] = useState(initialPersonState);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const doc = initialData.documents && initialData.documents.length > 0 ? initialData.documents[0] : initialDocument;
      const { id, createdAt, ...formData } = initialData;
      setPerson({ ...initialPersonState, ...formData, documents: [doc] });
    } else {
      setPerson(initialPersonState);
    }
  }, [initialData]);
  
  const handleCepLookup = useCallback(async () => {
    const cep = person.address.zipCode.replace(/\D/g, '');
    if (cep.length !== 8) {
      setCepError("CEP deve conter 8 dígitos.");
      return;
    }

    setIsCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP não encontrado.');
      }
      setPerson(prev => ({
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
        setPerson(prev => ({ ...prev, address: { ...prev.address, street: '', neighborhood: '', city: '', state: '' }}));
    } finally {
      setIsCepLoading(false);
    }
  }, [person.address.zipCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPerson(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target as { value: 'Física' | 'Jurídica' };
    setPerson(prev => {
        const newDocType = value === 'Física' ? 'CPF' : 'CNPJ';
        return {
            ...prev,
            personType: value,
            documents: [{...prev.documents[0], type: newDocType, number: ''}]
        }
    });
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPerson(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPerson(prev => ({
      ...prev,
      documents: [{ ...prev.documents[0], [name]: value }],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...person, id: initialData?.id });
  };
  
  const selectClassName = "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</legend>
        <div className="flex items-center space-x-4">
            <div className="flex items-center">
                <input id="fisica" name="personType" type="radio" value="Física" checked={person.personType === 'Física'} onChange={handlePersonTypeChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" />
                <label htmlFor="fisica" className="ml-2 block text-sm text-gray-900">Física</label>
            </div>
            <div className="flex items-center">
                <input id="juridica" name="personType" type="radio" value="Jurídica" checked={person.personType === 'Jurídica'} onChange={handlePersonTypeChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300" />
                <label htmlFor="juridica" className="ml-2 block text-sm text-gray-900">Jurídica</label>
            </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {person.personType === 'Física' ? 'Nome' : 'Razão Social'}
          </label>
          <Input id="name" name="name" type="text" value={person.name} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
             {person.personType === 'Física' ? 'Apelido' : 'Nome Fantasia'}
          </label>
          <Input id="nickname" name="nickname" type="text" value={person.nickname} onChange={handleChange} className="mt-1 rounded-md"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo Documento</label>
            <select id="type" name="type" value={person.documents[0].type} onChange={handleDocumentChange} required className={`mt-1 ${selectClassName}`}>
                {person.personType === 'Física' ? (
                    <>
                        <option value="CPF">CPF</option>
                        <option value="RG">RG</option>
                    </>
                ) : (
                    <option value="CNPJ">CNPJ</option>
                )}
            </select>
        </div>
        <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número do Documento</label>
            <Input id="number" name="number" type="text" value={person.documents[0].number} onChange={handleDocumentChange} required className="mt-1 rounded-md"/>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <Input id="email" name="email" type="email" value={person.email} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <Input id="phone" name="phone" type="tel" value={person.phone} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
      </div>
      
      {person.personType === 'Física' && (
        <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
            <Input 
                id="birthDate" 
                name="birthDate" 
                type="date" 
                value={person.birthDate?.split('T')[0] || ''} 
                onChange={handleChange} 
                className="mt-1 rounded-md"
            />
        </div>
      )}

      <fieldset className="border-t pt-4 mt-4">
        <legend className="text-md font-medium text-secondary">Endereço</legend>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">CEP</label>
                <Input id="zipCode" name="zipCode" type="text" value={person.address.zipCode} onChange={handleAddressChange} onBlur={handleCepLookup} required className="mt-1 rounded-md"/>
                {isCepLoading && <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>}
                {cepError && <p className="text-xs text-red-600 mt-1">{cepError}</p>}
            </div>
             <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">Endereço</label>
                <Input id="street" name="street" type="text" value={person.address.street} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
             <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
                <Input id="neighborhood" name="neighborhood" type="text" value={person.address.neighborhood} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                <Input id="city" name="city" type="text" value={person.address.city} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                <Input id="state" name="state" type="text" value={person.address.state} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
                <Input id="country" name="country" type="text" value={person.address.country} onChange={handleAddressChange} required className="mt-1 rounded-md bg-gray-50" readOnly/>
            </div>
            <div>
                <label htmlFor="address_number" className="block text-sm font-medium text-gray-700">Número</label>
                <Input id="address_number" name="number" type="text" value={person.address.number} onChange={handleAddressChange} required className="mt-1 rounded-md"/>
            </div>
             <div>
                <label htmlFor="complement" className="block text-sm font-medium text-gray-700">Complemento</label>
                <Input id="complement" name="complement" type="text" value={person.address.complement || ''} onChange={handleAddressChange} className="mt-1 rounded-md"/>
            </div>
        </div>
      </fieldset>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar Alterações' : 'Criar Pessoa'}
        </Button>
      </div>
    </form>
  );
};

export default PersonForm;