'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, Brain, Play, Square, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ScrapingJob {
  id: string;
  sre: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  inicio?: Date;
  fim?: Date;
  licitacoesEncontradas: number;
  erro?: string;
}

interface ProcessamentoIAStats {
  total: number;
  processados: number;
  pendentes: number;
  taxa_sucesso: number;
  tempo_medio: number;
}

interface ScrapingLog {
  id?: string;
  sre_name: string;
  sre_code?: number;
  status: string;
  message: string;
  page_number?: number;
  total_pages?: number;
  licitacoes_found_this_page?: number;
  duration_ms?: number;
  error_message?: string;
  timestamp?: string;
}

export default function MonitoramentoPage() {
  const [scrapingAtivo, setScrapingAtivo] = useState(false);
  const [processamentoAtivo, setProcessamentoAtivo] = useState(false);
  const [ultimoScraping, setUltimoScraping] = useState<Date | null>(null);
  const [ultimoProcessamento, setUltimoProcessamento] = useState<Date | null>(null);
  const [stats, setStats] = useState<ProcessamentoIAStats>({
    total: 0,
    processados: 0,
    pendentes: 0,
    taxa_sucesso: 0,
    tempo_medio: 0,
  });

  // Novo: Logs de scraping em tempo real
  const [sessionId, setSessionId] = useState<string>('');
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [isScrapingWithLogs, setIsScrapingWithLogs] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(1000);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll quando novos logs chegam
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/automation/status');
      if (response.ok) {
        const data = await response.json();
        setScrapingAtivo(data.scraping_ativo);
        setProcessamentoAtivo(data.processamento_ativo);
        setUltimoScraping(data.ultimo_scraping ? new Date(data.ultimo_scraping) : null);
        setUltimoProcessamento(data.ultimo_processamento ? new Date(data.ultimo_processamento) : null);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const iniciarScraping = async () => {
    try {
      const response = await fetch('/api/automation/scraping/start', { method: 'POST' });
      if (response.ok) {
        setScrapingAtivo(true);
        alert('Scraping iniciado! Acompanhe o progresso abaixo.');
        loadStatus();
      }
    } catch (error) {
      console.error('Erro ao iniciar scraping:', error);
      alert('Erro ao iniciar scraping');
    }
  };

  // Novo: Iniciar scraping com logs em tempo real
  const iniciarScrapingComLogs = async () => {
    try {
      setIsScrapingWithLogs(true);
      setLogs([]);

      const response = await fetch('/api/scrape-with-logs', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id);
        adicionarLog({
          sre_name: 'SISTEMA',
          status: 'starting',
          message: `🚀 Scraping iniciado! Session: ${data.session_id}`,
        });

        // Começar a fazer polling dos logs
        iniciarPolling(data.session_id);
      } else {
        adicionarLog({
          sre_name: 'ERRO',
          status: 'error',
          message: `❌ Erro ao iniciar scraping: ${data.error}`,
        });
        setIsScrapingWithLogs(false);
      }
    } catch (error) {
      adicionarLog({
        sre_name: 'ERRO',
        status: 'error',
        message: `❌ Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setIsScrapingWithLogs(false);
    }
  };

  // Novo: Polling de logs
  const iniciarPolling = (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/scraping-logs?session_id=${id}&limit=200`);
        const data = await response.json();

        if (data.success && data.logs) {
          setLogs(data.logs);

          // Verificar se terminou
          if (data.logs.some((log: ScrapingLog) => log.status === 'completed' && log.sre_name === 'SISTEMA')) {
            setIsScrapingWithLogs(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }
      } catch (error) {
        console.error('Erro ao obter logs:', error);
      }
    };

    // Fazer polling imediatamente e depois a cada intervalo
    poll();
    pollingRef.current = setInterval(poll, updateInterval);
  };

  // Novo: Parar polling
  const pararScrapingComLogs = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsScrapingWithLogs(false);
  };

  const adicionarLog = (log: ScrapingLog) => {
    setLogs((prev) => [
      ...prev,
      {
        ...log,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const pararScraping = async () => {
    try {
      const response = await fetch('/api/automation/scraping/stop', { method: 'POST' });
      if (response.ok) {
        setScrapingAtivo(false);
        alert('Scraping parado com sucesso!');
        loadStatus();
      }
    } catch (error) {
      console.error('Erro ao parar scraping:', error);
    }
  };

  const iniciarProcessamentoIA = async () => {
    try {
      const response = await fetch('/api/automation/ia/process', { method: 'POST' });
      if (response.ok) {
        setProcessamentoAtivo(true);
        alert('Processamento IA iniciado!');
        loadStatus();
      }
    } catch (error) {
      console.error('Erro ao iniciar processamento:', error);
      alert('Erro ao iniciar processamento IA');
    }
  };

  const formatTempo = (date: Date | null) => {
    if (!date) return 'Nunca';
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 24) return `${Math.floor(horas / 24)} dias atrás`;
    if (horas > 0) return `${horas}h atrás`;
    if (minutos > 0) return `${minutos}min atrás`;
    return 'Agora mesmo';
  };

  const getLogColor = (status: string) => {
    switch (status) {
      case 'starting':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'in_progress':
        return 'bg-cyan-50 border-l-4 border-cyan-500';
      case 'page_processing':
        return 'bg-purple-50 border-l-4 border-purple-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'completed':
        return 'bg-green-100 border-l-4 border-green-600';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  const getLogIcon = (status: string, sre_name: string) => {
    if (sre_name === 'SISTEMA') {
      return status === 'completed' ? '🎉' : '⚙️';
    }

    switch (status) {
      case 'starting':
        return '🎯';
      case 'in_progress':
        return '⏳';
      case 'page_processing':
        return '📄';
      case 'success':
        return '✅';
      case 'completed':
        return '🏁';
      case 'error':
        return '❌';
      default:
        return '📌';
    }
  };

  const statsLogs = {
    total_logs: logs.length,
    sres_processadas: new Set(logs.filter((l) => l.sre_code).map((l) => l.sre_code)).size,
    total_licitacoes: logs.reduce((sum, log) => sum + (log.licitacoes_found_this_page || 0), 0),
    erros: logs.filter((l) => l.status === 'error').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Monitoramento de Automação
          </h1>
          <p className="text-gray-600">
            Acompanhe o scraping de licitações e processamento por IA em tempo real
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Scraping Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${scrapingAtivo ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Database className={`w-6 h-6 ${scrapingAtivo ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Scraping</h2>
                  <p className="text-sm text-gray-600">Coleta de licitações</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                scrapingAtivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {scrapingAtivo ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Última execução: {formatTempo(ultimoScraping)}</span>
              </div>
              {ultimoScraping && (
                <div className="text-xs text-gray-500">
                  {ultimoScraping.toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!scrapingAtivo ? (
                <button
                  onClick={iniciarScraping}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Scraping
                </button>
              ) : (
                <button
                  onClick={pararScraping}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Parar Scraping
                </button>
              )}
              <button
                onClick={loadStatus}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Processamento IA Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${processamentoAtivo ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Brain className={`w-6 h-6 ${processamentoAtivo ? 'text-purple-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Processamento IA</h2>
                  <p className="text-sm text-gray-600">Análise inteligente</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                processamentoAtivo ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {processamentoAtivo ? 'Processando' : 'Aguardando'}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Última execução: {formatTempo(ultimoProcessamento)}</span>
              </div>
              {ultimoProcessamento && (
                <div className="text-xs text-gray-500">
                  {ultimoProcessamento.toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={iniciarProcessamentoIA}
                disabled={processamentoAtivo}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  processamentoAtivo
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                Processar Pendentes
              </button>
              <button
                onClick={loadStatus}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Estatísticas de Processamento IA</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.processados}</div>
              <div className="text-sm text-gray-600">Processados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.pendentes}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.taxa_sucesso.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Taxa Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.tempo_medio.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </div>
          </div>
        </div>

        {/* Configuração de Automação */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">⚙️ Automação Diária Configurada</h3>
          <p className="text-gray-700 mb-4">
            O sistema está configurado para executar automaticamente <strong>1 vez por dia às 03:00</strong>:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span><strong>Scraping automático</strong> - Coleta licitações de todos os 47 SREs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <span><strong>Processamento IA imediato</strong> - Cada nova licitação é processada automaticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <span>Você pode forçar execução manual a qualquer momento usando os botões acima</span>
            </li>
          </ul>
        </div>

        {/* NOVO: Monitoramento em Tempo Real com Logs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📊 Monitoramento Detalhado de Scraping</h3>
            <button
              onClick={iniciarScrapingComLogs}
              disabled={isScrapingWithLogs}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isScrapingWithLogs
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:scale-95 text-white'
              }`}
            >
              {isScrapingWithLogs ? '⏳ Scraping em andamento...' : '🚀 Iniciar Scraping Detalhado'}
            </button>
          </div>

          {isScrapingWithLogs && (
            <div className="mb-4 flex gap-4 items-center">
              <button
                onClick={pararScrapingComLogs}
                className="px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                ⏹️ Parar
              </button>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Auto-scroll</span>
              </label>

              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                className="px-3 py-1 rounded border border-gray-300 text-sm"
              >
                <option value={500}>500ms</option>
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
              </select>
            </div>
          )}

          {/* Stats dos Logs */}
          {logs.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Logs</div>
                <div className="text-xl font-bold text-gray-900">{statsLogs.total_logs}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600">SREs Processadas</div>
                <div className="text-xl font-bold text-blue-700">{statsLogs.sres_processadas}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs text-green-600">Licitações Encontradas</div>
                <div className="text-xl font-bold text-green-700">{statsLogs.total_licitacoes}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-xs text-red-600">Erros</div>
                <div className="text-xl font-bold text-red-700">{statsLogs.erros}</div>
              </div>
            </div>
          )}

          {/* Logs Container */}
          <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
            {logs.length === 0 && !isScrapingWithLogs ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Nenhum scraping iniciado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className={`p-3 rounded text-sm ${getLogColor(log.status)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getLogIcon(log.status, log.sre_name)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-xs">
                            {log.sre_name}
                            {log.sre_code && <span className="text-xs opacity-75"> (#{log.sre_code})</span>}
                          </span>
                          <span className="text-xs opacity-75">
                            {log.timestamp && new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs break-words">{log.message}</p>

                        {/* Detalhes adicionais */}
                        <div className="mt-1 text-xs opacity-75 flex flex-wrap gap-3">
                          {log.page_number !== undefined && (
                            <span>📄 Página {log.page_number}/{log.total_pages}</span>
                          )}
                          {log.licitacoes_found_this_page !== undefined && log.licitacoes_found_this_page > 0 && (
                            <span>📋 {log.licitacoes_found_this_page} licitações</span>
                          )}
                          {log.duration_ms !== undefined && (
                            <span>⏱️ {Math.round(log.duration_ms)}ms</span>
                          )}
                          {log.error_message && <span className="text-red-500">Erro: {log.error_message}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
