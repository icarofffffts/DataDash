import React, { useState } from 'react';
import { UploadCloud, FileType, X } from 'lucide-react';
import { parseCSV } from '../lib/csvParser';
import { Ticket } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: Ticket[], filename: string) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      return;
    }

    try {
      const data = await parseCSV(file);
      onDataLoaded(data, file.name);
    } catch (err) {
      setError('Erro ao processar o arquivo. Verifique o formato.');
      console.error(err);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50/50' 
            : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <UploadCloud size={40} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Importar Relatório</h3>
            <p className="text-sm text-slate-500 mt-1">Arraste e solte seu arquivo CSV aqui ou clique para selecionar</p>
          </div>
          
          <label className="mt-4 cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
            Selecionar Arquivo
            <input type="file" className="hidden" accept=".csv" onChange={onFileInput} />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-start space-x-3">
          <X className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
