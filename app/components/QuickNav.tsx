'use client';

import Link from 'next/link';
import { BarChart3, Activity, Lightbulb, FileText, Newspaper } from 'lucide-react';

interface QuickNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  color: string;
}

const mainItems: QuickNavItem[] = [
  {
    title: 'Dashboard Analítico',
    href: '/dashboard/analitico',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Métricas, gráficos e análise de dados',
    badge: 'Principal',
    color: 'blue'
  },
  {
    title: 'Monitoramento',
    href: '/monitoramento',
    icon: <Activity className="w-6 h-6" />,
    description: 'Scraping ao vivo e logs em tempo real',
    badge: 'Ao Vivo',
    color: 'green'
  },
  {
    title: 'Insights',
    href: '/insights',
    icon: <Lightbulb className="w-6 h-6" />,
    description: 'Sugestões personalizadas com IA',
    badge: 'IA',
    color: 'purple'
  }
];

const legacyItems: QuickNavItem[] = [
  {
    title: 'Gerenciar SREs',
    href: '/sres',
    icon: <FileText className="w-5 h-5" />,
    description: 'Cadastro e edição de SREs',
    color: 'gray'
  },
  {
    title: 'Licitações',
    href: '/dashboard',
    icon: <FileText className="w-5 h-5" />,
    description: 'Dashboard clássico',
    color: 'gray'
  },
  {
    title: 'Notícias',
    href: '/noticias',
    icon: <Newspaper className="w-5 h-5" />,
    description: 'Notícias das SREs',
    color: 'gray'
  }
];

export default function QuickNav() {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-500 text-white',
        title: 'text-blue-900'
      },
      green: {
        bg: 'bg-green-50 hover:bg-green-100',
        border: 'border-green-200',
        icon: 'text-green-600',
        badge: 'bg-green-500 text-white',
        title: 'text-green-900'
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        badge: 'bg-purple-500 text-white',
        title: 'text-purple-900'
      },
      gray: {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        badge: 'bg-gray-500 text-white',
        title: 'text-gray-900'
      }
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="space-y-6">
      {/* Main Navigation - 3 Telas Principais */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Sistema v3.0 - 3 Telas Principais
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Navegue pelas funcionalidades consolidadas do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainItems.map((item) => {
            const colors = getColorClasses(item.color);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  p-6 rounded-xl border-2 transition-all duration-200
                  ${colors.bg} ${colors.border}
                  hover:shadow-lg hover:scale-105
                  group relative
                `}
              >
                {item.badge && (
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                    {item.badge}
                  </div>
                )}
                
                <div className={`mb-3 ${colors.icon}`}>
                  {item.icon}
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${colors.title}`}>
                  {item.title}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={colors.icon}>Acessar</span>
                  <span className={colors.icon}>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Legacy Navigation */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <span>📦</span>
          Ferramentas Adicionais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {legacyItems.map((item) => {
            const colors = getColorClasses(item.color);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  p-4 rounded-lg border transition-all duration-200
                  ${colors.bg} ${colors.border}
                  hover:shadow-md
                  flex items-center gap-3
                `}
              >
                <div className={colors.icon}>
                  {item.icon}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Novidades v3.0</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Dashboard consolidado com métricas em tempo real</li>
              <li>✅ Monitoramento de scraping com controle ao vivo</li>
              <li>✅ Insights personalizados baseados no seu uso</li>
              <li>✅ Sistema de rastreamento de preferências</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
