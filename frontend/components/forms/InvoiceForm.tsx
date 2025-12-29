import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import axios from 'axios';

interface InvoiceFormProps {
  onSubmit: (invoice: Omit<Invoice, 'id'> & { id?: string, pdfFile?: File | null, pdfFilePath?: string | null }) => void;
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

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [invoice, setInvoice] = useState(initialInvoiceState);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [serverPdfPath, setServerPdfPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showProcessedData, setShowProcessedData] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    unidadeConsumo: '',
    referencia: '',
    vencimento: '',
    data_leitura_anterior: '',
    data_leitura_atual: '',
    data_leitura_proxima: '',
    diasLidos: '',
    medidor: '',
    leituraAnterior: '',
    leituraAtual: '',
    totalApurado: '',
    valorTotal: 0
  });

  useEffect(() => {
    // Verifica se initialData existe E se possui um ID válido (não vazio)
    if (initialData && initialData.id) {
      setInvoice({
          ...initialData,
          dueDate: initialData.dueDate.split('T')[0] // Format for date input
      });
      setPdfFile(null);
      setServerPdfPath(initialData.pdfFilePath || null); 
      setShowProcessedData(true); // Se tem ID, presumimos que já foi processado
    } else {
      // Se não há initialData ou o ID é vazio, consideramos uma nova fatura
      setInvoice(initialInvoiceState);
      setPdfFile(null);
      setServerPdfPath(null);
      setShowProcessedData(false); // Esconde os campos para nova fatura
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
          setPdfFile(fileInput.files[0]);
          setServerPdfPath(null); 
      } else {
          setPdfFile(null);
      }
    } else {
    setInvoice(prev => ({ ...prev, [name]: (name === 'amount') ? (Number(value) || 0) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...invoice, id: initialData?.id, pdfFile: pdfFile || undefined, pdfFilePath: serverPdfPath });
    onSubmit({
      ...invoice,
      id: initialData?.id,
      pdfFile: pdfFile || undefined,
      pdfFilePath: serverPdfPath,
      referencia: formData.referencia,
      vencimento: formData.vencimento,
      valorTotal: formData.valorTotal,
      observation: `Unidade Consumo: ${formData.unidadeConsumo}, Data Leitura Anterior: ${formData.data_leitura_anterior}, Data Leitura Atual: ${formData.data_leitura_atual}, Data Leitura Próxima: ${formData.data_leitura_proxima}, Dias Lidos: ${formData.diasLidos}, Medidor: ${formData.medidor}, Leitura Anterior: ${formData.leituraAnterior}, Leitura Atual: ${formData.leituraAtual}, Total Apurado: ${formData.totalApurado}`
    });
  };

  const formatarDataParaInput = (dataString: string) => {
    if (!dataString) return '';
    const partes = dataString.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return dataString; // Retorna a string original se o formato não corresponder
  };

  const handleProcessPdf = async () => {
    setIsLoading(true); 

    try {
      let filePathToSend: string | null = serverPdfPath;

      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf', pdfFile);

        const uploadResponse = await axios.post("http://localhost:8000/api-python/upload-pdf", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        filePathToSend = uploadResponse.data.filePath;
        setServerPdfPath(filePathToSend);
      }

      if (!filePathToSend) {
        alert('Nenhum arquivo PDF disponível para processamento.');
        setIsLoading(false);
        return;
      }

      // Realizar a chamada da API de processamento, passando apenas o caminho do arquivo
      const processResponse = await axios.post("http://localhost:8000/api-python/process-pdf", {
        file_path: filePathToSend
      });

      const apiResponse = await processResponse.data;
      
      const data = JSON.parse(apiResponse.data);

      console.log(data);
      console.log(data.unidadeConsumo);

      setFormData(prevData => ({
        ...prevData,
        unidadeConsumo: data.unidadeConsumo,
        referencia: data.referencia,
        vencimento: formatarDataParaInput(data.vencimento),
        data_leitura_anterior: formatarDataParaInput(data.data_leitura_anterior),
        data_leitura_atual: formatarDataParaInput(data.data_leitura_atual),
        data_leitura_proxima: formatarDataParaInput(data.data_leitura_proxima),
        diasLidos: data.diasLidos,
        medidor: data.medidor,
        leituraAnterior: data.leituraAnterior,
        leituraAtual: data.leituraAtual,
        totalApurado: data.totalApurado,
        valorTotal: data.valorTotal
      }));
      setShowProcessedData(true);

    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      alert(`Erro ao processar PDF: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
      setShowProcessedData(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white shadow-md rounded-lg">
      <div className="mb-4">
        <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
          Anexar PDF da Fatura
        </label>
        <Input
          id="pdfFile"
          name="pdfFile"
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      <div className="flex justify-start space-x-2 pt-4">
        <Button
          type="button"
          onClick={handleProcessPdf}
          disabled={isLoading || (!pdfFile && !serverPdfPath)}
          className={`px-4 py-2 rounded-md transition duration-300 ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isLoading ? 'Processando...' : 'Processar PDF'}
        </Button>
      </div>

      {showProcessedData && (
        <div className="space-y-4 mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados Processados do PDF</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unidadeConsumo" className="block text-sm font-medium text-gray-700">Unidade de Consumo</label>
              <Input
                id="unidadeConsumo"
                name="unidadeConsumo"
                type="text"
                value={formData.unidadeConsumo}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="referencia" className="block text-sm font-medium text-gray-700">Referência</label>
              <Input
                id="referencia"
                name="referencia"
                type="text"
                value={formData.referencia}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vencimento" className="block text-sm font-medium text-gray-700">Vencimento</label>
              <Input
                id="vencimento"
                name="vencimento"
                type="date"
                value={formData.vencimento}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="valorTotal" className="block text-sm font-medium text-gray-700">Valor Total</label>
              <Input
                id="valorTotal"
                name="valorTotal"
                type="number"
                value={formData.valorTotal}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="data_leitura_anterior" className="block text-sm font-medium text-gray-700">Data Leitura Anterior</label>
              <Input
                id="data_leitura_anterior"
                name="data_leitura_anterior"
                type="date"
                value={formData.data_leitura_anterior}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="data_leitura_atual" className="block text-sm font-medium text-gray-700">Data Leitura Atual</label>
              <Input
                id="data_leitura_atual"
                name="data_leitura_atual"
                type="date"
                value={formData.data_leitura_atual}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="data_leitura_proxima" className="block text-sm font-medium text-gray-700">Data Leitura Próxima</label>
              <Input
                id="data_leitura_proxima"
                name="data_leitura_proxima"
                type="date"
                value={formData.data_leitura_proxima}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="diasLidos" className="block text-sm font-medium text-gray-700">Dias Lidos</label>
              <Input
                id="diasLidos"
                name="diasLidos"
                type="number"
                value={formData.diasLidos}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="medidor" className="block text-sm font-medium text-gray-700">Medidor</label>
              <Input
                id="medidor"
                name="medidor"
                type="number"
                value={formData.medidor}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="leituraAnterior" className="block text-sm font-medium text-gray-700">Leitura Anterior</label>
              <Input
                id="leituraAnterior"
                name="leituraAnterior"
                type="number"
                value={formData.leituraAnterior}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leituraAtual" className="block text-sm font-medium text-gray-700">Leitura Atual</label>
              <Input
                id="leituraAtual"
                name="leituraAtual"
                type="number"
                value={formData.leituraAtual}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="totalApurado" className="block text-sm font-medium text-gray-700">Total Apurado</label>
              <Input
                id="totalApurado"
                name="totalApurado"
                type="number"
                value={formData.totalApurado}
                readOnly={true} // Campo somente leitura
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md transition duration-300">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!showProcessedData} // Desabilita o botão "Salvar" se os dados não foram processados
          className={`px-4 py-2 rounded-md transition duration-300 ${!showProcessedData ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {initialData && initialData.id ? 'Salvar Alterações' : 'Criar Fatura'}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;