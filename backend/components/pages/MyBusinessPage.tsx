import React, { useState, useCallback, useEffect } from 'react';
import { PowerPlant, ConsumptionUnit, Invoice, Person, Business, Distributor, InvoiceStatus } from '../../types';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PowerPlantForm from '../forms/PowerPlantForm';
import ConsumptionUnitForm from '../forms/ConsumptionUnitForm';
import InvoiceForm from '../forms/InvoiceForm';
import PersonForm from '../forms/PersonForm';
import BusinessForm from '../forms/BusinessForm';
import { PencilIcon, TrashIcon, ChevronDownIcon } from '../icons/Icons';
import Card from '../ui/Card';

type Tab = 'registration' | 'plants' | 'units' | 'invoices' | 'people';

interface MyBusinessPageProps {
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
}

const API_BASE_URL = 'http://localhost:3001/api';

const mockInvoices: Invoice[] = [
    { id: 'inv-1', consumptionUnitId: 'unit-1', referenceDate: '2024-07', amount: 4500.50, dueDate: '2024-08-10', status: 'pendente', observation: 'Aguardando pagamento do cliente.' },
    { id: 'inv-2', consumptionUnitId: 'unit-2', referenceDate: '2024-07', amount: 21000.75, dueDate: '2024-08-10', status: 'paga' },
    { id: 'inv-3', consumptionUnitId: 'unit-1', referenceDate: '2024-06', amount: 4350.00, dueDate: '2024-07-10', status: 'paga' },
    { id: 'inv-4', consumptionUnitId: 'unit-1', referenceDate: '2024-05', amount: 4200.00, dueDate: '2024-06-10', status: 'enviada' },
    { id: 'inv-5', consumptionUnitId: 'unit-2', referenceDate: '2024-06', amount: 20500.00, dueDate: '2024-07-10', status: 'paga' },
];

const MyBusinessPage: React.FC<MyBusinessPageProps> = ({ people, setPeople }) => {
  const [activeTab, setActiveTab] = useState<Tab>('registration');
  const [postCreationAction, setPostCreationAction] = useState<{ selectInBusinessForm: boolean } | null>(null);
  const [openModalOnTabLoad, setOpenModalOnTabLoad] = useState<Tab | null>(null);
  const [returnToPlantModal, setReturnToPlantModal] = useState(false);
  const [returnToUnitModal, setReturnToUnitModal] = useState(false);
  
  // State for Business
  const [businessInfo, setBusinessInfo] = useState<Business | null>(null);

  // State for Power Plants
  const [plants, setPlants] = useState<PowerPlant[]>();
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Partial<PowerPlant> | null>(null);

  // State for Consumption Units
  const [units, setUnits] = useState<ConsumptionUnit[]>();
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ConsumptionUnit | null>(null);
  
  // State for Invoices
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // State for People
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  // State for Distributors (assuming they are managed elsewhere but needed here)
  const [distributors, setDistributors] = useState<Distributor[]>();
  
  // Adicionar estado de loading
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);

  // Função para buscar dados do negócio
  const fetchBusiness = useCallback(async () => {
    setIsLoadingBusiness(true);
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      if (!token || !sessionId) {
        setIsLoadingBusiness(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/operador-energetico/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': sessionId,
        },
      });
      
      if (!response.ok) {
        // Se for 401, pode ser sessão expirada
        if (response.status === 401) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          return;
        }
        throw new Error('Falha ao buscar dados do negócio.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Sempre definir businessInfo, mesmo se for objeto vazio
        if (result.data) {
          setBusinessInfo(result.data as Business);
        } else {
          // Se não tem dados, criar objeto vazio para o formulário
          setBusinessInfo({
            id: '',
            name: '',
            email: '',
            phone: '',
            responsiblePersonId: null,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do negócio:', error);
      alert(error instanceof Error ? error.message : 'Erro ao buscar dados do negócio');
    } finally {
      setIsLoadingBusiness(false);
    }
  }, []);

  // Buscar dados ao carregar
  useEffect(() => {
    if (activeTab === 'registration') {
      fetchBusiness();
    }
  }, [activeTab, fetchBusiness]);

  // --- Data Fetching ---
  const fetchPeople = useCallback(async () => {
    setIsLoadingPeople(true);
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
      console.error(error);
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoadingPeople(false);
    }
  }, [setPeople]);

  const fetchConsumptionUnits = useCallback(async () => {
    try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');
        
        const response = await fetch(`${API_BASE_URL}/consumption-units`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Session-Id': sessionId,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                setUnits(data.data);
            }
        }
    } catch (error) {
        console.error('Erro ao buscar unidades de consumo:', error);
    }
  }, []);

  const fetchDistributors = useCallback(async () => {
      try {
          const token = localStorage.getItem('token');
          const sessionId = localStorage.getItem('sessionId');
          
          const response = await fetch(`${API_BASE_URL}/distributors`, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'X-Session-Id': sessionId,
                  'Content-Type': 'application/json',
              },
          });

          if (response.ok) {
              const data = await response.json();
              if (data.success) {
                  setDistributors(data.data);
              }
          }
      } catch (error) {
          console.error('Erro ao buscar distribuidoras:', error);
      }
  }, []);
  
  const fetchPowerPlants = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE_URL}/power-plants`, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'X-Session-Id': sessionId || '',
              'Content-Type': 'application/json',
          },
      });

      if (response.ok) {
          const data = await response.json();
          if (data.success) {
              // Mapear os IDs numéricos para string para consistência com o frontend, se necessário
              const mappedPlants = data.data.map((plant: any) => ({
                  ...plant,
                  id: plant.id.toString(),
                  consumptionUnitId: plant.consumptionUnitId.toString(),
                  // Ajustar para os nomes dos campos do frontend se forem diferentes
                  name: plant.identification, // Assumindo que 'identification' do backend é 'name' no frontend
                  generatedKwh: plant.kwhGenerated,
                  operatingYears: plant.operationTime,
                  // mock distribution para evitar quebrar o UI, ajustar se o backend tiver isso
                  distribution: [{ consumptionUnitId: plant.consumptionUnitId.toString(), percentage: 100 }]
              }));
              setPlants(mappedPlants);
          }
      } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
          throw new Error(errorData.message || 'Falha ao buscar usinas.');
      }
    } catch (error) {
        console.error('Erro ao buscar usinas:', error);
        alert(error instanceof Error ? error.message : 'Falha ao carregar usinas.');
    } 
  }, []);
    
  useEffect(() => {
    fetchPeople();
    fetchConsumptionUnits();
    fetchDistributors();
    fetchPowerPlants();
  }, [fetchPeople, fetchConsumptionUnits, fetchDistributors, fetchPowerPlants]);

  // --- Handlers for Business Info ---
  const handleBusinessFormSubmit = async (businessData: Business) => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      if (!token || !sessionId) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/operador-energetico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify(businessData),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar' }));
        throw new Error(errorData.message || 'Erro ao salvar informações do negócio');
      }
  
      const result = await response.json();
      if (result.success) {
        setBusinessInfo(result.data);
        alert('Informações do negócio salvas com sucesso!');
        // Recarregar dados para garantir sincronização
        await fetchBusiness();
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar informações do negócio');
    }
  };

  // --- Handlers for Power Plants ---
  const handleOpenPlantModal = (plant: Partial<PowerPlant> | null) => {
    setEditingPlant(plant);
    setIsPlantModalOpen(true);
  };

  const handleClosePlantModal = () => {
    setIsPlantModalOpen(false);
    setEditingPlant(null);
    setReturnToPlantModal(false);
  };
  
  const handleDeletePlant = async (plantId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta usina?')) {
        try {
            const token = localStorage.getItem('token');
            const sessionId = localStorage.getItem('sessionId');
            
            const response = await fetch(`${API_BASE_URL}/power-plants/${plantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-Id': sessionId || '',
                },
            });

            if (response.ok) {
                await fetchPowerPlants(); // Recarrega a lista de usinas
                alert('Usina excluída com sucesso!');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
                alert(errorData.message || 'Falha ao excluir usina.');
            }
        } catch (error) {
            console.error('Erro ao excluir usina:', error);
            alert('Erro ao excluir usina. Verifique o console para mais detalhes.');
        }
    }
  };

  const handlePlantFormSubmit = async (plantData: Omit<PowerPlant, 'id' | 'name' | 'generatedKwh' | 'operatingYears' | 'distribution'> & { id?: string, name: string, generatedKwh?: number, operatingYears?: number }) => {
    try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');
        
        // Mapear os dados do formulário para o formato do backend
        const backendPayload = {
            identification: plantData.name,
            monthlyLossPercentage: plantData.monthlyLossPercentage || null,
            consumptionUnitId: parseInt(plantData.consumptionUnitId as any), // Converter para number
            kwhGenerated: plantData.generatedKwh || null,
            operationTime: plantData.operatingYears || null,
        };

        const url = plantData.id 
            ? `${API_BASE_URL}/power-plants/${plantData.id}`
            : `${API_BASE_URL}/power-plants`;
        
        const method = plantData.id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Session-Id': sessionId || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendPayload),
        });

        if (response.ok) {
            await fetchPowerPlants(); // Recarrega a lista
            handleClosePlantModal();
            alert('Usina salva com sucesso!');
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            alert(errorData.message || 'Erro ao salvar usina.');
        }
    } catch (error) {
        console.error('Erro ao salvar usina:', error);
        alert('Erro ao salvar usina. Verifique o console para mais detalhes.');
    }
  };
  
  // --- Handlers for Consumption Units ---
  const handleOpenUnitModal = useCallback((unit: ConsumptionUnit | null) => {
    setEditingUnit(unit);
    setIsUnitModalOpen(true);
  }, []);

  const handleCloseUnitModal = () => {
    setIsUnitModalOpen(false);
    setEditingUnit(null);
  };

  const handleUnitFormSubmit = async (unitData: Omit<ConsumptionUnit, 'id'> & { id?: string }) => {
    try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');
        
        const url = unitData.id 
            ? `${API_BASE_URL}/consumption-units/${unitData.id}`
            : `${API_BASE_URL}/consumption-units`;
        
        const method = unitData.id ? 'PUT' : 'POST';
        
        // Normalizar endereço: garantir que ambos cep e zipCode estejam presentes
        const payload = {
            ...unitData,
            address: {
                ...unitData.address,
                cep: unitData.address.zipCode || unitData.address.zipCode || '',
                zipCode: unitData.address.zipCode || unitData.address.zipCode || '',
            }
        };
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Session-Id': sessionId,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                await fetchConsumptionUnits();
                handleCloseUnitModal();
                
                if (returnToPlantModal && data.data.id) {
                    handleOpenPlantModal({
                        ...(editingPlant || {}),
                        consumptionUnitId: data.data.id,
                    });
                    setReturnToPlantModal(false);
                }
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            alert(errorData.message || 'Erro ao salvar unidade de consumo');
        }
    } catch (error) {
        console.error('Erro ao salvar unidade de consumo:', error);
        alert('Erro ao salvar unidade de consumo. Verifique o console para mais detalhes.');
    }
  };

  // Atualizar handleDeleteUnit
  const handleDeleteUnit = async (unitId: string) => {
      if (window.confirm('Tem certeza que deseja excluir esta unidade de consumo?')) {
          try {
              const token = localStorage.getItem('token');
              const sessionId = localStorage.getItem('sessionId');
              
              const response = await fetch(`${API_BASE_URL}/consumption-units/${unitId}`, {
                  method: 'DELETE',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'X-Session-Id': sessionId,
                  },
              });

              if (response.ok) {
                  await fetchConsumptionUnits(); // Recarregar lista
              } else {
                  const errorData = await response.json();
                  alert(errorData.message || 'Erro ao excluir unidade de consumo');
              }
          } catch (error) {
              console.error('Erro ao excluir unidade de consumo:', error);
              alert('Erro ao excluir unidade de consumo');
          }
      }
  };

  // Adicionar useEffect para carregar dados
  useEffect(() => {
      fetchConsumptionUnits();
      fetchDistributors();
  }, [fetchConsumptionUnits, fetchDistributors]);
  
  const handleRequestNewUnitFromPlantForm = (currentPlantData: Omit<PowerPlant, 'id'>) => {
    setEditingPlant(currentPlantData);
    setIsPlantModalOpen(false);
    setReturnToPlantModal(true);
    handleOpenUnitModal(null);
  };

  const handleRequestNewPersonFromUnitForm = (currentUnitData: Omit<ConsumptionUnit, 'id'>) => {
    setEditingUnit(currentUnitData as ConsumptionUnit);
    setIsUnitModalOpen(false);
    setReturnToUnitModal(true);
    handleOpenPersonModal(null);
  };

  // --- Handlers for Invoices ---
  const handleOpenInvoiceModal = (invoice: Invoice | null, consumptionUnitId?: string) => {
    if (invoice) {
        setEditingInvoice(invoice);
    } else if (consumptionUnitId) {
        const newInvoiceTemplate: Invoice = {
            id: '', // Not used for creation
            consumptionUnitId,
            referenceDate: new Date().toISOString().slice(0, 7), // "YYYY-MM"
            amount: 0,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'gerada',
            observation: '',
        };
        setEditingInvoice(newInvoiceTemplate);
    } else {
        setEditingInvoice(null);
    }
    setIsInvoiceModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    }
  };

  const handleInvoiceFormSubmit = async (invoiceData: Omit<Invoice, 'id'> & { id?: string, pdfFile?: File | null }) => {
    const { id, pdfFile, ...invoiceFields } = invoiceData;

    const formData = new FormData();
    formData.append('consumptionUnitId', invoiceFields.consumptionUnitId);
    formData.append('referenceDate', invoiceFields.referenceDate);
    formData.append('dueDate', invoiceFields.dueDate);
    formData.append('amount', invoiceFields.amount.toString());
    formData.append('status', invoiceFields.status);
    if (invoiceFields.observation) {
        formData.append('observation', invoiceFields.observation);
    }
    if (pdfFile) {
        formData.append('pdfFile', pdfFile);
    }

    try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('sessionId');

        if (!token || !sessionId) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            return;
        }

        const url = id
            ? `${API_BASE_URL}/invoices/${id}`
            : `${API_BASE_URL}/invoices`;

        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                // Não defina Content-Type para FormData; o navegador fará isso automaticamente.
                'Authorization': `Bearer ${token}`,
                'X-Session-Id': sessionId || '',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar fatura.' }));
            throw new Error(errorData.message || 'Erro ao salvar fatura.');
        }

        const result = await response.json();
        if (result.success) {
            // Se o backend retornar a fatura atualizada, use-a. Caso contrário, adicione o mock ou atualize.
            if (id) {
                setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...result.data } as Invoice : i));
            } else {
                setInvoices(prev => [result.data as Invoice, ...prev]);
            }
            alert('Fatura salva com sucesso!');
            handleCloseInvoiceModal();
        }
    } catch (error) {
        console.error('Erro ao salvar fatura:', error);
        alert(error instanceof Error ? error.message : 'Erro ao salvar fatura. Verifique o console para mais detalhes.');
    }
  };
  
  const toggleUnitInvoices = (unitId: string) => {
    setExpandedUnitId(currentId => (currentId === unitId ? null : unitId));
  };

  // --- Handlers for People ---
  const handleOpenPersonModal = useCallback((person: Person | null) => {
    setEditingPerson(person);
    setIsPersonModalOpen(true);
  }, []);

  const handleClosePersonModal = useCallback(() => {
    setIsPersonModalOpen(false);
    setEditingPerson(null);
  }, []);

  const handleDeletePerson = async (personId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta pessoa?')) {
      try {
          const response = await fetch(`${API_BASE_URL}/people/${personId}`, { method: 'DELETE' });
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Falha ao excluir pessoa.' }));
              throw new Error(errorData.message);
          }
          fetchPeople(); // Refresh data
      } catch (error) {
          console.error(error);
          alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
      }
    }
  };

  const handlePersonFormSubmit = useCallback(async (personData: Omit<Person, 'id' | 'createdAt'> & { id?: string }) => {
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
        throw new Error(errorData.message);
      }

      const savedPerson = await response.json();
      const newPersonId = savedPerson.data.id?.toString() || savedPerson.data.id;

      handleClosePersonModal();
      fetchPeople(); // Refresh data from server

      if (postCreationAction?.selectInBusinessForm && newPersonId) {
        setBusinessInfo(prev => ({ ...prev, responsiblePersonId: newPersonId }));
        setActiveTab('registration');
        setPostCreationAction(null);
      }

      if (returnToUnitModal && newPersonId) {
        setReturnToUnitModal(false);
        handleOpenUnitModal({
          ...(editingUnit || {}),
          ownerId: newPersonId,
        } as ConsumptionUnit);
      }
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    }
  }, [fetchPeople, handleClosePersonModal, postCreationAction, returnToUnitModal, editingUnit, handleOpenUnitModal]);

  const handleRequestNewPerson = () => {
    setPostCreationAction({ selectInBusinessForm: true });
    setActiveTab('people');
    setOpenModalOnTabLoad('people');
  };

  useEffect(() => {
    if (openModalOnTabLoad && openModalOnTabLoad === activeTab) {
      if (activeTab === 'people') {
        handleOpenPersonModal(null);
      }
      setOpenModalOnTabLoad(null);
    }
  }, [activeTab, openModalOnTabLoad, handleOpenPersonModal]);

  // --- Main Button Handler ---
  const handleAddNew = () => {
    switch (activeTab) {
      case 'plants':
        handleOpenPlantModal(null);
        break;
      case 'units':
        handleOpenUnitModal(null);
        break;
      case 'invoices':
        // This is now handled within each unit card, top-level button is removed.
        break;
      case 'people':
        handleOpenPersonModal(null);
        break;
    }
  };

  // --- Main Button Label ---
  const getButtonLabel = () => {
    switch (activeTab) {
      case 'plants': return 'Adicionar Usina';
      case 'units': return 'Adicionar Unidade';
      case 'people': return 'Adicionar Pessoa';
      default: return 'Adicionar Novo';
    }
  };
  
  const getStatusBadge = (status: InvoiceStatus) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'paga':
            return <span className={`${baseClasses} text-green-800 bg-green-200`}>Paga</span>;
        case 'pendente':
            return <span className={`${baseClasses} text-red-800 bg-red-200`}>Pendente</span>;
        case 'enviada':
            return <span className={`${baseClasses} text-blue-800 bg-blue-200`}>Enviada</span>;
        case 'gerada':
            return <span className={`${baseClasses} text-gray-800 bg-gray-200`}>Gerada</span>;
        case 'protestada':
            return <span className={`${baseClasses} text-yellow-800 bg-yellow-200`}>Protestada</span>;
        default:
            return null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'registration':
        if (isLoadingBusiness) {
          return (
            <Card>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Carregando informações do negócio...</p>
              </div>
            </Card>
          );
        }
        
        // Garantir que sempre temos um objeto válido para o formulário
        const businessData = businessInfo || {
          id: '',
          name: '',
          email: '',
          phone: '',
          responsiblePersonId: null,
        };
        
        return <BusinessForm 
          initialData={businessData} 
          people={people} 
          onSubmit={handleBusinessFormSubmit} 
          onAddNewPersonClick={handleRequestNewPerson}
        />;
      case 'plants':
        return <Table<PowerPlant> title="Usinas" data={plants} columns={[
          { key: 'name', header: 'Identificação' },
          { key: 'consumptionUnitId', header: 'Unidade de Consumo', render: item => units.find(u => u.id === item.consumptionUnitId)?.ucCode || 'N/A' },
          { key: 'monthlyLossPercentage', header: 'Perda Mensal (%)', render: item => `${item.monthlyLossPercentage.toFixed(1)}%` },
          { key: 'generatedKwh', header: 'Geração (kWh)', render: item => item.generatedKwh.toLocaleString('pt-BR') },
          { key: 'operatingYears', header: 'Operação (Anos)', render: item => `${item.operatingYears} anos` },
          {
            key: 'actions',
            header: 'Ações',
            render: (plant) => (
              <div className="flex space-x-3">
                <button title="Editar" onClick={() => handleOpenPlantModal(plant)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Editar ${plant.name}`}>
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button title="Excluir" onClick={() => handleDeletePlant(plant.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Excluir ${plant.name}`}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )
          }
        ]} />;
      case 'units':
        return <Table<ConsumptionUnit> title="Unidades de Consumo" data={units} columns={[
          { key: 'ucCode', header: 'Código UC' },
          { key: 'isGenerator', header: 'Geradora', render: item => item.isGenerator ? 'Sim' : 'Não' },
          { key: 'ownerId', header: 'Proprietário', render: item => people.find(p => p.id === item.ownerId)?.name || 'N/A' },
          { key: 'address', header: 'Cidade/Estado', render: item => `${item.address.city}, ${item.address.state}` },
          {
            key: 'actions',
            header: 'Ações',
            render: (unit) => (
              <div className="flex space-x-3">
                <button title="Editar" onClick={() => handleOpenUnitModal(unit)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Editar ${unit.ucCode}`}>
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button title="Excluir" onClick={() => handleDeleteUnit(unit.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Excluir ${unit.ucCode}`}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )
          }
        ]} />;
      case 'invoices':
        const invoicesByUnit = invoices.reduce((acc, inv) => {
            if (!acc[inv.consumptionUnitId]) {
                acc[inv.consumptionUnitId] = [];
            }
            acc[inv.consumptionUnitId].push(inv);
            return acc;
        }, {} as Record<string, Invoice[]>);

        // Sort invoices within each unit
        Object.keys(invoicesByUnit).forEach(key => {
            const unitInvoices = invoicesByUnit[key];
            unitInvoices.sort((a, b) => b.referenceDate.localeCompare(a.referenceDate));
        });
        
        const distributedUnitIds = new Set(plants.flatMap(plant => plant.distribution.map(d => d.consumptionUnitId)));
        const unitsWithDistribution = units.filter(unit => distributedUnitIds.has(unit.id));

        return (
            <div className="space-y-4">
                {unitsWithDistribution && unitsWithDistribution.length > 0 ?  (
                    unitsWithDistribution.map(unit => {
                        const unitInvoices = invoicesByUnit[unit.id] || [];
                        const isExpanded = expandedUnitId === unit.id;

                        return (
                            <Card key={unit.id} className="overflow-hidden transition-all duration-300">
                                <div 
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" 
                                    onClick={() => toggleUnitInvoices(unit.id)}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleUnitInvoices(unit.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    aria-controls={`invoices-${unit.id}`}
                                >
                                    <div>
                                        <h3 className="font-semibold text-secondary">{unit.ucCode}</h3>
                                        <p className="text-sm text-gray-500">{`${unit.address.street}, ${unit.address.city}`}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                                            {unitInvoices.length} {unitInvoices.length === 1 ? 'fatura' : 'faturas'}
                                        </span>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div id={`invoices-${unit.id}`} className="p-4 border-t border-gray-200 bg-gray-50">
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={(e) => { e.stopPropagation(); handleOpenInvoiceModal(null, unit.id); }}>
                                                Fatura Manual
                                            </Button>
                                        </div>
                                        <h4 className="font-semibold text-gray-700 mb-4">Histórico de Faturas</h4>
                                        {unitInvoices.length > 0 ? (
                                            <div className="overflow-x-auto rounded-lg border">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {unitInvoices.map(invoice => (
                                                            <tr key={invoice.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.referenceDate.replace('-', '/')}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{`R$ ${invoice.amount.toFixed(2)}`}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    {getStatusBadge(invoice.status)}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                    <div className="flex space-x-3">
                                                                        <button title="Editar" onClick={() => handleOpenInvoiceModal(invoice)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Editar fatura ${invoice.id}`}>
                                                                            <PencilIcon className="w-5 h-5" />
                                                                        </button>
                                                                        <button title="Excluir" onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Excluir fatura ${invoice.id}`}>
                                                                            <TrashIcon className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500 py-6 bg-white rounded-lg border">
                                                <p>Nenhuma fatura encontrada para esta unidade.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <div className="text-center text-gray-500 py-6">
                            <p>Apenas unidades de consumo com vínculo de distribuição energética são exibidas aqui.</p>
                            <p className="mt-2 text-sm">Para adicionar faturas, primeiro configure a distribuição na aba 'Usinas'.</p>
                        </div>
                    </Card>
                )}
            </div>
        );
      case 'people':
        return isLoadingPeople ? (
          <div className="text-center p-8">Carregando pessoas...</div>
        ) : (
          <Table<Person>
            title="Pessoas Cadastradas"
            data={people}
            columns={[
              { key: 'name', header: 'Nome' },
              { key: 'personType', header: 'Tipo' },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Telefone' },
              { key: 'address', header: 'Cidade/Estado', render: item => `${item.address.city}, ${item.address.state}` },
              {
                key: 'actions',
                header: 'Ações',
                render: (person) => (
                  <div className="flex space-x-3">
                    <button title="Editar" onClick={() => handleOpenPersonModal(person)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label={`Editar ${person.name}`}>
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button title="Excluir" onClick={() => handleDeletePerson(person.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label={`Excluir ${person.name}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )
              }
            ]}
          />
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-primary-500 text-white'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary">Meu Negócio</h1>
        {activeTab !== 'registration' && activeTab !== 'invoices' && (
            <Button onClick={handleAddNew}>
                {getButtonLabel()}
            </Button>
        )}
      </div>
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200 pb-2">
          <TabButton tab="registration" label="Cadastro" />
          <TabButton tab="people" label="Minhas Pessoas" />
          <TabButton tab="units" label="Unidades de Consumo" />
          <TabButton tab="plants" label="Usinas" />
          <TabButton tab="invoices" label="Faturas" />
        </div>
      </div>
      <div>{renderContent()}</div>

      {/* Power Plant Modal */}
      <Modal
        isOpen={isPlantModalOpen}
        onClose={handleClosePlantModal}
        title={editingPlant && editingPlant.id ? 'Editar Usina' : 'Adicionar Nova Usina'}
      >
        <PowerPlantForm
          onSubmit={handlePlantFormSubmit}
          onCancel={handleClosePlantModal}
          initialData={editingPlant}
          consumptionUnits={units}
          onAddNewUnitClick={handleRequestNewUnitFromPlantForm}
        />
      </Modal>

      {/* Consumption Unit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={handleCloseUnitModal}
        title={editingUnit ? 'Editar Unidade de Consumo' : 'Adicionar Nova Unidade'}
      >
        <ConsumptionUnitForm
          onSubmit={handleUnitFormSubmit}
          onCancel={handleCloseUnitModal}
          initialData={editingUnit}
          people={people}
          distributors={distributors}
          onAddNewOwnerClick={handleRequestNewPersonFromUnitForm}
        />
      </Modal>
      
      {/* Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        title={editingInvoice && editingInvoice.id ? 'Editar Fatura' : 'Adicionar Nova Fatura'}
      >
        <InvoiceForm
          onSubmit={handleInvoiceFormSubmit}
          onCancel={handleCloseInvoiceModal}
          initialData={editingInvoice}
        />
      </Modal>

      {/* Person Modal */}
      <Modal
        isOpen={isPersonModalOpen}
        onClose={handleClosePersonModal}
        title={editingPerson ? 'Editar Pessoa' : 'Adicionar Nova Pessoa'}
      >
        <PersonForm
          onSubmit={handlePersonFormSubmit}
          onCancel={handleClosePersonModal}
          initialData={editingPerson}
        />
      </Modal>
    </div>
  );
};

export default MyBusinessPage;