'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Database, Zap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ScrapeJob {
  id: string;
  sre: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  licitacoesEncontradas: number;
  erro?: string;
}

export default function ScrapingAutomationPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSREs, setSelectedSREs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/scrape/status');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setIsRunning(data.isRunning || false);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const startScraping = async () => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sres: selectedSREs.length > 0 ? selectedSREs : 'all' 
        })
      });
      
      if (response.ok) {
        setIsRunning(true);
        fetchJobs();
      }
    } catch (error) {
      console.error('Erro ao iniciar scraping:', error);
    }
  };

  const stopScraping = async () => {
    try {
      await fetch('/api/scrape/stop', { method: 'POST' });
      setIsRunning(false);
    } catch (error) {
      console.error('Erro ao parar scraping:', error);
    }
  };

  const getStatusIcon = (status: ScrapeJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    running: jobs.filter(j => j.status === 'running').length,
    licitacoesTotal: jobs.reduce((sum, j) => sum + j.licitacoesEncontradas, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                Automação de Scraping
              </h1>
              <p className="text-gray-600">
                Coleta automática de licitações das 47 SREs de Minas Gerais
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              {!isRunning ? (
                <button
                  onClick={startScraping}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Iniciar Scraping
                </button>
              ) : (
                <button
                  onClick={stopScraping}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Pause className="w-5 h-5" />
                  Parar Scraping
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Jobs</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Em Execução</div>
            <div className="text-3xl font-bold text-blue-600">{stats.running}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Concluídos</div>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Falhas</div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Licitações</div>
            <div className="text-3xl font-bold text-purple-600">{stats.licitacoesTotal}</div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Jobs de Scraping</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SRE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Licitações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>Nenhum job em execução</p>
                      <p className="text-sm mt-1">Clique em "Iniciar Scraping" para começar</p>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {job.status === 'running' ? 'Executando' : 
                             job.status === 'completed' ? 'Concluído' :
                             job.status === 'failed' ? 'Falhou' : 'Aguardando'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.sre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.startTime ? new Date(job.startTime).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.endTime ? new Date(job.endTime).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {job.licitacoesEncontradas}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {job.erro ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {job.erro}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre o Scraping Automatizado</p>
              <p>O sistema coleta automaticamente licitações das 47 Superintendências Regionais de Ensino de Minas Gerais. 
              Após a coleta, as licitações são processadas pela IA para categorização e análise de relevância.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
