import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';

/**
 * Logout menggunakan Better Auth (satu-satunya provider autentikasi).
 * Tidak ada lagi cookie identitas sintetis.
 */
export async function GET(request: Request) {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Abaikan: sesi mungkin sudah tidak valid.
  }

  const url = new URL('/login?logged_out=true', request.url);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  return GET(request);
}
