'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  total_licitacoes: number;
  valor_total: number;
  media_valor: number;
  categorias_ativas: number;
  sres_ativas: number;
  urgentes: number;
}

export default function DashboardAnalitico() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '15' | '30'>('7');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/licitacoes/stats?days=${timeRange}`);
      const data = await response.json();
      
      if (data.success && data.resumo) {
        setStats(data.resumo);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
               Dashboard Analítico
            </h1>
            <p className="text-gray-600">
              Análise completa de licitações dos últimos {timeRange} dias
            </p>
          </div>

          <div className="flex gap-2">
            {(['7', '15', '30'] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total de Licitações</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_licitacoes || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Últimos {timeRange} dias</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Valor Total</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(stats?.valor_total || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Soma estimada</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Valor Médio</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(stats?.media_valor || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Por licitação</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Categorias Ativas</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.categorias_ativas || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Diferentes categorias</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">SREs Ativas</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.sres_ativas || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Regionais diferentes</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Licitações Urgentes</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.urgentes || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Próximos 7 dias</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Ver Dashboard Clássico
          </Link>
          <Link
            href="/operations/licitacoes"
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow"
          >
            Ver Todas Licitações
          </Link>
        </div>
      </div>
    </div>
  );
}
