
import React, { useState } from 'react';
import { Distributor } from '../../types';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DistributorForm from '../forms/DistributorForm';
import { PencilIcon, TrashIcon } from '../icons/Icons';

const mockDistributors: Distributor[] = [
    { id: 'dist-1', name: 'CPFL Energia' },
    { id: 'dist-2', name: 'Neoenergia' },
    { id: 'dist-3', name: 'Equatorial Energia' },
    { id: 'dist-4', name: 'Energisa' },
    { id: 'dist-5', name: 'CEMIG' },
];

const SystemPage: React.FC = () => {
  const [distributors, setDistributors] = useState<Distributor[]>(mockDistributors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);

  const handleOpenModal = (distributor: Distributor | null) => {
    setEditingDistributor(distributor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDistributor(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta distribuidora?')) {
      setDistributors(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleFormSubmit = (data: Omit<Distributor, 'id'> & { id?: string }) => {
    if (data.id) {
      setDistributors(prev => prev.map(d => (d.id === data.id ? { ...d, ...data } as Distributor : d)));
    } else {
      const newDistributor: Distributor = { ...data, id: `dist-${Date.now()}` };
      setDistributors(prev => [newDistributor, ...prev]);
    }
    handleCloseModal();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary">Sistema</h1>
        <Button onClick={() => handleOpenModal(null)}>
          Adicionar Distribuidora
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200 pb-2">
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white">
                Distribuidoras
            </button>
        </div>
      </div>

      <div>
        <Table<Distributor>
          title="Distribuidoras Cadastradas"
          data={distributors}
          columns={[
            { key: 'name', header: 'Nome' },
            {
              key: 'actions',
              header: 'Ações',
              render: (distributor) => (
                <div className="flex space-x-3">
                  <button onClick={() => handleOpenModal(distributor)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Editar ${distributor.name}`}>
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(distributor.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Excluir ${distributor.name}`}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDistributor ? 'Editar Distribuidora' : 'Adicionar Nova Distribuidora'}
      >
        <DistributorForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          initialData={editingDistributor}
        />
      </Modal>
    </div>
  );
};

export default SystemPage;
