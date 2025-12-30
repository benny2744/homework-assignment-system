
import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight route protection for teacher pages.
 *
 * Note: Middleware runs in the Edge runtime, so we don't verify the JWT here.
 * We only check that the session cookie exists to avoid unauthenticated pages
 * mounting and firing API requests (which can cause noisy 401s in the console).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public teacher routes
  if (pathname === '/teacher/login' || pathname === '/teacher/register') {
    return NextResponse.next();
  }

  // Protect all other /teacher/* routes
  if (pathname.startsWith('/teacher/')) {
    const token = request.cookies.get('session-token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/teacher/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher/:path*'],
};
