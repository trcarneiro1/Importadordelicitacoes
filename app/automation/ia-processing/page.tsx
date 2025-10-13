'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, CheckCircle, Clock, AlertCircle, BarChart3, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface IAJob {
  id: string;
  licitacaoId: string;
  numeroEdital: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  categoriaDetectada?: string;
  scoreRelevancia?: number;
  tempoProcessamento?: number;
  erro?: string;
}

interface IAStats {
  totalProcessados: number;
  emFila: number;
  taxaSucesso: number;
  tempoMedioMs: number;
  categoriasIdentificadas: number;
}

export default function IAProcessingPage() {
  const [jobs, setJobs] = useState<IAJob[]>([]);
  const [stats, setStats] = useState<IAStats>({
    totalProcessados: 0,
    emFila: 0,
    taxaSucesso: 0,
    tempoMedioMs: 0,
    categoriasIdentificadas: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStatus();
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/process-ia/status');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setStats(data.stats || stats);
        setIsProcessing(data.isProcessing || false);
      }
    } catch (error) {
      console.error('Erro ao buscar status de IA:', error);
    }
  };

  const startProcessing = async () => {
    try {
      const response = await fetch('/api/process-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto' })
      });
      
      if (response.ok) {
        setIsProcessing(true);
        fetchStatus();
      }
    } catch (error) {
      console.error('Erro ao iniciar processamento:', error);
    }
  };

  const reprocessarTodas = async () => {
    if (!confirm('Deseja reprocessar TODAS as licitações com IA? Esta ação pode levar vários minutos.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/process-ia/reprocess-all', {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Reprocessamento iniciado com sucesso!');
        fetchStatus();
      }
    } catch (error) {
      console.error('Erro ao reprocessar:', error);
    }
  };

  const getStatusBadge = (status: IAJob['status']) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Na fila' },
      processing: { color: 'bg-blue-100 text-blue-700', icon: Zap, label: 'Processando' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Concluído' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Erro' }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                Processamento com IA
              </h1>
              <p className="text-gray-600">
                Análise automática e categorização de licitações com Inteligência Artificial
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <button
                onClick={reprocessarTodas}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reprocessar Todas
              </button>
              
              <button
                onClick={startProcessing}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                <Sparkles className="w-5 h-5" />
                {isProcessing ? 'Processando...' : 'Processar Pendentes'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Processados</span>
              <CheckCircle className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProcessados}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Em Fila</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.emFila}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Taxa de Sucesso</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.taxaSucesso}%</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tempo Médio</span>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.tempoMedioMs}ms</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Categorias</span>
              <BarChart3 className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.categoriasIdentificadas}</div>
          </div>
        </div>

        {/* Processing Queue */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Fila de Processamento de IA
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria Detectada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">Nenhuma licitação na fila</p>
                      <p className="text-sm mt-1">Todas as licitações foram processadas</p>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/operations/licitacoes/${job.licitacaoId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {job.numeroEdital}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {job.categoriaDetectada ? (
                          <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                            {job.categoriaDetectada}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {job.scoreRelevancia ? (
                          <span className={`text-lg font-bold ${getScoreColor(job.scoreRelevancia)}`}>
                            {job.scoreRelevancia}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {job.tempoProcessamento ? `${job.tempoProcessamento}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {job.erro ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Erro
                          </span>
                        ) : (
                          <Link 
                            href={`/operations/licitacoes/${job.licitacaoId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ver detalhes
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Brain className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">Como funciona o Processamento de IA?</p>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Categorização Automática:</strong> Identifica a categoria da licitação (materiais escolares, obras, serviços, etc.)</li>
                <li>• <strong>Score de Relevância:</strong> Calcula um score de 0-100 baseado em critérios como valor, urgência e categoria</li>
                <li>• <strong>Análise de Conteúdo:</strong> Extrai informações relevantes do objeto e descrição da licitação</li>
                <li>• <strong>Processamento Assíncrono:</strong> Trabalha em segundo plano sem afetar a performance do sistema</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
