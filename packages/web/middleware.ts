import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health'
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/set-lv-profile'
];

// Define API routes that should be proxied
const apiRoutes = [
  '/api'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔧 Middleware: Processing request', { pathname });

  // Handle API routes - proxy to backend
  if (pathname.startsWith('/api/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const targetUrl = `${apiUrl}${pathname.replace('/api', '')}`;

    console.log('🔧 Middleware: API proxy', { from: pathname, to: targetUrl });

    // Create a new URL for the API request
    const url = request.nextUrl.clone();
    url.href = targetUrl;

    return NextResponse.rewrite(url);
  }

  // Handle static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Get authentication status from cookies or headers
  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!authToken;

  // Check if user is admin (simplified check)
  const userRole = request.cookies.get('user-role')?.value;
  const isAdmin = userRole === 'admin';

  console.log('🔧 Middleware: Auth check', {
    pathname,
    isAuthenticated,
    isAdmin,
    hasToken: !!authToken
  });

  // Handle admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated || !isAdmin) {
      console.log('🔧 Middleware: Admin access denied, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Handle protected routes
  if (!publicRoutes.includes(pathname) && !isAuthenticated) {
    // Check if it's a protected route pattern
    const protectedPatterns = [
      '/wardrobe',
      '/outfits',
      '/marketplace',
      '/social',
      '/profile',
      '/analytics',
      '/advertising',

      '/discover'
    ];

    const isProtectedRoute = protectedPatterns.some(pattern =>
      pathname.startsWith(pattern)
    );

    if (isProtectedRoute) {
      console.log('🔧 Middleware: Protected route access denied, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle redirect after login
  // Commented out to prevent redirect loops when token is invalid but cookie exists
  /*
  if (pathname === '/login' && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/wardrobe';
    console.log('🔧 Middleware: Already authenticated, redirecting', { redirectTo });
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  */

  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Navigation-Processed', 'true');

  console.log('✅ Middleware: Request processed successfully', { pathname });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};