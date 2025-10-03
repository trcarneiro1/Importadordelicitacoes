'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, MapPin, FileText, Tag, ExternalLink,
  AlertCircle, Clock, Star, TrendingUp, Download, Link2,
  Brain, Sparkles, Target, CheckCircle, AlertTriangle
} from 'lucide-react';

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
  entidades_extraidas?: {
    datas_importantes?: string[];
    valores_financeiros?: string[];
    pessoas?: string[];
    instituicoes?: string[];
    locais?: string[];
    processos?: string[];
  };
  sentimento?: 'positivo' | 'neutro' | 'negativo';
  prioridade?: 'alta' | 'media' | 'baixa';
  relevancia_score?: number;
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
  documentos?: Array<{ tipo: string; url: string; texto?: string }>;
  links_externos?: string[];
  data_publicacao?: string;
  data_coleta?: string;
  raw_html?: string;
}

export default function NoticiaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNoticia();
  }, [params.id]);

  const loadNoticia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/noticias/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setNoticia(data.noticia);
      }
    } catch (error) {
      console.error('Erro ao carregar notícia:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadeBadge = (prioridade?: string) => {
    switch (prioridade) {
      case 'alta':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-100 text-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5" /> ALTA PRIORIDADE
          </span>
        );
      case 'media':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-yellow-100 text-yellow-800 rounded-lg">
            <TrendingUp className="w-5 h-5" /> MÉDIA PRIORIDADE
          </span>
        );
      case 'baixa':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-100 text-gray-800 rounded-lg">
            <Clock className="w-5 h-5" /> BAIXA PRIORIDADE
          </span>
        );
      default:
        return null;
    }
  };

  const getSentimentoInfo = (sentimento?: string) => {
    switch (sentimento) {
      case 'positivo':
        return { emoji: '😊', text: 'Positivo', color: 'text-green-600 bg-green-50' };
      case 'negativo':
        return { emoji: '😟', text: 'Negativo', color: 'text-red-600 bg-red-50' };
      default:
        return { emoji: '😐', text: 'Neutro', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Licitações e Compras': 'bg-blue-100 text-blue-800 border-blue-200',
      'Processos Seletivos': 'bg-purple-100 text-purple-800 border-purple-200',
      'Editais de RH': 'bg-green-100 text-green-800 border-green-200',
      'Avisos Administrativos': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Programas Educacionais': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Eventos': 'bg-pink-100 text-pink-800 border-pink-200',
      'Resultados': 'bg-teal-100 text-teal-800 border-teal-200',
      'Outros': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSREName = (sre: string) => {
    return sre.replace('.educacao.mg.gov.br', '').replace('sre', '').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 text-lg font-semibold mb-2">Notícia não encontrada</p>
          <button
            onClick={() => router.push('/noticias')}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para a lista
          </button>
        </div>
      </div>
    );
  }

  const sentimentoInfo = getSentimentoInfo(noticia.sentimento);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/noticias')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar para notícias</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Badges de Status */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {getPrioridadeBadge(noticia.prioridade)}
          <span className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getCategoriaColor(noticia.categoria_ia)}`}>
            {noticia.categoria_ia}
          </span>
          {noticia.subcategoria_ia && (
            <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
              {noticia.subcategoria_ia}
            </span>
          )}
          <span className={`px-3 py-1 text-sm font-medium rounded-lg ${sentimentoInfo.color}`}>
            {sentimentoInfo.emoji} {sentimentoInfo.text}
          </span>
          {noticia.relevancia_score !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-200">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-yellow-800">
                Score: {noticia.relevancia_score}/100
              </span>
            </div>
          )}
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {noticia.titulo}
        </h1>

        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium">SRE {getSREName(noticia.sre_source)}</span>
          </div>
          {noticia.data_publicacao && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{formatDate(noticia.data_publicacao)}</span>
            </div>
          )}
          <a
            href={noticia.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            Ver original
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resumo IA */}
            {noticia.resumo_ia && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Resumo Inteligente (IA)</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{noticia.resumo_ia}</p>
              </div>
            )}

            {/* Conteúdo Completo */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Conteúdo Completo
              </h2>
              <div 
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: noticia.conteudo || 'Conteúdo não disponível' }}
              />
            </div>

            {/* Ações Recomendadas */}
            {noticia.acoes_recomendadas && noticia.acoes_recomendadas.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-bold text-gray-900">Ações Recomendadas pela IA</h2>
                </div>
                <ul className="space-y-3">
                  {noticia.acoes_recomendadas.map((acao, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{acao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos Anexos */}
            {noticia.documentos && noticia.documentos.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  Documentos Anexos ({noticia.documentos.length})
                </h2>
                <div className="space-y-3">
                  {noticia.documentos.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.texto || doc.tipo || 'Documento'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{doc.url}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Insights IA */}
          <div className="space-y-6">
            {/* Palavras-Chave IA */}
            {noticia.palavras_chave_ia && noticia.palavras_chave_ia.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Palavras-Chave (IA)</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noticia.palavras_chave_ia.map((palavra, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200"
                    >
                      {palavra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {noticia.tags_ia && noticia.tags_ia.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noticia.tags_ia.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Entidades Extraídas */}
            {noticia.entidades_extraidas && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Entidades Extraídas (IA)</h3>
                </div>
                <div className="space-y-4">
                  {noticia.entidades_extraidas.datas_importantes && 
                   noticia.entidades_extraidas.datas_importantes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">📅 Datas Importantes</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.datas_importantes.map((data, idx) => (
                          <p key={idx} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {data}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {noticia.entidades_extraidas.valores_financeiros && 
                   noticia.entidades_extraidas.valores_financeiros.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">💰 Valores</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.valores_financeiros.map((valor, idx) => (
                          <p key={idx} className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded font-medium">
                            {valor}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {noticia.entidades_extraidas.processos && 
                   noticia.entidades_extraidas.processos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">📋 Processos</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.processos.map((proc, idx) => (
                          <p key={idx} className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">
                            {proc}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {noticia.entidades_extraidas.pessoas && 
                   noticia.entidades_extraidas.pessoas.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">👤 Pessoas</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.pessoas.map((pessoa, idx) => (
                          <p key={idx} className="text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded">
                            {pessoa}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {noticia.entidades_extraidas.instituicoes && 
                   noticia.entidades_extraidas.instituicoes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">🏢 Instituições</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.instituicoes.map((inst, idx) => (
                          <p key={idx} className="text-sm text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                            {inst}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {noticia.entidades_extraidas.locais && 
                   noticia.entidades_extraidas.locais.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">📍 Locais</p>
                      <div className="space-y-1">
                        {noticia.entidades_extraidas.locais.map((local, idx) => (
                          <p key={idx} className="text-sm text-teal-700 bg-teal-50 px-2 py-1 rounded">
                            {local}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links Externos */}
            {noticia.links_externos && noticia.links_externos.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Links Relacionados</h3>
                </div>
                <div className="space-y-2">
                  {noticia.links_externos.slice(0, 5).map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Info de Coleta */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
              <p className="mb-1">
                <strong>Categoria Original:</strong> {noticia.categoria_original || 'N/A'}
              </p>
              <p className="mb-1">
                <strong>Coletado em:</strong> {formatDate(noticia.data_coleta)}
              </p>
              <p>
                <strong>ID:</strong> <span className="font-mono">{noticia.id}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
