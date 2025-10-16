'use client';

import React, { useState, useEffect } from 'react';

interface ScrapingConfig {
  id: string;
  enabled: boolean;
  interval_hours: number;
  interval_minutes: number;
  last_run_at: string | null;
  last_run_success: boolean;
  last_run_licitacoes: number | null;
  last_run_duration_ms: number | null;
  last_run_error: string | null;
  next_run_at: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_licitacoes_found: number;
}

interface ScrapingStats {
  enabled: boolean;
  interval: {
    hours: number;
    minutes: number;
    description: string;
  };
  last_run: {
    at: string | null;
    success: boolean;
    licitacoes_found: number | null;
    duration_ms: number | null;
    error: string | null;
  };
  next_run: {
    at: string | null;
    time_until_ms: number;
    time_until_readable: string;
  };
  statistics: {
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    success_rate: number;
    total_licitacoes_found: number;
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [stats, setStats] = useState<ScrapingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'stats'>('config');

  const [formData, setFormData] = useState({
    enabled: false,
    interval_hours: 6,
    interval_minutes: 0,
  });

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/scraping');
      if (!res.ok) throw new Error('Failed to fetch configuration');
      const data = await res.json();
      setConfig(data.config);
      setStats(data.stats);
      setFormData({
        enabled: data.config.enabled,
        interval_hours: data.config.interval_hours,
        interval_minutes: data.config.interval_minutes,
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: formData.enabled,
          interval_hours: parseInt(formData.interval_hours.toString()),
          interval_minutes: parseInt(formData.interval_minutes.toString()),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      setMessage('Configuração salva com sucesso!');
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleScrapeNow = async () => {
    setScraping(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/scrape-now', {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start scraping');
      }

      setMessage('Scraping iniciado! Verifique os logs para detalhes.');
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Automação de Scraping</h1>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="mb-4 p-4 border border-green-200 bg-green-50 rounded-lg">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configurações
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estatísticas
            </button>
          </div>
        </div>

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Configurar Automação</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  Habilitar Automação
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Interval Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo (Horas)
                  </label>
                  <input
                    type="number"
                    id="hours"
                    min="1"
                    max="72"
                    value={formData.interval_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, interval_hours: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">1-72 horas</p>
                </div>

                <div>
                  <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo (Minutos)
                  </label>
                  <input
                    type="number"
                    id="minutes"
                    min="0"
                    max="59"
                    value={formData.interval_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, interval_minutes: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">0-59 minutos</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </button>

                <button
                  type="button"
                  onClick={handleScrapeNow}
                  disabled={scraping}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {scraping ? 'Executando...' : 'Executar Agora'}
                </button>
              </div>
            </form>

            {/* Info Box */}
            {config && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Próxima execução:</strong>{' '}
                  {config.next_run_at
                    ? new Date(config.next_run_at).toLocaleString('pt-BR')
                    : 'Não agendado'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Estatísticas</h2>

            {stats && (
              <div className="space-y-6">
                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.enabled ? '✓ Ativo' : '○ Inativo'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Intervalo</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.interval.description}</p>
                  </div>
                </div>

                {/* Last Run */}
                {stats.last_run.at && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Última Execução</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Hora:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(stats.last_run.at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status:</p>
                        <p className={`font-medium ${stats.last_run.success ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.last_run.success ? '✓ Sucesso' : '✗ Falha'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Licitações:</p>
                        <p className="font-medium text-gray-900">{stats.last_run.licitacoes_found || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duração:</p>
                        <p className="font-medium text-gray-900">
                          {stats.last_run.duration_ms ? `${Math.round(stats.last_run.duration_ms / 1000)}s` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Run */}
                {stats.next_run.at && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Próxima Execução</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Agendado para:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(stats.next_run.at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tempo restante:</p>
                        <p className="font-medium text-gray-900">{stats.next_run.time_until_readable}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Statistics */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Estatísticas Gerais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total de Execuções</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.statistics.total_runs}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Taxa de Sucesso</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(stats.statistics.success_rate)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Sucessos / Falhas</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {stats.statistics.successful_runs} / {stats.statistics.failed_runs}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Encontrado</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.statistics.total_licitacoes_found}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
