'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Globe, Tag, AlertCircle, Download, ExternalLink } from 'lucide-react';

type LicitacaoDocumento = {
  nome: string;
  url: string;
  tipo: string;
};

type LicitacaoContato = {
  responsavel?: string;
  email?: string;
  telefone?: string;
};

type RawLicitacaoData = Record<string, unknown>;

interface Licitacao {
  id: string;
  sre_source: string;
  numero_edital: string;
  modalidade: string;
  objeto: string;
  valor_estimado?: number;
  data_publicacao?: string;
  data_abertura?: string;
  situacao: string;
  categoria?: string;
  processo?: string;
  documentos?: LicitacaoDocumento[];
  contato?: LicitacaoContato;
  raw_data?: RawLicitacaoData;
  created_at: string;
  updated_at?: string;
}

type LicitacaoResponse = {
  success: boolean;
  licitacao?: Licitacao;
  error?: string;
};

export default function LicitacaoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [licitacao, setLicitacao] = useState<Licitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchLicitacao = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/licitacoes/${id}`);
        const data: LicitacaoResponse = await response.json();

        if (!isMounted) return;

        if (data.success && data.licitacao) {
          setLicitacao(data.licitacao);
          setError(null);
        } else {
          setError(data.error ?? 'Erro ao carregar licitação');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Erro ao conectar com a API';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLicitacao();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (error || !licitacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar Licitação</h2>
            <p className="text-red-600 mb-4">{error || 'Licitação não encontrada'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                licitacao.situacao === 'Aberta' || licitacao.situacao === 'Em andamento'
                  ? 'bg-green-100 text-green-800'
                  : licitacao.situacao === 'Encerrada'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {licitacao.situacao}
            </span>
          </div>
        </div>

        {/* Título Principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {licitacao.numero_edital}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {licitacao.sre_source.replace('.educacao.mg.gov.br', '')}
                </span>
                {licitacao.categoria && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {licitacao.categoria}
                  </span>
                )}
              </div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {licitacao.modalidade}
              </span>
            </div>
            
            {licitacao.valor_estimado && (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Valor Estimado</div>
                <div className="text-3xl font-bold text-green-600">
                  {licitacao.valor_estimado.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Datas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">Datas Importantes</h2>
            </div>
            <div className="space-y-3">
              {licitacao.data_publicacao && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Publicação</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(licitacao.data_publicacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )}
              {licitacao.data_abertura && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Abertura</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(licitacao.data_abertura).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase">Coletado em</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(licitacao.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Complementares */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-800">Informações</h2>
            </div>
            <div className="space-y-3">
              {licitacao.processo && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Processo</div>
                  <div className="text-sm font-medium text-gray-900">{licitacao.processo}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase">Modalidade</div>
                <div className="text-sm font-medium text-gray-900">{licitacao.modalidade}</div>
              </div>
              {licitacao.categoria && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Categoria</div>
                  <div className="text-sm font-medium text-gray-900">{licitacao.categoria}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase">Situação</div>
                <div className="text-sm font-medium text-gray-900">{licitacao.situacao}</div>
              </div>
            </div>
          </div>

          {/* Contato */}
          {licitacao.contato && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">Contato</h2>
              </div>
              <div className="space-y-3">
                {licitacao.contato.responsavel && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Responsável</div>
                    <div className="text-sm font-medium text-gray-900">{licitacao.contato.responsavel}</div>
                  </div>
                )}
                {licitacao.contato.email && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Email</div>
                    <a
                      href={`mailto:${licitacao.contato.email}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {licitacao.contato.email}
                    </a>
                  </div>
                )}
                {licitacao.contato.telefone && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Telefone</div>
                    <a
                      href={`tel:${licitacao.contato.telefone}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {licitacao.contato.telefone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Objeto da Licitação */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Objeto da Licitação</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{licitacao.objeto}</p>
        </div>

        {/* Documentos */}
        {licitacao.documentos && licitacao.documentos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Documentos ({licitacao.documentos.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {licitacao.documentos.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{doc.nome}</div>
                    <div className="text-xs text-gray-500">{doc.tipo}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dados Brutos (Debug) */}
        {licitacao.raw_data && (
          <details className="bg-white rounded-xl shadow-lg p-8">
            <summary className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600">
              Dados Brutos (JSON)
            </summary>
            <pre className="mt-4 p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(licitacao.raw_data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
