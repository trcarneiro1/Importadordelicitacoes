'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Activity, Settings, Wrench, Bell, User } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const categories: Category[] = [
  {
    id: 'home',
    label: 'Início',
    icon: <Home className="w-5 h-5" />,
    href: '/welcome'
  },
  {
    id: 'analytics',
    label: 'Análises',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/analytics/dashboard'
  },
  {
    id: 'operations',
    label: 'Operações',
    icon: <Activity className="w-5 h-5" />,
    href: '/operations/licitacoes'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings/sres'
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: <Wrench className="w-5 h-5" />,
    href: '/tools/test-scraper'
  }
];

export default function TopBar() {
  const pathname = usePathname();

  const getActiveCategory = () => {
    if (pathname === '/' || pathname === '/welcome') return 'home';
    if (pathname?.startsWith('/analytics')) return 'analytics';
    if (pathname?.startsWith('/operations')) return 'operations';
    if (pathname?.startsWith('/settings')) return 'settings';
    if (pathname?.startsWith('/tools')) return 'tools';
    if (pathname?.startsWith('/dashboard/analitico')) return 'analytics';
    if (pathname?.startsWith('/monitoramento')) return 'operations';
    if (pathname?.startsWith('/insights')) return 'analytics';
    if (pathname?.startsWith('/sres')) return 'settings';
    return 'home';
  };

  const activeCategory = getActiveCategory();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Licitações IA
            </h1>
            <p className="text-xs text-gray-500">v3.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            
            return (
              <Link
                key={category.id}
                href={category.href}
                className={`
                  relative px-4 py-2 rounded-lg transition-all duration-200
                  flex items-center gap-2 font-medium text-sm
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {category.icon}
                <span className="hidden md:inline">{category.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
                
                {/* Badge */}
                {category.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {category.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <User className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
