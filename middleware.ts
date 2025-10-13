import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para rastreamento automático de atividades do usuário
 * 
 * Rastreia:
 * - Visualizações de licitações
 * - Visualizações de notícias
 * - Acesso às páginas principais
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Obter ou criar session_id
  let sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    // Gerar novo session_id
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cookie válido por 24 horas
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 horas
    });
  }
  
  // Rastrear apenas rotas relevantes
  const pathname = request.nextUrl.pathname;
  
  // Rastrear visualização de licitação específica
  if (pathname.match(/^\/dashboard\/[a-f0-9-]+$/)) {
    const licitacaoId = pathname.split('/').pop();
    
    // Fazer chamada async para API de tracking (fire-and-forget)
    trackActivity(request, {
      tipo_acesso: 'licitacao_detalhes',
      recurso_id: licitacaoId || undefined,
      url_acessada: pathname
    });
  }
  
  // Rastrear visualização de notícia específica
  else if (pathname.match(/^\/noticias\/[a-f0-9-]+$/)) {
    const noticiaId = pathname.split('/').pop();
    
    trackActivity(request, {
      tipo_acesso: 'noticia_detalhes',
      recurso_id: noticiaId || undefined,
      url_acessada: pathname
    });
  }
  
  // Rastrear acesso às páginas principais
  else if (pathname === '/dashboard' || pathname === '/noticias' || pathname === '/scrape') {
    const tipoMap: Record<string, string> = {
      '/dashboard': 'dashboard_home',
      '/noticias': 'noticias_listagem',
      '/scrape': 'scrape_page'
    };
    
    trackActivity(request, {
      tipo_acesso: tipoMap[pathname] || 'page_view',
      url_acessada: pathname
    });
  }
  
  return response;
}

/**
 * Fire-and-forget tracking call
 * Não aguarda resposta para não bloquear o middleware
 */
function trackActivity(request: NextRequest, data: Record<string, unknown>) {
  // Construir URL absoluta da API
  const baseUrl = request.nextUrl.origin;
  const trackingUrl = `${baseUrl}/api/tracking`;
  
  // Fazer chamada POST sem aguardar
  fetch(trackingUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
      'user-agent': request.headers.get('user-agent') || '',
      'cookie': request.headers.get('cookie') || ''
    },
    body: JSON.stringify(data)
  }).catch(error => {
    // Silenciar erros de tracking para não afetar a experiência do usuário
    console.error('Tracking error:', error);
  });
}

// Configurar rotas que passam pelo middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/noticias/:path*',
    '/scrape'
  ]
};
