'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SRE_URLS, getSREName } from '@/lib/scrapers/sre-urls';

interface ScrapeResult {
  success: boolean;
  sre_source: string;
  licitacoes: any[];
  error?: string;
}

export default function ScrapePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [count, setCount] = useState(1);

  const handleScrape = async () => {
    try {
      setLoading(true);
      setResults(null);

      const response = await fetch(`/api/scrape?count=${count}`);
      const data = await response.json();

      setResults(data);
    } catch (error: any) {
      setResults({
        success: false,
        error: error.message || 'Erro ao executar coleta',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Coletar Dados
              </h1>
              <p className="text-gray-600 mt-1">
                Execute a coleta de licitações das SREs
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              ← Voltar
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Configurar Coleta
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de SREs para coletar (Prova de Conceito)
            </label>
            <input
              type="number"
              min="1"
              max="47"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-2">
              Total de SREs disponíveis: {SRE_URLS.length}
            </p>
          </div>

          <button
            onClick={handleScrape}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Coletando dados...
              </span>
            ) : (
              '🔍 Iniciar Coleta'
            )}
          </button>

          {loading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                ⏳ Coletando dados... Este processo pode levar alguns minutos.
                Aguarde sem fechar a página.
              </p>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Resultados da Coleta
            </h2>

            {results.success ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {results.total_scraped}
                    </div>
                    <div className="text-sm text-green-600">SREs Coletadas</div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {results.total_records}
                    </div>
                    <div className="text-sm text-blue-600">
                      Registros Encontrados
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          SRE
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Registros
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.results.map((result: ScrapeResult, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {result.sre_source}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {result.success ? (
                              <span className="text-green-600 font-medium">
                                ✓ Sucesso
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                ✗ Erro
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.licitacoes?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex gap-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Ver Dashboard →
                  </Link>
                  <button
                    onClick={() => setResults(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Nova Coleta
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Erro na coleta:</p>
                <p className="text-red-600 text-sm mt-1">
                  {results.error || 'Erro desconhecido'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
