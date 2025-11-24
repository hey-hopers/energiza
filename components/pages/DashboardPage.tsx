import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import { PowerPlantIcon, ConsumptionUnitIcon, InvoiceIcon, PeopleIcon } from '../icons/Icons';
import { Invoice, InvoiceStatus } from '../../types';

// Mock data for invoices, similar to MyBusinessPage, to power the charts.
const mockInvoices: Invoice[] = [
    { id: 'inv-1', consumptionUnitId: 'unit-1', referenceDate: '2024-07', amount: 4500.50, dueDate: '2024-08-10', status: 'pendente', observation: 'Aguardando pagamento do cliente.' },
    { id: 'inv-2', consumptionUnitId: 'unit-2', referenceDate: '2024-07', amount: 21000.75, dueDate: '2024-08-10', status: 'paga' },
    { id: 'inv-3', consumptionUnitId: 'unit-1', referenceDate: '2024-06', amount: 4350.00, dueDate: '2024-07-10', status: 'paga' },
    { id: 'inv-4', consumptionUnitId: 'unit-1', referenceDate: '2024-05', amount: 4200.00, dueDate: '2024-06-10', status: 'enviada' },
    { id: 'inv-5', consumptionUnitId: 'unit-2', referenceDate: '2024-06', amount: 20500.00, dueDate: '2024-07-10', status: 'paga' },
    { id: 'inv-6', consumptionUnitId: 'unit-3', referenceDate: '2024-07', amount: 1200.00, dueDate: '2024-08-15', status: 'gerada' },
    { id: 'inv-7', consumptionUnitId: 'unit-1', referenceDate: '2023-08', amount: 4100.00, dueDate: '2023-09-10', status: 'paga' },
    { id: 'inv-8', consumptionUnitId: 'unit-2', referenceDate: '2023-08', amount: 19800.00, dueDate: '2023-09-10', status: 'paga' },
    { id: 'inv-9', consumptionUnitId: 'unit-1', referenceDate: '2023-07', amount: 3950.00, dueDate: '2023-08-10', status: 'protestada' },
    { id: 'inv-10', consumptionUnitId: 'unit-2', referenceDate: '2022-12', amount: 18500.00, dueDate: '2023-01-10', status: 'paga' },

];

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
    paga: { label: 'Paga', color: 'text-green-800', bgColor: 'bg-green-500' },
    pendente: { label: 'Pendente', color: 'text-red-800', bgColor: 'bg-red-500' },
    enviada: { label: 'Enviada', color: 'text-blue-800', bgColor: 'bg-blue-500' },
    gerada: { label: 'Gerada', color: 'text-gray-800', bgColor: 'bg-gray-400' },
    protestada: { label: 'Protestada', color: 'text-yellow-800', bgColor: 'bg-yellow-500' },
};

const DashboardPage: React.FC = () => {
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');

  const stats = [
    { title: 'Usinas Operacionais', value: '12', icon: <PowerPlantIcon className="w-8 h-8 text-white" />, color: 'bg-blue-500' },
    { title: 'Unidades de Consumo', value: '1,482', icon: <ConsumptionUnitIcon className="w-8 h-8 text-white" />, color: 'bg-green-500' },
    { title: 'Faturas Pendentes', value: '73', icon: <InvoiceIcon className="w-8 h-8 text-white" />, color: 'bg-yellow-500' },
    { title: 'Pessoas Cadastradas', value: '2,130', icon: <PeopleIcon className="w-8 h-8 text-white" />, color: 'bg-purple-500' },
  ];

  const barChartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });

    if (view === 'monthly') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);

      for (let i = 0; i < 12; i++) {
          const date = new Date(twelveMonthsAgo);
          date.setMonth(date.getMonth() + i);
          const key = monthFormatter.format(date);
          data[key] = 0;
      }
      
      mockInvoices.forEach(invoice => {
        const [year, month] = invoice.referenceDate.split('-').map(Number);
        const invoiceDate = new Date(year, month - 1, 1);
        if (invoiceDate >= twelveMonthsAgo) {
            const key = monthFormatter.format(invoiceDate);
            if (key in data) {
                 data[key] += invoice.amount;
            }
        }
      });
    } else { // Yearly view
      mockInvoices.forEach(invoice => {
        const year = invoice.referenceDate.substring(0, 4);
        if (!data[year]) data[year] = 0;
        data[year] += invoice.amount;
      });
    }
    const sortedData = Object.entries(data).sort(([keyA], [keyB]) => {
        if (view === 'monthly') {
            const [monthA, yearA] = keyA.split('/');
            const [monthB, yearB] = keyB.split('/');
            const dateA = new Date(`01 ${monthA} 20${yearA}`);
            const dateB = new Date(`01 ${monthB} 20${yearB}`);
            return dateA.getTime() - dateB.getTime();
        }
        return keyA.localeCompare(keyB);
    });

    const labels = sortedData.map(([key]) => key);
    const values = sortedData.map(([, value]) => value);
    const max = Math.max(...values, 1); // Avoid division by zero
    
    return { labels, values, max };
  }, [view]);

  const statusChartData = useMemo(() => {
      const data = mockInvoices.reduce((acc, invoice) => {
          if (!acc[invoice.status]) {
              acc[invoice.status] = { count: 0, total: 0 };
          }
          acc[invoice.status].count++;
          acc[invoice.status].total += invoice.amount;
          return acc;
      }, {} as Record<InvoiceStatus, { count: number; total: number }>);
      
      const totalInvoices = mockInvoices.length;

      return Object.entries(data)
        .map(([status, { count }]) => ({
            status: status as InvoiceStatus,
            percentage: (count / totalInvoices) * 100
        }))
        .sort((a,b) => b.percentage - a.percentage);
  }, []);

  const conicGradient = statusChartData.reduce((acc, item, index, arr) => {
      const { status, percentage } = item;
      const start = index > 0 ? arr.slice(0, index).reduce((sum, i) => sum + i.percentage, 0) : 0;
      const end = start + percentage;
      const color = statusConfig[status].bgColor.replace('bg-', '');
      
      // Tailwind doesn't generate colors on the fly, so using hex codes from tailwind config
      const colorMap: Record<string, string> = { 'green-500': '#22c55e', 'red-500': '#ef4444', 'blue-500': '#3b82f6', 'gray-400': '#9ca3af', 'yellow-500': '#eab308'};

      return `${acc}, ${colorMap[color] || '#6b7280'} ${start}% ${end}%`;
  }, '');

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-secondary">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart Card */}
        <Card className="xl:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary">Faturamento</h2>
              <div className="mt-2 sm:mt-0 flex items-center bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setView('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${view === 'monthly' ? 'bg-white text-secondary shadow' : 'text-gray-500 hover:text-secondary'}`}>Mensal</button>
                  <button onClick={() => setView('yearly')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${view === 'yearly' ? 'bg-white text-secondary shadow' : 'text-gray-500 hover:text-secondary'}`}>Anual</button>
              </div>
            </div>
            <div className="h-72 flex items-end justify-around space-x-2 pt-4 border-t">
              {barChartData.labels.map((label, index) => (
                  <div key={label} className="flex flex-col items-center h-full w-full justify-end" title={`R$ ${barChartData.values[index].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                      <div className="w-3/4 bg-primary-500 hover:bg-primary-600 rounded-t-md transition-all duration-300" style={{ height: `${(barChartData.values[index] / barChartData.max) * 100}%` }}></div>
                      <div className="text-xs text-gray-500 mt-2 text-center">{label}</div>
                  </div>
              ))}
            </div>
        </Card>

        {/* Status Pie Chart Card */}
        <Card>
          <h2 className="text-xl font-semibold text-secondary mb-4">Status das Faturas</h2>
           <div className="flex flex-col items-center justify-center space-y-6 pt-4 border-t">
              <div 
                  className="w-40 h-40 rounded-full flex items-center justify-center relative"
                  style={{ background: `conic-gradient(${conicGradient})` }}
              >
                <div className="w-24 h-24 bg-white rounded-full"></div>
              </div>
              <div className="w-full space-y-2">
                  {statusChartData.map(({status, percentage}) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${statusConfig[status].bgColor}`}></span>
                            <span className="text-gray-600">{statusConfig[status].label}</span>
                          </div>
                          <span className="font-medium text-secondary">{percentage.toFixed(1)}%</span>
                      </div>
                  ))}
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
