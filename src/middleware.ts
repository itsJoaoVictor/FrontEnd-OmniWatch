import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password');
                     
  const isHomePage = request.nextUrl.pathname === '/';
  
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
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, logo.* (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.*|sitemap.xml|robots.txt).*)',
  ],
};
