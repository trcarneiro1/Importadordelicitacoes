'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MenuItem {
  title: string;
  href: string;
  icon: string;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard Principal',
    href: '/dashboard',
    icon: '📊',
    description: 'Visão geral de licitações'
  },
  {
    title: 'Licitações',
    href: '/operations/licitacoes',
    icon: '📋',
    description: 'Gestão de licitações'
  },
  {
    title: 'SREs',
    href: '/sres',
    icon: '🏢',
    description: 'Superintendências Regionais'
  },
  {
    title: 'Monitoramento 🤖',
    href: '/automation/monitoring',
    icon: '🎯',
    description: 'Status em tempo real'
  },
  {
    title: 'Processamento IA',
    href: '/automation/ia-processing',
    icon: '🧠',
    description: 'Categorização inteligente'
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 
          text-white transition-all duration-300 z-40 flex flex-col
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Importador
              </h1>
              <p className="text-xs text-gray-400">Licitações MG</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? '☰' : '✕'}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                title={isCollapsed ? item.title : ''}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs opacity-75 truncate">
                      {item.description}
                    </div>
                  </div>
                )}

                {isActive && !isCollapsed && (
                  <div className="w-1 h-8 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {!isCollapsed ? (
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Versão</span>
                <span className="font-mono">2.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
