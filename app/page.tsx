'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Dashboard } from '@/components/Dashboard';
import { Ticket } from '@/types';
import { BarChart3 } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<Ticket[] | null>(null);
  const [filename, setFilename] = useState<string>('');

  const handleDataLoaded = (parsedData: Ticket[], name: string) => {
    setData(parsedData);
    setFilename(name);
  };

  const handleClear = () => {
    setData(null);
    setFilename('');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BarChart3 size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DataDash</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-xl mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                Visualize seus relatórios
              </h1>
              <p className="text-lg text-slate-600">
                Faça o upload do seu arquivo CSV de atendimentos para gerar dashboards interativos e extrair insights valiosos instantaneamente.
              </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <Dashboard data={data} filename={filename} onClear={handleClear} />
        )}
      </div>
    </main>
  );
}
