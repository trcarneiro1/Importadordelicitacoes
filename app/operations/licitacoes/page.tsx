'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import Link from 'next/link';

interface Licitacao {
  id: string;s
  numero_edital: string;
  objeto: string;
  valor_estimado: number;
  sre_source: string;
  categoria_principal: string;
  data_publicacao: string;
  data_abertura: string;
  situacao: string;
  processado_ia: boolean;
  score_relevancia: number;
}

export default function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSRE, setSelectedSRE] = useState('todas');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedSituacao, setSelectedSituacao] = useState('todas');
  const [sortField, setSortField] = useState<keyof Licitacao>('data_publicacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchLicitacoes();
  }, [page, sortField, sortDirection, selectedSRE, selectedCategoria, selectedSituacao]);

  const fetchLicitacoes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: sortField,
        sortOrder: sortDirection,
        ...(selectedSRE !== 'todas' && { sre: selectedSRE }),
        ...(selectedCategoria !== 'todas' && { categoria: selectedCategoria }),
        ...(selectedSituacao !== 'todas' && { situacao: selectedSituacao }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/licitacoes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLicitacoes(data.licitacoes || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Licitacao) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === licitacoes.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(licitacoes.map(l => l.id));
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    // TODO: Implementar exportação
    alert(`Exportando ${selectedItems.length > 0 ? selectedItems.length : 'todas'} licitações em formato ${format.toUpperCase()}`);
  };

  const stats = {
    total: licitacoes.length,
    processadas: licitacoes.filter(l => l.processado_ia).length,
    urgentes: licitacoes.filter(l => {
      const abertura = new Date(l.data_abertura);
      const hoje = new Date();
      const diff = (abertura.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7 && diff >= 0;
    }).length,
    valorTotal: licitacoes.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">📋</span>
              Licitações
            </h1>
            <p className="text-gray-600 mt-1">
              Gerenciamento completo de licitações coletadas
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            Nova Licitação
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-sm text-green-700">Processadas IA</div>
            <div className="text-2xl font-bold text-green-900">{stats.processadas}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="text-sm text-yellow-700">Urgentes (7 dias)</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.urgentes}</div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="text-sm text-blue-700">Valor Total</div>
            <div className="text-2xl font-bold text-blue-900">
              R$ {(stats.valorTotal / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por edital, objeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedSRE}
            onChange={(e) => setSelectedSRE(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todas">Todas as SREs</option>
            <option value="Metropolitana A">Metropolitana A</option>
            <option value="Metropolitana B">Metropolitana B</option>
            {/* Adicionar mais SREs */}
          </select>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todas">Todas Categorias</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Mobiliário">Mobiliário</option>
            <option value="Tecnologia">Tecnologia</option>
            {/* Adicionar mais categorias */}
          </select>

          <select
            value={selectedSituacao}
            onChange={(e) => setSelectedSituacao(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todas">Todas Situações</option>
            <option value="aberto">Aberto</option>
            <option value="encerrado">Encerrado</option>
            <option value="suspenso">Suspenso</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {selectedItems.length} {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Processar com IA
            </button>
            <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              Exportar Selecionados
            </button>
            <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              Excluir Selecionados
            </button>
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, stats.total)} de {stats.total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando licitações...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === licitacoes.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('numero_edital')}
                  >
                    <div className="flex items-center gap-2">
                      Edital
                      {sortField === 'numero_edital' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Objeto</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('valor_estimado')}
                  >
                    <div className="flex items-center gap-2">
                      Valor
                      {sortField === 'valor_estimado' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SRE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Categoria</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('data_abertura')}
                  >
                    <div className="flex items-center gap-2">
                      Abertura
                      {sortField === 'data_abertura' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {licitacoes.map((licitacao) => (
                  <tr 
                    key={licitacao.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onDoubleClick={() => window.location.href = `/operations/licitacoes/${licitacao.id}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(licitacao.id)}
                        onChange={() => {
                          if (selectedItems.includes(licitacao.id)) {
                            setSelectedItems(selectedItems.filter(id => id !== licitacao.id));
                          } else {
                            setSelectedItems([...selectedItems, licitacao.id]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/operations/licitacoes/${licitacao.id}`}
                        className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {licitacao.numero_edital}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate" title={licitacao.objeto}>
                        {licitacao.objeto}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        R$ {(licitacao.valor_estimado / 1000).toFixed(1)}k
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{licitacao.sre_source}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {licitacao.categoria_principal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(licitacao.data_abertura).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        licitacao.situacao === 'aberto' ? 'bg-green-100 text-green-800' :
                        licitacao.situacao === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {licitacao.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/operations/licitacoes/${licitacao.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === pageNum 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
