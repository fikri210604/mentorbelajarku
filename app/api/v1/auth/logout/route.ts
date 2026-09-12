import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.set('synthetic_user_id', '', { path: '/', maxAge: 0, expires: new Date(0) });
  cookieStore.set('better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
  cookieStore.set('__Secure-better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });

  const url = new URL('/login?logged_out=true', request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set('synthetic_user_id', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('__Secure-better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
