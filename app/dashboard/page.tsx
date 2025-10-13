'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { TrendingUp, DollarSign, FileText, AlertCircle, Filter, Download } from 'lucide-react';
import type { RawLicitacaoData } from '@/lib/supabase/queries';

interface Licitacao {
  id: string;
  sre_code?: number;
  sre_source: string;
  regional?: string;
  numero_edital: string;
  modalidade: string;
  tipo_processo?: string;
  objeto: string;
  valor_estimado?: number;
  data_publicacao?: string;
  data_abertura?: string;
  data_limite_impugnacao?: string;
  prazo_entrega?: string;
  situacao: string;
  categoria?: string;
  categoria_principal?: string;
  categorias_secundarias?: string[];
  processo?: string;
  documentos?: Array<{ nome?: string; url?: string; tipo?: string }>;
  contato?: {
    responsavel?: string;
    email?: string;
    telefone?: string;
  };
  escola?: string;
  municipio_escola?: string;
  fornecedor_tipo?: string;
  score_relevancia?: number;
  resumo_executivo?: string;
  complexidade?: string;
  itens_principais?: string[];
  palavras_chave?: string[];
  raw_data?: RawLicitacaoData | null;
  created_at: string;
  updated_at?: string;
  scraped_at?: string;
}

interface LicitacoesApiResponse {
  success?: boolean;
  data?: Licitacao[];
  licitacoes?: Licitacao[];
}

type ChartDataPoint = {
  name: string;
  value: number;
  percent?: number;
};

function isLicitacoesResponse(value: unknown): value is LicitacoesApiResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LicitacoesApiResponse>;
  const isArrayOrUndefined = (arr?: unknown): arr is Licitacao[] | undefined =>
    arr === undefined || Array.isArray(arr);

  const successValid =
    candidate.success === undefined || typeof candidate.success === 'boolean';

  return successValid &&
    isArrayOrUndefined(candidate.data) &&
    isArrayOrUndefined(candidate.licitacoes);
}

function renderPercentageLabel({ name, percent }: PieLabelRenderProps) {
  const safeName = typeof name === 'string' ? name : String(name ?? '');
  const safePercent = typeof percent === 'number' ? percent : 0;
  return `${safeName}: ${(safePercent * 100).toFixed(0)}%`;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function DashboardPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    sre: '',
    modalidade: '',
    situacao: '',
    valorMin: '',
    valorMax: '',
  });

  useEffect(() => {
    fetchLicitacoes();
  }, []);

  async function fetchLicitacoes() {
    try {
      const response = await fetch('/api/licitacoes');
      const payload: unknown = await response.json();

      if (!isLicitacoesResponse(payload)) {
        throw new Error('Resposta inesperada da API de licitações');
      }

      if (Array.isArray(payload.data)) {
        setLicitacoes(payload.data);
      } else if (Array.isArray(payload.licitacoes)) {
        setLicitacoes(payload.licitacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar licitacões
  const filteredLicitacoes = licitacoes.filter(lic => {
    const sreSource = lic.sre_source || '';
    const modalidade = lic.modalidade || '';
    const situacao = lic.situacao || '';

    if (filter.sre && !sreSource.includes(filter.sre)) return false;
    if (filter.modalidade && modalidade !== filter.modalidade) return false;
    if (filter.situacao && situacao !== filter.situacao) return false;
    const valor = typeof lic.valor_estimado === 'number' ? lic.valor_estimado : undefined;
    if (filter.valorMin) {
      const min = parseFloat(filter.valorMin);
      if (!Number.isNaN(min) && (valor === undefined || valor < min)) return false;
    }
    if (filter.valorMax) {
      const max = parseFloat(filter.valorMax);
      if (!Number.isNaN(max) && (valor === undefined || valor > max)) return false;
    }
    return true;
  });

  // Estatísticas
  const totalLicitacoes = filteredLicitacoes.length;
  const totalValor = filteredLicitacoes.reduce((sum, lic) => {
    const valor = typeof lic.valor_estimado === 'number' ? lic.valor_estimado : 0;
    return sum + valor;
  }, 0);
  const licitacoesAbertas = filteredLicitacoes.filter(lic => lic.situacao === 'Aberta' || lic.situacao === 'Em andamento').length;
  const mediaValor = totalLicitacoes > 0 ? totalValor / totalLicitacoes : 0;

  // Dados para gráficos
  const licitacoesPorSRE = Object.entries(
    filteredLicitacoes.reduce<Record<string, number>>((acc, lic) => {
      const rawSre = lic.sre_source || 'SRE Desconhecida';
      const sre = rawSre.replace('.educacao.mg.gov.br', '').replace('sre', 'SRE ');
      acc[sre] = (acc[sre] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map<ChartDataPoint>(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const licitacoesPorModalidade = Object.entries(
    filteredLicitacoes.reduce<Record<string, number>>((acc, lic) => {
      const modalidade = lic.modalidade || 'Não informada';
      acc[modalidade] = (acc[modalidade] ?? 0) + 1;
      return acc;
    }, {})
  ).map<ChartDataPoint>(([name, value]) => ({ name, value }));

  const valorPorSRE = Object.entries(
    filteredLicitacoes.reduce<Record<string, number>>((acc, lic) => {
      const rawSre = lic.sre_source || 'SRE Desconhecida';
      const sre = rawSre.replace('.educacao.mg.gov.br', '').replace('sre', 'SRE ');
      const valor = typeof lic.valor_estimado === 'number' ? lic.valor_estimado : 0;
      acc[sre] = (acc[sre] ?? 0) + valor;
      return acc;
    }, {})
  )
    .map<ChartDataPoint>(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const licitacoesPorCategoria = Object.entries(
    filteredLicitacoes.reduce<Record<string, number>>((acc, lic) => {
      const cat = lic.categoria || lic.categoria_principal || 'Outros';
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {})
  ).map<ChartDataPoint>(([name, value]) => ({ name, value }));

  // Valores únicos para filtros
  const sresUnicas = Array.from(new Set(licitacoes.map(l => l.sre_source || 'SRE Desconhecida'))).sort();
  const modalidadesUnicas = Array.from(new Set(licitacoes.map(l => l.modalidade || 'Não informada'))).sort();
  const situacoesUnicas = Array.from(new Set(licitacoes.map(l => l.situacao))).sort();

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard de Licitações</h1>
            <p className="text-gray-600">Superintendências Regionais de Ensino - MG</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.href = '/noticias'}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow hover:shadow-lg transition-all font-medium"
            >
              📰 Central de Notícias (IA)
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SRE</label>
              <select
                value={filter.sre}
                onChange={(e) => setFilter({ ...filter, sre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {sresUnicas.map(sre => (
                  <option key={sre} value={sre}>{sre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
              <select
                value={filter.modalidade}
                onChange={(e) => setFilter({ ...filter, modalidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {modalidadesUnicas.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
              <select
                value={filter.situacao}
                onChange={(e) => setFilter({ ...filter, situacao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {situacoesUnicas.map(sit => (
                  <option key={sit} value={sit}>{sit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mín (R$)</label>
              <input
                type="number"
                value={filter.valorMin}
                onChange={(e) => setFilter({ ...filter, valorMin: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máx (R$)</label>
              <input
                type="number"
                value={filter.valorMax}
                onChange={(e) => setFilter({ ...filter, valorMax: e.target.value })}
                placeholder="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setFilter({ sre: '', modalidade: '', situacao: '', valorMin: '', valorMax: '' })}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Licitações</p>
                <p className="text-3xl font-bold text-gray-900">{totalLicitacoes}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Licitações Abertas</p>
                <p className="text-3xl font-bold text-green-600">{licitacoesAbertas}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Médio</p>
                <p className="text-3xl font-bold text-orange-600">
                  {mediaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Licitações por SRE */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Licitações por SRE (Top 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={licitacoesPorSRE}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Licitações por Modalidade */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Licitações por Modalidade</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={licitacoesPorModalidade}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPercentageLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {licitacoesPorModalidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Valor por SRE */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Valor Total por SRE (R$) - Top 10</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valorPorSRE}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Licitações por Categoria */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Licitações por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={licitacoesPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPercentageLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {licitacoesPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Licitações */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Licitações Recentes ({filteredLicitacoes.length})
            </h2>
            <button
              onClick={() => {
                const csv = [
                  ['Número', 'SRE', 'Modalidade', 'Objeto', 'Valor', 'Data Publicação', 'Situação'],
                  ...filteredLicitacoes.map(l => [
                    l.numero_edital,
                    l.sre_source,
                    l.modalidade,
                    l.objeto.substring(0, 100),
                    l.valor_estimado || 0,
                    l.data_publicacao || '',
                    l.situacao
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'licitacoes.csv';
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SRE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modalidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Estimado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Publicação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLicitacoes.slice(0, 50).map((licitacao) => (
                  <tr 
                    key={licitacao.id} 
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/dashboard/${licitacao.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {licitacao.numero_edital}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(licitacao.sre_source || 'SRE Desconhecida').replace('.educacao.mg.gov.br', '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licitacao.modalidade}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {licitacao.objeto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {licitacao.valor_estimado !== undefined && licitacao.valor_estimado !== null
                        ? licitacao.valor_estimado.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : 'N/D'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {licitacao.data_publicacao
                        ? new Date(licitacao.data_publicacao).toLocaleDateString('pt-BR')
                        : 'N/D'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          licitacao.situacao === 'Aberta' || licitacao.situacao === 'Em andamento'
                            ? 'bg-green-100 text-green-800'
                            : licitacao.situacao === 'Encerrada'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {licitacao.situacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLicitacoes.length > 50 && (
            <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-600">
              Mostrando 50 de {filteredLicitacoes.length} licitações. Use os filtros para refinar sua busca.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
