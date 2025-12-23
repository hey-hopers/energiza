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
  const [serverPdfPath, setServerPdfPath] = useState<string | null>(null); // 3. Novo estado para o caminho do PDF no servidor
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setInvoice({
          ...initialData,
          dueDate: initialData.dueDate.split('T')[0] // Format for date input
      });
      setPdfFile(null);
      setServerPdfPath(initialData.pdfFilePath || null); 
    } else {
      setInvoice(initialInvoiceState);
      setPdfFile(null);
      setServerPdfPath(null);
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
  };

  const handleProcessPdf = async () => {
    setIsLoading(true); 

    try {
      let filePathToSend: string | null = serverPdfPath;

      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf', pdfFile); // 'pdf' é a chave esperada pelo backend de upload

        // Endpoint de upload do backend
        const uploadResponse = await axios.post("http://localhost:8000/api-python/upload-pdf", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        filePathToSend = uploadResponse.data.filePath; // Obter o caminho retornado pelo servidor
        setServerPdfPath(filePathToSend); // Atualizar o estado com o caminho do servidor
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
      
      console.log("PDF processado com sucesso:", processResponse.data);

    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      alert(`Erro ao processar PDF: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Input
          id="pdfFile"
          name="pdfFile"
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="flex justify-start space-x-2 pt-4">
        <Button
          type="button"
          onClick={handleProcessPdf}
          disabled={isLoading || (!pdfFile && !serverPdfPath)}
          className={`bg-blue-500 text-white hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Processando...' : 'Processar PDF'}
        </Button>
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