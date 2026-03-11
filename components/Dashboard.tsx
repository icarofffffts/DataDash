import React, { useMemo, useState } from 'react';
import { Ticket } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, Rectangle
} from 'recharts';
import { format, differenceInMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, FileText, Filter, MessageSquare } from 'lucide-react';

interface DashboardProps {
  data: Ticket[];
  filename: string;
  onClear: () => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100/50 z-50">
        <p className="font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-6">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color || entry.payload.fill }} 
                />
                <span className="text-sm font-medium text-slate-600">{entry.name}:</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function Dashboard({ data, filename, onClear }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});

  const filteredData = useMemo(() => {
    return data.filter(ticket => {
      let statusMatch = true;
      if (statusFilter !== 'ALL') {
        statusMatch = ticket.status === statusFilter;
      }
      
      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        if (ticket.dataInicial) {
          const ticketDate = ticket.dataInicial.getTime();
          const start = dateRange.start ? startOfDay(parseISO(dateRange.start)).getTime() : 0;
          const end = dateRange.end ? endOfDay(parseISO(dateRange.end)).getTime() : Infinity;
          dateMatch = ticketDate >= start && ticketDate <= end;
        } else {
          dateMatch = false;
        }
      }
      
      return statusMatch && dateMatch;
    });
  }, [data, statusFilter, dateRange]);

  const metrics = useMemo(() => {
    const total = filteredData.length;
    const closed = filteredData.filter(d => d.status === 'CLOSED').length;
    const open = filteredData.filter(d => d.status === 'OPEN').length;
    
    // Group by Status
    const statusData = [
      { name: 'Fechado', value: closed },
      { name: 'Aberto', value: open }
    ];

    // Group by Group
    const groupMap = filteredData.reduce((acc, curr) => {
      const group = curr.grupo || 'Sem Grupo';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const groupData = Object.entries(groupMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group by Agent
    const agentMap = filteredData.reduce((acc, curr) => {
      const agent = curr.agente || 'Sem Agente';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const agentData = Object.entries(agentMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Group by Channel
    const channelMap = filteredData.reduce((acc, curr) => {
      const channel = curr.canal || 'Desconhecido';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const channelData = Object.entries(channelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Group by Date (Day)
    const dateMap = filteredData.reduce((acc, curr) => {
      if (!curr.dataInicial) return acc;
      const dateStr = format(curr.dataInicial, 'dd/MM/yyyy');
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timelineData = Object.entries(dateMap)
      .map(([date, count]) => {
        const [day, month, year] = date.split('/');
        return {
          date,
          sortDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime(),
          count
        };
      })
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ date, count }) => ({ date, count }));

    // Calculate average resolution time
    let totalMinutes = 0;
    let resolvedCount = 0;
    filteredData.forEach(ticket => {
      if (ticket.status === 'CLOSED' && ticket.dataInicial && ticket.dataEncerramento) {
        const mins = differenceInMinutes(ticket.dataEncerramento, ticket.dataInicial);
        if (mins >= 0) {
          totalMinutes += mins;
          resolvedCount++;
        }
      }
    });
    
    const avgResolutionMinutes = resolvedCount > 0 ? Math.round(totalMinutes / resolvedCount) : 0;
    const avgResolutionText = avgResolutionMinutes > 60 
      ? `${Math.floor(avgResolutionMinutes / 60)}h ${avgResolutionMinutes % 60}m`
      : `${avgResolutionMinutes}m`;

    return {
      total,
      closed,
      open,
      statusData,
      groupData,
      agentData,
      channelData,
      timelineData,
      avgResolutionText
    };
  }, [filteredData]);

  const formatDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return '-';
    const mins = differenceInMinutes(end, start);
    if (mins < 0) return '-';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setDateRange({start: '', end: ''});
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard de Atendimentos</h1>
          <div className="flex items-center text-sm text-slate-500 mt-1 space-x-2">
            <FileText size={16} />
            <span>{filename}</span>
            <span>•</span>
            <span>{data.length} registros totais</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-lg inline-flex">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Dados Brutos
            </button>
          </div>
          <button 
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Novo Arquivo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex items-center space-x-2 text-slate-700 font-medium mb-1 sm:mb-0 sm:mr-2">
          <Filter size={18} />
          <span>Filtros:</span>
        </div>
        
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors hover:border-slate-300 outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="OPEN">Aberto</option>
            <option value="CLOSED">Fechado</option>
          </select>
        </div>
        
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Data Inicial</label>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors hover:border-slate-300 outline-none"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Data Final</label>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors hover:border-slate-300 outline-none"
          />
        </div>
        
        <button 
          onClick={clearFilters}
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          Limpar
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Protocolos Filtrados</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.total}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Fechados</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.closed}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  {metrics.total > 0 ? Math.round((metrics.closed / metrics.total) * 100) : 0}% do total
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Abertos</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.open}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  {metrics.total > 0 ? Math.round((metrics.open / metrics.total) * 100) : 0}% do total
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tempo Médio Resolução</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.avgResolutionText}</p>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Volume de Atendimentos por Dia</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Atendimentos" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} 
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Canais de Atendimento</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.channelData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1000}
                    >
                      {metrics.channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      formatter={(value) => <span className="text-slate-700 font-medium text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Top 10 Grupos</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.groupData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                      width={150}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar 
                      dataKey="value" 
                      name="Protocolos" 
                      radius={[0, 6, 6, 0]}
                      activeBar={<Rectangle fill="#4f46e5" />}
                      animationDuration={1200}
                    >
                      {metrics.groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Top 10 Agentes</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.agentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                      width={150}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar 
                      dataKey="value" 
                      name="Protocolos" 
                      fill="#8b5cf6" 
                      radius={[0, 6, 6, 0]}
                      activeBar={<Rectangle fill="#7c3aed" />}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Data Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Protocolo</th>
                  <th className="p-4">Agente</th>
                  <th className="p-4">Grupo</th>
                  <th className="p-4">Canal</th>
                  <th className="p-4">Data Inicial</th>
                  <th className="p-4">Duração</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.slice(0, 100).map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-600">{ticket.protocolo}</td>
                    <td className="p-4 text-slate-900 font-medium">{ticket.agente}</td>
                    <td className="p-4 text-slate-600">{ticket.grupo}</td>
                    <td className="p-4 text-slate-600">{ticket.canal || '-'}</td>
                    <td className="p-4 text-slate-600">
                      {ticket.dataInicial ? format(ticket.dataInicial, 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatDuration(ticket.dataInicial, ticket.dataEncerramento)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.status === 'CLOSED' ? 'Fechado' : 'Aberto'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 100 && (
            <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100 bg-slate-50">
              Mostrando os primeiros 100 registros de {filteredData.length}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
