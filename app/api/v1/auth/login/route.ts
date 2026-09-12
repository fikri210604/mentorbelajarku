import { NextResponse } from 'next/server';
import { SYNTHETIC_USERS, DEFAULT_SYNTHETIC_USER } from '@/data/users';

// =========================================================================
// Better Auth Login Handler (Sementara di-comment untuk mode coba-coba)
// Nanti saat Better Auth & Database siap, implementasikan auth.api.signInEmail
// =========================================================================
/*
import { auth } from '@/lib/auth/auth';
*/
// =========================================================================

/**
 * POST /api/v1/auth/login
 * Endpoint login dengan akun sintetis (tanpa password).
 * Body: { email?: string, userId?: string }
 */
export async function POST(request: Request) {
  try {
    let email = '';
    let userId = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      email = body.email || '';
      userId = body.userId || '';
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        email = (formData.get('email') as string) || '';
        userId = (formData.get('userId') as string) || '';
      }
    }

    // Cari user sintetis berdasarkan userId atau email
    const query = (userId || email).trim().toLowerCase();
    const user = query
      ? SYNTHETIC_USERS.find(
          (u) => u.id.toLowerCase() === query || u.email.toLowerCase() === query
        )
      : DEFAULT_SYNTHETIC_USER;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akun sintetis tidak ditemukan. Pilih salah satu dari daftar akun yang tersedia.',
          availableUsers: SYNTHETIC_USERS.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          })),
        },
        { status: 404 }
      );
    }

    const redirectTo = user.role === 'tutor' ? '/tutor/dashboard' : '/management/dashboard';

    const response = NextResponse.json({
      success: true,
      message: `Berhasil login sebagai ${user.name} (${user.role}) tanpa password`,
      data: {
        user,
        redirectTo,
      },
    });

    // Pasang cookie sesi sintetis
    const maxAge = 60 * 60 * 24 * 7; // 7 hari
    response.cookies.set('synthetic_user_id', user.id, {
      path: '/',
      maxAge,
      sameSite: 'lax',
    });
    response.cookies.set('better-auth.session_token', `synthetic-${user.id}`, {
      path: '/',
      maxAge,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('Error in POST /api/v1/auth/login:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat proses login.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/auth/login
 * Mempermudah pengujian login melalui browser atau URL.
 * Query params: ?email=... atau ?userId=... atau ?redirect=true
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const userId = searchParams.get('userId') || '';
  const shouldRedirect = searchParams.get('redirect') === 'true';

  const query = (userId || email).trim().toLowerCase();
  const user = query
    ? SYNTHETIC_USERS.find(
        (u) => u.id.toLowerCase() === query || u.email.toLowerCase() === query
      )
    : DEFAULT_SYNTHETIC_USER;

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Akun sintetis tidak ditemukan',
        availableUsers: SYNTHETIC_USERS.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
        })),
      },
      { status: 404 }
    );
  }

  const redirectTo = user.role === 'tutor' ? '/tutor/dashboard' : '/management/dashboard';

  // Jika diminta redirect otomatis (misal diklik langsung dari browser)
  if (shouldRedirect) {
    const redirectUrl = new URL(redirectTo, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('synthetic_user_id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('better-auth.session_token', `synthetic-${user.id}`, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    return response;
  }

  const response = NextResponse.json({
    success: true,
    message: `Berhasil login sebagai ${user.name} (${user.role}) tanpa password`,
    data: {
      user,
      redirectTo,
    },
  });

  response.cookies.set('synthetic_user_id', user.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
  response.cookies.set('better-auth.session_token', `synthetic-${user.id}`, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return response;
}
