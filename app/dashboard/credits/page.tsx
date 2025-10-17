'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Zap, Clock, Check, RefreshCw } from 'lucide-react';

interface CreditStatus {
  balance: number;
  hasCredits: boolean;
  status: 'free' | 'limited' | 'ok' | 'insufficient';
  message: string;
}

interface WaitingJob {
  id: string;
  type: 'batch' | 'single';
  licitacaoCount: number;
  createdAt: string;
  reason: string;
}

interface CreditPageData {
  credit: CreditStatus;
  canProcessBatch: boolean;
  canProcessSingle: boolean;
  recommendations: string[];
  waitingJobs?: WaitingJob[];
}

export default function CreditsPage() {
  const [data, setData] = useState<CreditPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/openrouter/credits?action=status');
      if (!response.ok) throw new Error('Falha ao carregar status');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 border-green-300';
      case 'limited':
        return 'bg-yellow-100 border-yellow-300';
      case 'insufficient':
      case 'free':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'limited':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'insufficient':
      case 'free':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Zap className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">❌ Erro: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">💳 Status de Créditos OpenRouter</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Credit Status Card */}
      <div className={`border-2 rounded-lg p-6 ${getStatusColor(data.credit.status)}`}>
        <div className="flex items-center gap-4">
          {getStatusIcon(data.credit.status)}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{data.credit.message}</h2>
            <p className="text-sm opacity-75">
              Saldo: <span className="font-mono font-bold">${data.credit.balance.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`border rounded-lg p-4 ${data.canProcessBatch ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <p className="text-sm font-semibold mb-1">Processar em Lote</p>
          <p className={`text-sm ${data.canProcessBatch ? 'text-green-600' : 'text-red-600'}`}>
            {data.canProcessBatch ? '✅ Disponível' : '❌ Indisponível'}
          </p>
        </div>
        <div className={`border rounded-lg p-4 ${data.canProcessSingle ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <p className="text-sm font-semibold mb-1">Processar Individual</p>
          <p className={`text-sm ${data.canProcessSingle ? 'text-green-600' : 'text-red-600'}`}>
            {data.canProcessSingle ? '✅ Disponível' : '❌ Indisponível'}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="border rounded-lg p-6 bg-blue-50 border-blue-300">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Recomendações
        </h3>
        <ul className="space-y-2">
          {data.recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-blue-900">
              • {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Waiting Jobs */}
      {data.waitingJobs && data.waitingJobs.length > 0 && (
        <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-300">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Jobs em Fila de Espera ({data.waitingJobs.length})
          </h3>
          <div className="space-y-2">
            {data.waitingJobs.map(job => (
              <div key={job.id} className="bg-white rounded p-3 text-sm">
                <p className="font-mono text-xs text-gray-500 mb-1">ID: {job.id}</p>
                <p>
                  <span className="font-semibold">{job.type === 'batch' ? '📊 Lote' : '📝 Individual'}:</span> {job.licitacaoCount} licitação(ões)
                </p>
                <p className="text-xs text-gray-600">Razão: {job.reason}</p>
                <p className="text-xs text-gray-500">
                  Adicionado: {new Date(job.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Documentation */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="font-semibold mb-3">📚 API Endpoints</h3>
        <div className="space-y-3 text-sm font-mono text-gray-700">
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold text-gray-900">Status de Créditos</p>
            <p>GET /api/openrouter/credits?action=status</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold text-gray-900">Saldo Apenas</p>
            <p>GET /api/openrouter/credits?action=balance</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold text-gray-900">Jobs em Fila</p>
            <p>GET /api/openrouter/credits?action=waiting-jobs</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold text-gray-900">Processar IA (com verificação)</p>
            <p>POST /api/process-ia-with-logs</p>
            <p className="text-xs text-gray-500 mt-1">
              Retorna 402 se sem créditos + adiciona à fila
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">💡 Sobre Créditos OpenRouter:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Free Tier:</strong> Requisições limitadas, sem saldo em USD</li>
          <li>• <strong>Tier Pago:</strong> Adicione cartão em openrouter.ai</li>
          <li>• <strong>Monitoramento:</strong> Dados atualizados a cada 30 segundos</li>
          <li>• <strong>Fila de Espera:</strong> Jobs automáticamente aguardam créditos</li>
        </ul>
      </div>
    </div>
  );
}
