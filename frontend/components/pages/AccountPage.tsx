import React, { useState, useMemo } from 'react';
import { User, Person } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AccountPageProps {
  user: User;
  people: Person[];
}

const AccountPage: React.FC<AccountPageProps> = ({ user, people }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const physicalPeople = people.filter(p => p.personType === 'Física');

  const selectedPerson = useMemo(() => {
    return people.find(p => p.id === selectedPersonId);
  }, [people, selectedPersonId]);
  
  const selectClassName = "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary mb-6">Minha Conta</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center">
              <img
                className="w-32 h-32 rounded-full mb-4"
                src={user.avatarUrl}
                alt={user.name}
              />
              <h2 className="text-xl font-semibold text-secondary">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <Button className="mt-4">Alterar Foto</Button>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-semibold text-secondary mb-4 border-b pb-2">Informações do Perfil</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <Input id="name" type="text" value={user.name} readOnly className="bg-gray-100" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Endereço de Email</label>
                <Input id="email" type="email" value={user.email} readOnly className="bg-gray-100"/>
              </div>
              <div>
                <label htmlFor="physicalPerson" className="block text-sm font-medium text-gray-700">Pessoa Física Vinculada</label>
                <select
                  id="physicalPerson"
                  name="physicalPerson"
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Nenhuma pessoa vinculada</option>
                  {physicalPeople.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                <Input id="phone" type="tel" value={selectedPerson?.phone || ''} readOnly className="bg-gray-100" disabled={!selectedPerson} />
              </div>
               <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <Input id="birthDate" type="date" value={selectedPerson?.birthDate?.split('T')[0] || ''} readOnly className="bg-gray-100" disabled={!selectedPerson} />
              </div>
              <div>
                <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
                <Input id="createdAt" type="date" value={selectedPerson ? new Date(selectedPerson.createdAt).toISOString().split('T')[0] : ''} readOnly className="bg-gray-100" disabled={!selectedPerson} />
              </div>

              <h2 className="text-xl font-semibold text-secondary mb-4 border-b pb-2 pt-4">Alterar Senha</h2>
               <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">Senha Atual</label>
                <Input id="current_password" type="password" />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <Input id="new_password" type="password" />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;