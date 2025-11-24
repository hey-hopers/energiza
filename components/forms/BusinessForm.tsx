import React, { useState, useEffect } from 'react';
import { Business, Person } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface BusinessFormProps {
  onSubmit: (business: Business) => void;
  initialData: Business | null;
  people: Person[];
  onAddNewPersonClick: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ onSubmit, initialData, people, onAddNewPersonClick }) => {
  
  const defaultBusiness: Business = {
    id: '',
    name: '',
    email: '',
    phone: '',
    responsiblePersonId: null,
  };

  const [business, setBusiness] = useState<Business>(initialData || defaultBusiness);

  useEffect(() => {
    setBusiness(initialData || defaultBusiness);
  }, [initialData]);

  if (!business) {
    return (
        <Card>
            <p className="text-gray-500">Carregando informações do negócio...</p>
        </Card>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusiness(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (business) {
      onSubmit(business);
    }
  };
  
  const selectClassName = "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
          <Input id="name" name="name" type="text" value={business.name} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email de Contato</label>
          <Input id="email" name="email" type="email" value={business.email} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
         <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone de Contato</label>
          <Input id="phone" name="phone" type="tel" value={business.phone} onChange={handleChange} required className="mt-1 rounded-md"/>
        </div>
        <div>
          <label htmlFor="responsiblePersonId" className="block text-sm font-medium text-gray-700">Operador Energético</label>
          <select 
            id="responsiblePersonId" 
            name="responsiblePersonId" 
            value={business.responsiblePersonId || ''} 
            onChange={handleChange} 
            required 
            className={`mt-1 ${selectClassName}`}
          >
            <option value="" disabled>Selecione um operador energético</option>
            {people.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
          <div className="text-right mt-1">
            <button
              type="button"
              onClick={onAddNewPersonClick}
              className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline focus:outline-none"
            >
              Deseja cadastrar um novo operador energetico?
            </button>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BusinessForm;