import React, { useState, useEffect, useCallback } from 'react';
import { Person } from '../../types';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PersonForm from '../forms/PersonForm';

const API_BASE_URL = 'http://localhost:3001/api';

const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE_URL}/people`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': sessionId || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar pessoas.');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        // Converter do formato do backend para o formato do frontend
        const mappedPeople = result.data.map((backendPerson: any) => ({
          id: backendPerson.id.toString(),
          name: backendPerson.identification?.name || '',
          nickname: backendPerson.nickname || backendPerson.identification?.nickname || '',
          personType: (backendPerson.type || 'Física') as 'Física' | 'Jurídica',
          email: backendPerson.identification?.email || '',
          phone: backendPerson.identification?.phone || '',
          address: backendPerson.address ? {
            street: backendPerson.address.street || '',
            number: backendPerson.address.number || '',
            complement: backendPerson.address.complement,
            neighborhood: backendPerson.address.neighborhood || '',
            city: backendPerson.address.city || '',
            state: backendPerson.address.state || '',
            zipCode: backendPerson.address.cep || '',
            country: backendPerson.address.country || 'Brasil',
          } : {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Brasil',
          },
          documents: backendPerson.document ? [{
            type: backendPerson.document.type as 'CPF' | 'CNPJ' | 'RG',
            number: backendPerson.document.number || '',
          }] : [],
          createdAt: new Date().toISOString().split('T')[0],
        }));
        setPeople(mappedPeople);
      }
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      alert('Erro ao carregar pessoas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handleOpenModal = (person?: Person) => {
    setEditingPerson(person || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (personData: Omit<Person, 'id' | 'createdAt'> & { id?: string }) => {
    const method = personData.id ? 'PUT' : 'POST';
    const url = personData.id
      ? `${API_BASE_URL}/people/${personData.id}`
      : `${API_BASE_URL}/people`;

    try {
      // Converter do formato do frontend para o formato do backend
      const backendData = {
        type: personData.personType,
        nickname: personData.nickname || undefined,
        identification: {
          name: personData.name,
          nickname: personData.nickname || undefined,
          email: personData.email || undefined,
          phone: personData.phone || undefined,
        },
        address: personData.address.zipCode ? {
          cep: personData.address.zipCode,
          street: personData.address.street,
          number: personData.address.number,
          complement: personData.address.complement || undefined,
          neighborhood: personData.address.neighborhood,
          city: personData.address.city,
          state: personData.address.state,
          country: personData.address.country,
        } : undefined,
        document: personData.documents && personData.documents.length > 0 ? {
          type: personData.documents[0].type,
          number: personData.documents[0].number,
        } : undefined,
      };
      
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': sessionId || '',
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao salvar pessoa.' }));
        throw new Error(errorData.message || 'Falha ao salvar pessoa.');
      }

      await fetchPeople();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pessoa?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE_URL}/people/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': sessionId || '',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir pessoa.');
      }

      await fetchPeople();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando pessoas...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary">Minhas Pessoas</h1>
        <Button onClick={() => handleOpenModal()}>Adicionar Pessoa</Button>
      </div>
      
      <Table<Person>
        title="Pessoas Cadastradas"
        data={people}
        columns={[
          { key: 'name', header: 'Nome' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Telefone' },
          { key: 'address', header: 'Cidade/Estado', render: item => `${item.address.city}, ${item.address.state}` },
          { key: 'createdAt', header: 'Data de Cadastro' }
        ]}
        onEdit={(item) => handleOpenModal(item)}
        onDelete={(item) => handleDelete(item.id)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPerson ? 'Editar Pessoa' : 'Nova Pessoa'}
      >
        <PersonForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          initialData={editingPerson}
        />
      </Modal>
    </div>
  );
};

export default PeoplePage;