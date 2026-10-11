import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware hanya menangani dua hal:
 * 1. Mewajibkan keberadaan sesi Better Auth pada rute privat (lapisan pertama).
 * 2. Mengarahkan user yang sudah login menjauh dari /login dan /register.
 *
 * Otorisasi berbasis role dan permission TIDAK dilakukan di sini; itu ditegakkan
 * di layout server, Server Action, dan Route Handler (lihat AGENTS.md Rule 3/34).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Abaikan aset Next.js/internal.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // 2. Deteksi sesi Better Auth.
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;
  const isAuthenticated = Boolean(sessionToken);

  // 3. Handle explicit logout (bersihkan cookie sesi).
  if (pathname === '/login' && request.nextUrl.searchParams.has('logged_out')) {
    const response = NextResponse.next();
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  // 4. Redirect unauthenticated users dari rute privat.
  const isPublicApi =
    pathname.startsWith('/api/v1/auth') ||
    pathname.startsWith('/api/v1/sessions/cron-generate') ||
    pathname.startsWith('/api/v1/automation');

  const isPrivateRoute =
    pathname.startsWith('/management') ||
    pathname.startsWith('/tutor') ||
    (pathname.startsWith('/api/v1') && !isPublicApi);

  if (isPrivateRoute && !isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: silakan login terlebih dahulu.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. User yang sudah login tidak perlu melihat /login atau /register.
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    if (
      !request.nextUrl.searchParams.has('switch') &&
      !request.nextUrl.searchParams.has('logged_out')
    ) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const target =
        callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
