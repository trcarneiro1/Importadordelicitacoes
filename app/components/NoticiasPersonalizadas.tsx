'use client';

import { useState, useEffect } from 'react';
import { Star, Sparkles, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';

interface NoticiaRecomendada {
  id: string;
  sre_source: string;
  titulo: string;
  conteudo: string;
  categoria_ia: string;
  tags: string[];
  relevancia: number;
  data_publicacao: string;
  url_original?: string;
}

interface PerfilUsuario {
  categorias_favoritas: string[];
  sres_favoritas: string[];
  total_acessos: number;
}

export default function NoticiasPersonalizadas() {
  const [noticiasPersonalizadas, setNoticiasPersonalizadas] = useState<NoticiaRecomendada[]>([]);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    loadRecomendacoes();
  }, []);

  async function loadRecomendacoes() {
    try {
      setLoading(true);
      const response = await fetch('/api/recomendacoes?tipo=noticias&limit=6');
      const data = await response.json();
      
      setNoticiasPersonalizadas(data.noticias || []);
      setPerfil(data.perfil || null);
      setPersonalized(data.personalized || false);
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800">Para Você</h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!noticiasPersonalizadas || noticiasPersonalizadas.length === 0) {
    return null; // Não mostrar seção se não há notícias
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md mb-8">
      {/* Header da Seção */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {personalized ? 'Recomendado Para Você' : 'Notícias em Destaque'}
          </h2>
        </div>
        
        {personalized && perfil && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
            <Heart className="w-4 h-4 text-pink-500" />
            <span>Baseado em {perfil.total_acessos} acessos</span>
          </div>
        )}
      </div>

      {/* Badges de Personalização */}
      {personalized && perfil && (
        <div className="mb-4 space-y-2">
          {perfil.categorias_favoritas && perfil.categorias_favoritas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-600">Categorias favoritas:</span>
              {perfil.categorias_favoritas.slice(0, 3).map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          
          {perfil.sres_favoritas && perfil.sres_favoritas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-600">Regionais favoritas:</span>
              {perfil.sres_favoritas.slice(0, 3).map((sre, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  {sre}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid de Notícias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {noticiasPersonalizadas.slice(0, 6).map((noticia, index) => (
          <div
            key={noticia.id}
            className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-all duration-200 border border-gray-100 relative"
          >
            {/* Badge de Destaque */}
            {index === 0 && personalized && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3" fill="white" />
                TOP MATCH
              </div>
            )}

            {/* Relevância */}
            {noticia.relevancia && noticia.relevancia > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">
                  Relevância: {noticia.relevancia}%
                </span>
              </div>
            )}

            {/* Categoria */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {noticia.categoria_ia || 'Sem categoria'}
              </span>
              <span className="text-xs text-gray-500">
                {noticia.sre_source}
              </span>
            </div>

            {/* Título */}
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              {noticia.titulo}
            </h3>

            {/* Conteúdo */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {noticia.conteudo}
            </p>

            {/* Tags */}
            {noticia.tags && noticia.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {noticia.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')}
              </span>
              
              <Link
                href={`/noticias/${noticia.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Ler mais
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé da Seção */}
      {personalized && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                Como funciona a personalização?
              </h4>
              <p className="text-sm text-gray-600">
                Analisamos suas {perfil?.total_acessos || 0} interações anteriores para selecionar 
                notícias relacionadas às categorias e regionais que você mais acessa. 
                Quanto mais você usar o sistema, melhores serão as recomendações!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
