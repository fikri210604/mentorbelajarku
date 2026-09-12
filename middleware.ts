import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that do not require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/api/v1/auth',
  '/api/auth',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow Next.js internals, static files, and icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // 2. Determine if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 3. Extract Better Auth session token or synthetic user cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('synthetic_user_id')?.value;

  const isAuthenticated = Boolean(sessionToken);

  // 4. Redirect unauthenticated users trying to access private routes
  const isPrivateRoute =
    pathname.startsWith('/management') ||
    pathname.startsWith('/tutor') ||
    (pathname.startsWith('/api/v1') && !pathname.startsWith('/api/v1/auth'));

  if (isPrivateRoute && !isAuthenticated) {
    // In local development or prototype mode where session token might be synthetic in cookies,
    // if no cookie exists, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. If user is already authenticated and visits /login or /register, redirect to appropriate dashboard
  // (kecuali membawa query parameter ?switch=true atau ?logged_out=true untuk logout)
  if (pathname === '/login' && request.nextUrl.searchParams.has('logged_out')) {
    const response = NextResponse.next();
    response.cookies.delete('synthetic_user_id');
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    if (!request.nextUrl.searchParams.has('switch') && !request.nextUrl.searchParams.has('logged_out')) {
      const syntheticUserId = request.cookies.get('synthetic_user_id')?.value;
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const fallbackDashboard = syntheticUserId?.startsWith('usr-tut')
        ? '/tutor/dashboard'
        : '/management/dashboard';
      const targetDashboard =
        callbackUrl && !callbackUrl.startsWith('/login')
          ? callbackUrl
          : fallbackDashboard;
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
