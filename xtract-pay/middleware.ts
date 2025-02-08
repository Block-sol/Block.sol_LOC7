// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!session && !isPublicPath) {
    // Redirect to login if trying to access protected route without session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicPath) {
    // Redirect to dashboard if trying to access public route with session
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};