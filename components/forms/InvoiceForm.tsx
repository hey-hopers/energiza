import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface InvoiceFormProps {
  onSubmit: (invoice: Omit<Invoice, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Invoice | null;
}

const initialInvoiceState: Omit<Invoice, 'id'> = {
    consumptionUnitId: '',
    referenceDate: new Date().toISOString().slice(0, 7),
    dueDate: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'gerada',
    observation: '',
};

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: 'gerada', label: 'Gerada' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'paga', label: 'Paga' },
  { value: 'protestada', label: 'Protestada' },
];

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [invoice, setInvoice] = useState(initialInvoiceState);

  useEffect(() => {
    if (initialData) {
      setInvoice({
          ...initialData,
          dueDate: initialData.dueDate.split('T')[0] // Format for date input
      });
    } else {
      setInvoice(initialInvoiceState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: (name === 'amount') ? (Number(value) || 0) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...invoice, id: initialData?.id });
  };

  const selectClassName = "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";
  const textareaClassName = "mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="referenceDate" className="block text-sm font-medium text-gray-700">Referência (Mês/Ano)</label>
          <Input id="referenceDate" name="referenceDate" type="month" value={invoice.referenceDate} onChange={handleChange} required className="mt-1"/>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
          <Input id="dueDate" name="dueDate" type="date" value={invoice.dueDate} onChange={handleChange} required className="mt-1"/>
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor Total da Fatura (R$)</label>
          <Input id="amount" name="amount" type="number" value={invoice.amount} onChange={handleChange} required className="mt-1" step="0.01" min="0"/>
        </div>
         <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Situação da Fatura</label>
          <select id="status" name="status" value={invoice.status} onChange={handleChange} required className={selectClassName}>
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="observation" className="block text-sm font-medium text-gray-700">Observação</label>
        <textarea
          id="observation"
          name="observation"
          value={invoice.observation || ''}
          onChange={handleChange}
          rows={3}
          className={textareaClassName}
          placeholder="Adicione uma observação sobre a fatura..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
          Cancelar
        </Button>
        <Button type="submit">
          {initialData && initialData.id ? 'Salvar Alterações' : 'Criar Fatura'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;