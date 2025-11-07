import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for Next.js
// Note: Auth state is managed client-side via localStorage and Zustand
// This middleware is lightweight and mainly for future server-side auth enhancements
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Client-side components handle auth redirects via useAuth hook
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

