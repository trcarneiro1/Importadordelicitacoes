'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, RefreshCw, TrendingUp, AlertCircle, 
  Calendar, Tag, MapPin, FileText, BarChart3, PieChart,
  ArrowUp, ArrowDown, Clock, Star, ExternalLink
} from 'lucide-react';
import NoticiasPersonalizadas from '../components/NoticiasPersonalizadas';

type NoticiaEntidades = {
  datas_importantes?: string[];
  valores_financeiros?: string[];
  pessoas?: string[];
  instituicoes?: string[];
  locais?: string[];
  processos?: string[];
  [key: string]: string[] | undefined;
};

type NoticiaDocumento = Record<string, unknown>;

interface Noticia {
  id: string;
  sre_source: string;
  url: string;
  titulo: string;
  conteudo: string;
  resumo?: string;
  categoria_original?: string;
  categoria_ia: string;
  subcategoria_ia?: string;
  tags_ia?: string[];
  entidades_extraidas?: NoticiaEntidades;
  sentimento?: 'positivo' | 'neutro' | 'negativo';
  prioridade?: 'alta' | 'media' | 'baixa';
  relevancia_score?: number;
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
  documentos?: NoticiaDocumento[];
  data_publicacao?: string;
  data_coleta?: string;
}

interface Stats {
  total: number;
  alta_prioridade: number;
  media_prioridade: number;
  baixa_prioridade: number;
  por_categoria: Record<string, number>;
  por_sre: Record<string, number>;
}

interface NoticiasResponse {
  success: boolean;
  noticias: Noticia[];
  stats: Stats;
}

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiasFiltered, setNoticiasFiltered] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');
  const [sreFilter, setSreFilter] = useState('todas');
  const [showFilters, setShowFilters] = useState(false);

  const loadNoticias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/noticias');
      const data: NoticiasResponse = await response.json();
      
      if (data.success) {
        setNoticias(data.noticias);
        setStats(data.stats);
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...noticias];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.titulo.toLowerCase().includes(term) ||
        n.conteudo?.toLowerCase().includes(term) ||
        n.tags_ia?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filtro de categoria
    if (categoriaFilter !== 'todas') {
      filtered = filtered.filter(n => n.categoria_ia === categoriaFilter);
    }

    // Filtro de prioridade
    if (prioridadeFilter !== 'todas') {
      filtered = filtered.filter(n => n.prioridade === prioridadeFilter);
    }

    // Filtro de SRE
    if (sreFilter !== 'todas') {
      filtered = filtered.filter(n => n.sre_source.includes(sreFilter));
    }

    setNoticiasFiltered(filtered);
  }, [noticias, searchTerm, categoriaFilter, prioridadeFilter, sreFilter]);

  useEffect(() => {
    loadNoticias();
  }, [loadNoticias]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getPrioridadeBadge = (prioridade?: string) => {
    switch (prioridade) {
      case 'alta':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full flex items-center gap-1">
          <ArrowUp className="w-3 h-3" /> ALTA
        </span>;
      case 'media':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
          <ArrowUp className="w-3 h-3 rotate-45" /> MÉDIA
        </span>;
      case 'baixa':
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
          <ArrowDown className="w-3 h-3" /> BAIXA
        </span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">-</span>;
    }
  };

  const getSentimentoIcon = (sentimento?: string) => {
    switch (sentimento) {
      case 'positivo':
        return <span className="text-green-500" title="Positivo">😊</span>;
      case 'negativo':
        return <span className="text-red-500" title="Negativo">😟</span>;
      default:
        return <span className="text-gray-400" title="Neutro">😐</span>;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Licitações e Compras': 'bg-blue-100 text-blue-800',
      'Processos Seletivos': 'bg-purple-100 text-purple-800',
      'Editais de RH': 'bg-green-100 text-green-800',
      'Avisos Administrativos': 'bg-yellow-100 text-yellow-800',
      'Programas Educacionais': 'bg-indigo-100 text-indigo-800',
      'Eventos': 'bg-pink-100 text-pink-800',
      'Resultados': 'bg-teal-100 text-teal-800',
      'Outros': 'bg-gray-100 text-gray-800',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getSREName = (sre: string) => {
    return sre.replace('.educacao.mg.gov.br', '').replace('sre', '').toUpperCase();
  };

  const categorias = Array.from(new Set(noticias.map(n => n.categoria_ia)));
  const sres = Array.from(new Set(noticias.map(n => n.sre_source)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando notícias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Central de Notícias das SREs
              </h1>
              <p className="text-blue-100 mt-1">
                Sistema inteligente de categorização com IA
              </p>
            </div>
            <button
              onClick={loadNoticias}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de Busca */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(categoriaFilter !== 'todas' || prioridadeFilter !== 'todas' || sreFilter !== 'todas') && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {[categoriaFilter, prioridadeFilter, sreFilter].filter(f => f !== 'todas').length}
                </span>
              )}
            </button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={prioridadeFilter}
                  onChange={(e) => setPrioridadeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas as prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SRE
                </label>
                <select
                  value={sreFilter}
                  onChange={(e) => setSreFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas as SREs</option>
                  {sres.map(sre => (
                    <option key={sre} value={sre}>{getSREName(sre)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Cards de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total de Notícias</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Alta Prioridade</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.alta_prioridade}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Média Prioridade</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.media_prioridade}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Baixa Prioridade</p>
                  <p className="text-3xl font-bold text-gray-600 mt-1">{stats.baixa_prioridade}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Categorias */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Notícias por Categoria</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.por_categoria).map(([categoria, count]) => {
                  const percentage = ((count / stats.total) * 100).toFixed(1);
                  return (
                    <div key={categoria}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{categoria}</span>
                        <span className="font-semibold text-gray-900">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico de SREs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Notícias por SRE (Top 10)</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.por_sre)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([sre, count]) => {
                    const percentage = ((count / stats.total) * 100).toFixed(1);
                    return (
                      <div key={sre}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{getSREName(sre)}</span>
                          <span className="font-semibold text-gray-900">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Seção de Notícias Personalizadas */}
        <NoticiasPersonalizadas />

        {/* Resultados */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {noticiasFiltered.length} notícias encontradas
            </h2>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onChange={(e) => {
                const sorted = [...noticiasFiltered].sort((a, b) => {
                  switch (e.target.value) {
                    case 'relevancia':
                      return (b.relevancia_score || 0) - (a.relevancia_score || 0);
                    case 'data':
                      return new Date(b.data_publicacao || 0).getTime() - new Date(a.data_publicacao || 0).getTime();
                    case 'prioridade':
                      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
                      return (prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] || 0) - 
                             (prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] || 0);
                    default:
                      return 0;
                  }
                });
                setNoticiasFiltered(sorted);
              }}
            >
              <option value="relevancia">Ordenar por: Relevância</option>
              <option value="data">Ordenar por: Data</option>
              <option value="prioridade">Ordenar por: Prioridade</option>
            </select>
          </div>

          {noticiasFiltered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma notícia encontrada</p>
              <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros ou fazer uma nova busca</p>
            </div>
          ) : (
            <div className="space-y-4">
              {noticiasFiltered.map((noticia) => (
                <div
                  key={noticia.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/noticias/${noticia.id}`}
                >
                  {/* Header da Notícia */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPrioridadeBadge(noticia.prioridade)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoriaColor(noticia.categoria_ia)}`}>
                          {noticia.categoria_ia}
                        </span>
                        {noticia.subcategoria_ia && (
                          <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                            {noticia.subcategoria_ia}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                        {noticia.titulo}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getSentimentoIcon(noticia.sentimento)}
                      {noticia.relevancia_score !== undefined && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-semibold">{noticia.relevancia_score}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo IA */}
                  {noticia.resumo_ia && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {noticia.resumo_ia}
                    </p>
                  )}

                  {/* Metadados */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{getSREName(noticia.sre_source)}</span>
                    </div>
                    {noticia.data_publicacao && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(noticia.data_publicacao)}</span>
                      </div>
                    )}
                    {noticia.documentos && noticia.documentos.length > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <FileText className="w-4 h-4" />
                        <span>{noticia.documentos.length} documento(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {noticia.tags_ia && noticia.tags_ia.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {noticia.tags_ia.slice(0, 5).map((tag, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {noticia.tags_ia.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{noticia.tags_ia.length - 5} tags
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ações Recomendadas */}
                  {noticia.acoes_recomendadas && noticia.acoes_recomendadas.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-800 mb-2">
                        💡 Ações Recomendadas:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {noticia.acoes_recomendadas.slice(0, 2).map((acao, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>{acao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Link Externo */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <a
                      href={noticia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver notícia original
                    </a>
                    <span className="text-xs text-gray-400">
                      Coletado em {formatDate(noticia.data_coleta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
