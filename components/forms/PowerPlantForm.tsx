
import React, { useState, useEffect, useMemo } from 'react';
import { PowerPlant, ConsumptionUnit, Distribution } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { TrashIcon } from '../icons/Icons';

interface PowerPlantFormProps {
  onSubmit: (plant: Omit<PowerPlant, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  initialData?: Partial<PowerPlant> | null;
  consumptionUnits: ConsumptionUnit[];
  onAddNewUnitClick: (currentData: Omit<PowerPlant, 'id'>) => void;
}

const initialPlantState: Omit<PowerPlant, 'id'> = {
    name: '',
    consumptionUnitId: '',
    monthlyLossPercentage: 0,
    generatedKwh: 0,
    operatingYears: 0,
    distribution: [],
};

const PowerPlantForm: React.FC<PowerPlantFormProps> = ({ onSubmit, onCancel, initialData, consumptionUnits, onAddNewUnitClick }) => {
  const [plant, setPlant] = useState(initialPlantState);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const generatorUnits = useMemo(() => {
    return consumptionUnits.filter(unit => unit.isGenerator);
  }, [consumptionUnits]);

  useEffect(() => {
    if (initialData) {
      setPlant({ ...initialPlantState, ...initialData });
    } else {
        setPlant({
            ...initialPlantState,
            consumptionUnitId: generatorUnits[0]?.id || '',
        });
    }
  }, [initialData, generatorUnits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlant(prev => ({ 
        ...prev, 
        [name]: ['monthlyLossPercentage', 'generatedKwh', 'operatingYears'].includes(name) 
            ? (Number(value) || 0) 
            : value 
    }));
  };
  
  const handleDistributionChange = (unitId: string, percentage: number) => {
    setPlant(prev => ({
      ...prev,
      distribution: prev.distribution.map(d => 
        d.consumptionUnitId === unitId ? { ...d, percentage: Math.max(0, Math.min(100, percentage || 0)) } : d
      )
    }));
  };

  const handleAddDistribution = () => {
    if (selectedUnit && !plant.distribution.some(d => d.consumptionUnitId === selectedUnit)) {
      setPlant(prev => ({
        ...prev,
        distribution: [...prev.distribution, { consumptionUnitId: selectedUnit, percentage: 0 }]
      }));
      setSelectedUnit('');
    }
  };

  const handleRemoveDistribution = (unitId: string) => {
    setPlant(prev => ({
      ...prev,
      distribution: prev.distribution.filter(d => d.consumptionUnitId !== unitId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...plant, id: initialData?.id });
  };

  const totalPercentage = useMemo(() => {
    return plant.distribution.reduce((sum, d) => sum + d.percentage, 0);
  }, [plant.distribution]);
  
  const availableUnits = useMemo(() => {
    const currentUnitIds = new Set(plant.distribution.map(d => d.consumptionUnitId));
    return consumptionUnits.filter(unit => !currentUnitIds.has(unit.id));
  }, [consumptionUnits, plant.distribution]);

  useEffect(() => {
    if (availableUnits.length > 0) {
      setSelectedUnit(availableUnits[0].id);
    } else {
      setSelectedUnit('');
    }
  }, [availableUnits]);
  
  const isSaveDisabled = plant.distribution.length > 0 && totalPercentage !== 100;

  const selectClassName = "appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm rounded-md";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Identificação</label>
        <Input id="name" name="name" type="text" value={plant.name} onChange={handleChange} required className="mt-1 rounded-md"/>
      </div>
      <div>
        <label htmlFor="consumptionUnitId" className="block text-sm font-medium text-gray-700">Unidade de Consumo</label>
        <select id="consumptionUnitId" name="consumptionUnitId" value={plant.consumptionUnitId} onChange={handleChange} required className={`mt-1 ${selectClassName}`}>
            <option value="" disabled>Selecione...</option>
            {generatorUnits.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.ucCode}</option>
            ))}
        </select>
        <div className="text-right mt-1">
            <button
              type="button"
              onClick={() => onAddNewUnitClick(plant)}
              className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline focus:outline-none"
            >
              Deseja cadastrar uma nova Unidade de Consumo?
            </button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="monthlyLossPercentage" className="block text-sm font-medium text-gray-700">Percentual de Perda Mensal (%)</label>
            <Input id="monthlyLossPercentage" name="monthlyLossPercentage" type="number" value={plant.monthlyLossPercentage} onChange={handleChange} required className="mt-1 rounded-md" step="0.1" min="0"/>
        </div>
        <div>
            <label htmlFor="generatedKwh" className="block text-sm font-medium text-gray-700">KW/H Gerado</label>
            <Input id="generatedKwh" name="generatedKwh" type="number" value={plant.generatedKwh} onChange={handleChange} required className="mt-1 rounded-md" min="0"/>
        </div>
      </div>
       <div>
        <label htmlFor="operatingYears" className="block text-sm font-medium text-gray-700">Tempo de Operação (Ano)</label>
        <Input id="operatingYears" name="operatingYears" type="number" value={plant.operatingYears} onChange={handleChange} required className="mt-1 rounded-md" min="0" step="1"/>
      </div>

      <fieldset className="border-t pt-4 mt-4">
        <legend className="text-lg font-medium text-secondary">Distribuição de Energia</legend>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="add-distribution-unit" className="block text-sm font-medium text-gray-700 mb-1">Unidade de Consumo</label>
            <div className="flex items-center space-x-2">
                <select
                id="add-distribution-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className={`flex-grow ${selectClassName}`}
                aria-label="Selecionar unidade de consumo para adicionar à distribuição"
                disabled={availableUnits.length === 0}
                >
                {availableUnits.length > 0 ? (
                    availableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.ucCode}</option>)
                ) : (
                    <option>Nenhuma unidade disponível</option>
                )}
                </select>
                <Button type="button" onClick={handleAddDistribution} disabled={!selectedUnit}>Adicionar</Button>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            {plant.distribution.map(dist => {
              const unit = consumptionUnits.find(u => u.id === dist.consumptionUnitId);
              return (
                <div key={dist.consumptionUnitId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{unit?.ucCode || 'Unidade não encontrada'}</span>
                      <button type="button" onClick={() => handleRemoveDistribution(dist.consumptionUnitId)} className="text-red-500 hover:text-red-700 p-1" aria-label={`Remover ${unit?.ucCode}`}>
                        <TrashIcon className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={dist.percentage}
                      onChange={(e) => handleDistributionChange(dist.consumptionUnitId, parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      aria-label={`Percentual para ${unit?.ucCode}`}
                    />
                    <div className="relative w-28">
                       <Input 
                        type="number" 
                        value={dist.percentage} 
                        onChange={(e) => handleDistributionChange(dist.consumptionUnitId, parseInt(e.target.value, 10))}
                        className="w-full text-right pr-7" 
                        min="0" max="100"
                        aria-label={`Percentual exato para ${unit?.ucCode}`}
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-sm pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {plant.distribution.length > 0 && (
             <div className="pt-2" role="status">
               <div className="flex justify-between mb-1">
                 <span className="text-base font-medium text-secondary">Total Distribuído</span>
                 <span className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-700' : 'text-red-700'}`}>
                   {totalPercentage}% / 100%
                 </span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                 <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${totalPercentage === 100 ? 'bg-green-500' : totalPercentage > 100 ? 'bg-red-500' : 'bg-primary-600'}`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                 ></div>
               </div>
              {totalPercentage !== 100 && (
                <p className="text-xs text-red-600 mt-1 text-right">O total da distribuição deve ser exatamente 100%.</p>
              )}
            </div>
          )}
        </div>
      </fieldset>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaveDisabled}>
          {initialData && initialData.id ? 'Salvar Alterações' : 'Criar Usina'}
        </Button>
      </div>
    </form>
  );
};

export default PowerPlantForm;