import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, and PWA configuration files without authentication
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/logo') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // Bloquear acesso à rota de cadastro e redirecionar para login
  if (pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/forgot-password');
                     
  const isHomePage = pathname === '/';
  
  const isLoggedIn = request.cookies.has('is_logged_in');

  // Protect internal routes
  if (!isLoggedIn && !isAuthPage && !isHomePage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect away from auth pages if logged in
  if (isLoggedIn && (isAuthPage || isHomePage)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static & _next/image
     * - metadata & PWA files (manifest.json, sw.js, favicon.ico, etc.)
     * - static file extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js)$).*)',
  ],
};

