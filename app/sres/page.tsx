'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle, ExternalLink, Search, Filter, Play, Loader } from 'lucide-react';

interface SRE {
  id: number;
  codigo: number;
  nome: string;
  municipio: string | null;
  url_base: string;
  url_licitacoes: string;
  urls_adicionais: string[];
  tipo_cms: string | null;
  ativo: boolean;
  ultima_coleta: string | null;
  proxima_coleta: string | null;
  taxa_sucesso: number | null;
  total_coletas: number | null;
  created_at: string;
}

interface SREFormData {
  codigo: number;
  nome: string;
  municipio: string;
  url_base: string;
  url_licitacoes: string;
  urls_adicionais: string;
  tipo_cms: string;
  ativo: boolean;
}

export default function GerenciarSREsPage() {
  const [sres, setSres] = useState<SRE[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [scrapingInProgress, setScrapingInProgress] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<SREFormData>({
    codigo: 0,
    nome: '',
    municipio: '',
    url_base: '',
    url_licitacoes: '',
    urls_adicionais: '',
    tipo_cms: 'WordPress',
    ativo: true
  });

  useEffect(() => {
    fetchSREs();
  }, []);

  const fetchSREs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sres');
      if (response.ok) {
        const data = await response.json();
        setSres(data);
      }
    } catch (error) {
      console.error('Erro ao carregar SREs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sre?: SRE) => {
    if (sre) {
      setEditingId(sre.id);
      setFormData({
        codigo: sre.codigo,
        nome: sre.nome,
        municipio: sre.municipio || '',
        url_base: sre.url_base,
        url_licitacoes: sre.url_licitacoes,
        urls_adicionais: sre.urls_adicionais.join('\n'),
        tipo_cms: sre.tipo_cms || 'WordPress',
        ativo: sre.ativo
      });
    } else {
      setEditingId(null);
      setFormData({
        codigo: Math.max(...sres.map(s => s.codigo), 0) + 1,
        nome: '',
        municipio: '',
        url_base: '',
        url_licitacoes: '',
        urls_adicionais: '',
        tipo_cms: 'WordPress',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      urls_adicionais: formData.urls_adicionais.split('\n').filter(u => u.trim())
    };

    try {
      const url = editingId ? `/api/sres/${editingId}` : '/api/sres';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchSREs();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Erro ao salvar SRE:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta SRE?')) return;

    try {
      const response = await fetch(`/api/sres/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSREs();
      }
    } catch (error) {
      console.error('Erro ao excluir SRE:', error);
    }
  };

  const handleScrapeSRE = async (sre: SRE) => {
    if (!confirm(`Deseja iniciar o scraping manual da SRE ${sre.nome}?`)) return;

    setScrapingInProgress(prev => new Set(prev).add(sre.id));

    try {
      const response = await fetch('/api/scrape-specific', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sreUrl: sre.url_licitacoes,
          sreNome: sre.nome,
          sreId: sre.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Scraping concluído!\n\nEncontradas: ${result.total || 0} licitações\nNovas: ${result.novas || 0}\nDuplicadas: ${result.duplicadas || 0}`);
        await fetchSREs(); // Atualizar estatísticas
      } else {
        alert(`❌ Erro no scraping: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao fazer scraping:', error);
      alert('❌ Erro ao executar scraping. Verifique o console.');
    } finally {
      setScrapingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(sre.id);
        return newSet;
      });
    }
  };

  const filteredSREs = sres.filter(sre => {
    const matchesSearch = 
      sre.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sre.municipio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sre.codigo.toString().includes(searchTerm);
    
    const matchesFilter = 
      filterAtivo === 'todos' ? true :
      filterAtivo === 'ativo' ? sre.ativo :
      !sre.ativo;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: sres.length,
    ativas: sres.filter(s => s.ativo).length,
    inativas: sres.filter(s => !s.ativo).length,
    taxaMediaSucesso: sres.length > 0
      ? (sres.reduce((acc, s) => acc + (s.taxa_sucesso || 0), 0) / sres.filter(s => s.taxa_sucesso !== null).length).toFixed(1)
      : '0'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🏛️</span>
                Gerenciar SREs
              </h1>
              <p className="text-gray-600 mt-2">
                Cadastro e gerenciamento de Superintendências Regionais de Ensino
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Nova SRE
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Total de SREs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
              <div className="text-sm text-green-700">SREs Ativas</div>
              <div className="text-2xl font-bold text-green-900">{stats.ativas}</div>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <div className="text-sm text-red-700">SREs Inativas</div>
              <div className="text-2xl font-bold text-red-900">{stats.inativas}</div>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="text-sm text-blue-700">Taxa Média Sucesso</div>
              <div className="text-2xl font-bold text-blue-900">{stats.taxaMediaSucesso}%</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, município ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterAtivo}
                onChange={(e) => setFilterAtivo(e.target.value as any)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas as SREs</option>
                <option value="ativo">Apenas Ativas</option>
                <option value="inativo">Apenas Inativas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando SREs...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Município</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Taxa Sucesso</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Coletas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Última Coleta</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSREs.map((sre) => (
                    <tr key={sre.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900">{sre.codigo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{sre.nome}</div>
                        <a
                          href={sre.url_licitacoes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver portal
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{sre.municipio || '-'}</td>
                      <td className="px-4 py-3">
                        {sre.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sre.taxa_sucesso !== null ? (
                          <span className={`font-semibold ${
                            sre.taxa_sucesso >= 80 ? 'text-green-600' :
                            sre.taxa_sucesso >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {sre.taxa_sucesso.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{sre.total_coletas || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sre.ultima_coleta 
                          ? new Date(sre.ultima_coleta).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleScrapeSRE(sre)}
                            disabled={scrapingInProgress.has(sre.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Fazer scraping manual"
                          >
                            {scrapingInProgress.has(sre.id) ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenModal(sre)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sre.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSREs.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg mb-2">Nenhuma SRE encontrada</p>
                <p className="text-sm">Tente ajustar os filtros ou cadastrar uma nova SRE</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar SRE' : 'Nova SRE'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Município
                  </label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Belo Horizonte"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da SRE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: SRE Metropolitana A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Base *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url_base}
                  onChange={(e) => setFormData({ ...formData, url_base: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://sremetropolitanaa.educacao.mg.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Licitações *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url_licitacoes}
                  onChange={(e) => setFormData({ ...formData, url_licitacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://sremetropolitanaa.educacao.mg.gov.br/licitacoes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URLs Adicionais (uma por linha)
                </label>
                <textarea
                  value={formData.urls_adicionais}
                  onChange={(e) => setFormData({ ...formData, urls_adicionais: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="https://exemplo.com/editais&#10;https://exemplo.com/pregoes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de CMS
                  </label>
                  <select
                    value={formData.tipo_cms}
                    onChange={(e) => setFormData({ ...formData, tipo_cms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WordPress">WordPress</option>
                    <option value="Joomla">Joomla</option>
                    <option value="Drupal">Drupal</option>
                    <option value="Custom">Custom</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">SRE Ativa</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Salvar Alterações' : 'Cadastrar SRE'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
