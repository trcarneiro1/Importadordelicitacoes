'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface DataDebugRecord {
  id: string;
  numero_edital: string;
  objeto: string;
  data_publicacao: string;
  raw_data: {
    numero_edital_raw: string;
    objeto_raw: string;
    data_publicacao_raw: string;
  };
  validation: {
    quality_score: number;
    relevance_score: number;
    is_relevant: boolean;
  };
  categoria_ia: string | null;
}

export default function DataDebugPage() {
  const [licitacoes, setLicitacoes] = useState<DataDebugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'relevant' | 'invalid'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/data-comparison');
      const data = await response.json();
      setLicitacoes(data.licitacoes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = licitacoes.filter(lic => {
    if (filter === 'relevant') return lic.validation.is_relevant;
    if (filter === 'invalid') return !lic.validation.is_relevant;
    return true;
  });

  const stats = {
    total: licitacoes.length,
    relevant: licitacoes.filter(l => l.validation.is_relevant).length,
    invalid: licitacoes.filter(l => !l.validation.is_relevant).length,
    avgQuality: Math.round(
      licitacoes.reduce((sum, l) => sum + l.validation.quality_score, 0) / licitacoes.length
    ),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Debug de Dados</h1>
          <p className="text-gray-600">
            Comparação: Dados Brutos → Scraper → IA
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Licitações</div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Relevantes ✅</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.relevant} ({Math.round((stats.relevant / stats.total) * 100)}%)
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Inválidas ❌</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.invalid} ({Math.round((stats.invalid / stats.total) * 100)}%)
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Qualidade Média</div>
            <div className="text-3xl font-bold text-purple-600">{stats.avgQuality}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'relevant', 'invalid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f === 'all' && '📊 Todas'}
              {f === 'relevant' && '✅ Relevantes'}
              {f === 'invalid' && '❌ Inválidas'}
              {` (${
                f === 'all'
                  ? stats.total
                  : f === 'relevant'
                  ? stats.relevant
                  : stats.invalid
              })`}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">⏳</div>
            <p className="mt-2 text-gray-600">Carregando dados...</p>
          </div>
        )}

        {/* Data Table */}
        {!loading && (
          <div className="space-y-4">
            {filtered.map(lic => (
              <div
                key={lic.id}
                className={`bg-white rounded-lg shadow overflow-hidden transition-all ${
                  expandedId === lic.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(expandedId === lic.id ? null : lic.id)}
                  className={`p-4 cursor-pointer flex items-center justify-between ${
                    lic.validation.is_relevant
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {lic.validation.is_relevant ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-bold text-gray-900">
                          {lic.numero_edital || 'S/N'}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-1">
                          {lic.objeto || 'Não informado'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Badge */}
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {lic.validation.quality_score}%
                      </div>
                      <div className="text-xs text-gray-600">Qualidade</div>
                    </div>
                    {expandedId === lic.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === lic.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Comparison Table */}
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">Comparação de Dados</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-300 bg-white">
                              <th className="text-left p-2 font-bold">Campo</th>
                              <th className="text-left p-2 font-bold">Dado Bruto (Página)</th>
                              <th className="text-left p-2 font-bold">Processado (Scraper)</th>
                              <th className="text-left p-2 font-bold">Final (IA)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* numero_edital */}
                            <tr className="border-b border-gray-200">
                              <td className="p-2 font-medium">Edital</td>
                              <td className="p-2 font-mono text-xs text-gray-600 bg-white">
                                {lic.raw_data.numero_edital_raw || '—'}
                              </td>
                              <td className="p-2 font-mono text-xs font-bold text-blue-600 bg-blue-50">
                                {lic.numero_edital}
                              </td>
                              <td className="p-2 font-mono text-xs text-gray-600">—</td>
                            </tr>

                            {/* objeto */}
                            <tr className="border-b border-gray-200">
                              <td className="p-2 font-medium">Objeto</td>
                              <td className="p-2 text-xs text-gray-600 bg-white max-w-xs truncate">
                                {lic.raw_data.objeto_raw || '—'}
                              </td>
                              <td className="p-2 text-xs font-bold text-blue-600 bg-blue-50 max-w-xs truncate">
                                {lic.objeto}
                              </td>
                              <td className="p-2 text-xs text-gray-600">
                                {lic.categoria_ia || '—'}
                              </td>
                            </tr>

                            {/* data_publicacao */}
                            <tr className="border-b border-gray-200">
                              <td className="p-2 font-medium">Data Publicação</td>
                              <td className="p-2 font-mono text-xs text-gray-600 bg-white">
                                {lic.raw_data.data_publicacao_raw || '—'}
                              </td>
                              <td className="p-2 font-mono text-xs font-bold text-blue-600 bg-blue-50">
                                {lic.data_publicacao}
                              </td>
                              <td className="p-2 font-mono text-xs text-gray-600">—</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white p-4 rounded border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Qualidade</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                lic.validation.quality_score >= 70
                                  ? 'bg-green-500'
                                  : lic.validation.quality_score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${lic.validation.quality_score}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 w-12 text-right">
                            {lic.validation.quality_score}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Relevância</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                lic.validation.relevance_score >= 70
                                  ? 'bg-green-500'
                                  : lic.validation.relevance_score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${lic.validation.relevance_score}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 w-12 text-right">
                            {lic.validation.relevance_score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200">
                      {lic.validation.is_relevant ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">✅ Relevante - Será exibida no Dashboard</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700 font-medium">❌ Não Relevante - Filtrada do Dashboard</span>
                        </>
                      )}
                    </div>

                    {/* Link para Licitação */}
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/${lic.id}`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Ver Licitação Completa →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-600">Nenhuma licitação encontrada com este filtro</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
