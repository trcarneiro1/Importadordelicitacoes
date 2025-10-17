'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';

interface RawLicitacao {
  id: string;
  numero_edital: string | null;
  objeto: string | null;
  modalidade: string | null;
  data_abertura: string | null;
  data_publicacao: string | null;
  valor_estimado: string | number | null;
  sre_source: string | null;
  createdAt: string;
}

interface DashboardStats {
  total: number;
  withIA: number;
  withoutIA: number;
  percentProcessed: number;
  invalid: number;
  invalidPercent: number;
}

export default function RawDataDashboard() {
  const [licitacoes, setLicitacoes] = useState<RawLicitacao[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [selectedSRE, setSelectedSRE] = useState<string>('all');
  const [sres, setSres] = useState<string[]>([]);

  // Buscar dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/raw-data?limit=100');
      if (!response.ok) throw new Error('Erro ao buscar dados');

      const data = await response.json();
      setLicitacoes(data.licitacoes || []);
      setStats(data.stats || {});

      // Extrair SREs únicos
      const uniqueSres = [...new Set(data.licitacoes?.map((l: any) => l.sre_source).filter(Boolean))];
      setSres(uniqueSres as string[]);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Atualizar a cada 1 min
    return () => clearInterval(interval);
  }, []);

  // Verificar se é válida
  const isValid = (lic: RawLicitacao): boolean => {
    return (
      lic.numero_edital &&
      lic.numero_edital !== 'S/N' &&
      lic.numero_edital !== 's/n' &&
      lic.numero_edital !== 'Não informado' &&
      lic.objeto &&
      lic.objeto !== 'S/N' &&
      lic.objeto !== 's/n' &&
      lic.objeto !== 'Não informado' &&
      lic.objeto.length > 10
    );
  };

  // Filtrar dados
  const filtered = licitacoes.filter((lic) => {
    if (selectedSRE !== 'all' && lic.sre_source !== selectedSRE) return false;
    if (filter === 'valid') return isValid(lic);
    if (filter === 'invalid') return !isValid(lic);
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">📊 Dados Brutos de Scraping</h1>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
          <p className="text-slate-400">Visualize dados coletados antes do processamento IA</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Total Coletadas</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-500 mt-2">Todas as licitações</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <div className="text-slate-400 text-sm">Processadas com IA</div>
              </div>
              <div className="text-3xl font-bold text-green-400">{stats.withIA}</div>
              <div className="text-xs text-slate-500 mt-2">{stats.percentProcessed}% concluído</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <div className="text-slate-400 text-sm">Aguardando IA</div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{stats.withoutIA}</div>
              <div className="text-xs text-slate-500 mt-2">Pendentes</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <div className="text-slate-400 text-sm">Inválidas</div>
              </div>
              <div className="text-3xl font-bold text-red-400">{stats.invalid}</div>
              <div className="text-xs text-slate-500 mt-2">{stats.invalidPercent}% para limpar</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter por tipo */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Dados</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="valid">✅ Válidos (para processar)</option>
                <option value="invalid">❌ Inválidos (para limpar)</option>
              </select>
            </div>

            {/* Filter por SRE */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">SRE</label>
              <select
                value={selectedSRE}
                onChange={(e) => setSelectedSRE(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="all">Todos as SREs</option>
                {sres.map((sre) => (
                  <option key={sre} value={sre}>
                    {sre}
                  </option>
                ))}
              </select>
            </div>

            {/* Info */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Resultado</label>
              <div className="bg-slate-700 px-3 py-2 rounded text-white">
                {filtered.length} registros
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">Edital</th>
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">Objeto</th>
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">Modalidade</th>
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">SRE</th>
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">Data Pub.</th>
                  <th className="px-6 py-3 text-left text-slate-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Carregando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((lic) => (
                    <tr
                      key={lic.id}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                        isValid(lic) ? 'bg-slate-800' : 'bg-red-900/20'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-300">
                          {lic.numero_edital || '❌ Vazio'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 max-w-xs truncate">
                          {lic.objeto ? lic.objeto.substring(0, 40) : '❌ Vazio'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {lic.modalidade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {lic.sre_source || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {lic.data_publicacao
                          ? new Date(lic.data_publicacao).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {isValid(lic) ? (
                          <span className="inline-block px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs">
                            ✅ Válida
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs">
                            ❌ Inválida
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📝 Informações</h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>✅ <strong>Válida:</strong> Tem numero_edital, objeto com +10 caracteres, data válida</li>
            <li>❌ <strong>Inválida:</strong> Tem "S/N", "Não informado", ou campos vazios</li>
            <li>🔄 <strong>Próximo passo:</strong> Executar script de limpeza para remover inválidas</li>
            <li>🚀 <strong>Depois:</strong> Processar válidas com IA para categorização</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
