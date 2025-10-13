'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, Lightbulb, FileText, TrendingUp,
  FolderOpen, Newspaper, Activity, Zap, ScrollText,
  Building2, Users, Sliders, Bell, Shield,
  FlaskConical, Bot, Gauge, Database, Search
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface MenuCategory {
  id: string;
  title: string;
  items: MenuItem[];
}

const menuStructure: Record<string, MenuCategory> = {
  analytics: {
    id: 'analytics',
    title: 'Análises',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/analitico',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        label: 'Insights',
        href: '/insights',
        icon: <Lightbulb className="w-4 h-4" />
      },
      {
        label: 'Relatórios',
        href: '/analytics/reports',
        icon: <FileText className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Tendências',
        href: '/analytics/trends',
        icon: <TrendingUp className="w-4 h-4" />,
        badge: 'Em Breve'
      }
    ]
  },
  operations: {
    id: 'operations',
    title: 'Operações',
    items: [
      {
        label: 'Licitações',
        href: '/operations/licitacoes',
        icon: <FolderOpen className="w-4 h-4" />
      },
      {
        label: 'Notícias',
        href: '/operations/noticias',
        icon: <Newspaper className="w-4 h-4" />
      },
      {
        label: 'Monitoramento',
        href: '/monitoramento',
        icon: <Activity className="w-4 h-4" />
      },
      {
        label: 'Processamento IA',
        href: '/operations/ai-processing',
        icon: <Zap className="w-4 h-4" />
      },
      {
        label: 'Logs',
        href: '/operations/logs',
        icon: <ScrollText className="w-4 h-4" />
      }
    ]
  },
  settings: {
    id: 'settings',
    title: 'Configurações',
    items: [
      {
        label: 'Gerenciar SREs',
        href: '/sres',
        icon: <Building2 className="w-4 h-4" />
      },
      {
        label: 'Usuários',
        href: '/settings/users',
        icon: <Users className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Preferências',
        href: '/settings/preferences',
        icon: <Sliders className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Alertas',
        href: '/settings/alerts',
        icon: <Bell className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Segurança',
        href: '/settings/security',
        icon: <Shield className="w-4 h-4" />,
        badge: 'Em Breve'
      }
    ]
  },
  tools: {
    id: 'tools',
    title: 'Ferramentas',
    items: [
      {
        label: 'Teste Scraping',
        href: '/tools/test-scraper',
        icon: <FlaskConical className="w-4 h-4" />
      },
      {
        label: 'Teste IA',
        href: '/tools/test-ai',
        icon: <Bot className="w-4 h-4" />
      },
      {
        label: 'Performance',
        href: '/tools/performance',
        icon: <Gauge className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Backup',
        href: '/tools/backup',
        icon: <Database className="w-4 h-4" />,
        badge: 'Em Breve'
      },
      {
        label: 'Inspetor',
        href: '/tools/data-inspector',
        icon: <Search className="w-4 h-4" />,
        badge: 'Em Breve'
      }
    ]
  }
};

interface ContextualSidebarProps {
  category?: string;
}

export default function ContextualSidebar({ category }: ContextualSidebarProps) {
  const pathname = usePathname();

  // Determinar categoria ativa
  const getActiveCategory = (): string => {
    if (category) return category;
    if (pathname?.startsWith('/analytics')) return 'analytics';
    if (pathname?.startsWith('/operations')) return 'operations';
    if (pathname?.startsWith('/settings')) return 'settings';
    if (pathname?.startsWith('/tools')) return 'tools';
    if (pathname?.startsWith('/dashboard/analitico')) return 'analytics';
    if (pathname?.startsWith('/monitoramento')) return 'operations';
    if (pathname?.startsWith('/insights')) return 'analytics';
    if (pathname?.startsWith('/sres')) return 'settings';
    return 'analytics';
  };

  const activeCategory = getActiveCategory();
  const menu = menuStructure[activeCategory];

  if (!menu) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {menu.title}
        </h2>
        
        <nav className="space-y-1">
          {menu.items.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${item.badge === 'Em Breve' ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={(e) => {
                  if (item.badge === 'Em Breve') {
                    e.preventDefault();
                  }
                }}
              >
                <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {isActive && (
                  <div className="w-1 h-6 bg-blue-600 rounded-full absolute right-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Versão</span>
            <span className="font-mono text-blue-600">3.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span>SREs Ativas</span>
            <span className="font-semibold text-green-600">47</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-600 font-medium">Online</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
