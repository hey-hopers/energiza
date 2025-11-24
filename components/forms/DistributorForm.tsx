
import React, { useState, useEffect } from 'react';
import { Distributor } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface DistributorFormProps {
  onSubmit: (distributor: Omit<Distributor, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Distributor | null;
}

const DistributorForm: React.FC<DistributorFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('O nome da distribuidora é obrigatório.');
      return;
    }
    onSubmit({ name, id: initialData?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Distribuidora</label>
        <Input 
          id="name" 
          name="name" 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="mt-1 rounded-md"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar Alterações' : 'Criar Distribuidora'}
        </Button>
      </div>
    </form>
  );
};

export default DistributorForm;
