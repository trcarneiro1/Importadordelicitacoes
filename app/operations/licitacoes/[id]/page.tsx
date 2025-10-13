'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Calendar, DollarSign, MapPin, Tag, Clock, Brain, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LicitacaoDetail {
  id: string;
  numero_edital: string;
  objeto: string;
  valor_estimado: number;
  sre_source: string;
  categoria_principal: string;
  categorias_secundarias: string[];
  data_publicacao: string;
  data_abertura: string;
  situacao: string;
  modalidade: string;
  processado_ia: boolean;
  score_relevancia: number;
  resumo_ia?: string;
  categorias_ia?: string[];
  tags?: string[];
  documentos?: any;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export default function LicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [licitacao, setLicitacao] = useState<LicitacaoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLicitacao(id);
    }
  }, [id]);

  const fetchLicitacao = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/licitacoes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setLicitacao(data);
      }
    } catch (error) {
      console.error('Erro ao carregar licitação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!licitacao) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Licitação não encontrada</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  const diasParaAbertura = Math.ceil(
    (new Date(licitacao.data_abertura).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para listagem
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📋</span>
              <h1 className="text-3xl font-bold text-gray-900">
                {licitacao.numero_edital}
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                licitacao.situacao === 'aberto' ? 'bg-green-100 text-green-800' :
                licitacao.situacao === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {licitacao.situacao}
              </span>
              {licitacao.processado_ia && (
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  Processado IA
                </span>
              )}
              {diasParaAbertura >= 0 && diasParaAbertura <= 7 && (
                <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                  ⚠️ Abre em {diasParaAbertura} dias
                </span>
              )}
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Valor Estimado</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {licitacao.valor_estimado 
              ? `R$ ${licitacao.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Não informado'
            }
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Data de Abertura</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {new Date(licitacao.data_abertura).toLocaleDateString('pt-BR')}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {new Date(licitacao.data_abertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">SRE</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {licitacao.sre_source}
          </div>
        </div>
      </div>

      {/* Objeto */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Objeto da Licitação</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">{licitacao.objeto}</p>
      </div>

      {/* IA Analysis */}
      {licitacao.processado_ia && licitacao.resumo_ia && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Análise por IA</h2>
            <span className="ml-auto px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              Score: {(licitacao.score_relevancia * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">{licitacao.resumo_ia}</p>
          
          {licitacao.categorias_ia && licitacao.categorias_ia.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Categorias identificadas:</div>
              <div className="flex flex-wrap gap-2">
                {licitacao.categorias_ia.map((cat, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informações Gerais</h3>
          <div className="space-y-3">
            {/* Link para Edital Original */}
            {licitacao.raw_data?.url_fonte && (
              <div className="pb-3 border-b border-gray-200">
                <a 
                  href={licitacao.raw_data.url_fonte}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Edital Original
                </a>
              </div>
            )}
            
            <div>
              <span className="text-sm text-gray-600">Modalidade:</span>
              <span className="ml-2 font-medium text-gray-900">{licitacao.modalidade || 'Não informada'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Data de Publicação:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(licitacao.data_publicacao).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Categoria Principal:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                {licitacao.categoria_principal}
              </span>
            </div>
            {licitacao.categorias_secundarias && licitacao.categorias_secundarias.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Categorias Secundárias:</span>
                <div className="flex flex-wrap gap-2">
                  {licitacao.categorias_secundarias.map((cat, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Detalhes Adicionais</h3>
          <div className="space-y-3">
            {/* Instituição */}
            {licitacao.raw_data?.instituicao && (
              <div>
                <span className="text-sm text-gray-600">Instituição:</span>
                <span className="ml-2 font-medium text-gray-900">{licitacao.raw_data.instituicao}</span>
              </div>
            )}
            
            {/* Prazo de Propostas */}
            {licitacao.raw_data?.prazo_propostas && (
              <div>
                <span className="text-sm text-gray-600">Prazo para Propostas:</span>
                <span className="ml-2 font-medium text-gray-900">{licitacao.raw_data.prazo_propostas}</span>
              </div>
            )}
            
            {/* Local de Entrega */}
            {licitacao.raw_data?.local_entrega && (
              <div>
                <span className="text-sm text-gray-600">Local de Entrega:</span>
                <span className="ml-2 font-medium text-gray-900">{licitacao.raw_data.local_entrega}</span>
              </div>
            )}
            
            {/* Email de Contato */}
            {licitacao.raw_data?.email_contato && (
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <a href={`mailto:${licitacao.raw_data.email_contato}`} className="ml-2 font-medium text-blue-600 hover:text-blue-800">
                  {licitacao.raw_data.email_contato}
                </a>
              </div>
            )}
            
            {/* Google Drive */}
            {licitacao.raw_data?.link_google_drive && (
              <div>
                <a 
                  href={licitacao.raw_data.link_google_drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar Documentos (Google Drive)
                </a>
              </div>
            )}
            
            {/* Observações */}
            {licitacao.raw_data?.observacoes && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600 block mb-1">Observações:</span>
                <p className="text-sm text-gray-900">{licitacao.raw_data.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadados do Sistema */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Metadados do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">ID:</span>
            <span className="ml-2 font-mono text-sm text-gray-900">{licitacao.id}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Criado em:</span>
            <span className="ml-2 text-sm text-gray-900">
              {new Date(licitacao.created_at).toLocaleString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Atualizado em:</span>
            <span className="ml-2 text-sm text-gray-900">
              {new Date(licitacao.updated_at).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {licitacao.tags && licitacao.tags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {licitacao.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Documentos */}
      {licitacao.documentos && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Documentos</h3>
          </div>
          {Array.isArray(licitacao.documentos) && licitacao.documentos.length > 0 ? (
            <div className="space-y-2">
              {licitacao.documentos.map((doc: any, idx: number) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="flex-1 text-gray-900">{doc.nome || `Documento ${idx + 1}`}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Nenhum documento anexado</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Processar com IA
        </button>
        <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
          Editar
        </button>
        <button className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium">
          Excluir
        </button>
      </div>
    </div>
  );
}
