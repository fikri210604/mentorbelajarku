import { NextResponse } from 'next/server';
import { getAuthUser, sessionHasPermission } from '@/lib/auth/session';
import type { CurrentUserSession } from '@/lib/auth/session';
import type { Permission } from '@/types/auth';

export type ApiGuardResult =
  | { ok: true; user: CurrentUserSession }
  | { ok: false; response: NextResponse };

/**
 * Membuat respons JSON error standar tanpa membocorkan detail internal.
 */
export function apiJsonError(
  message: string,
  status: number,
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL'
): NextResponse {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

function unauthorized(): ApiGuardResult {
  return {
    ok: false,
    response: apiJsonError('Unauthorized: silakan login terlebih dahulu.', 401, 'UNAUTHORIZED'),
  };
}

function forbidden(message = 'Forbidden: hak akses tidak mencukupi.'): ApiGuardResult {
  return { ok: false, response: apiJsonError(message, 403, 'FORBIDDEN') };
}

/**
 * Memastikan request memiliki sesi terautentikasi yang valid.
 */
export async function requireApiUser(): Promise<ApiGuardResult> {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  return { ok: true, user };
}

/**
 * Guard otorisasi berbasis permission untuk Route Handler.
 * Mengembalikan respons 401/403 siap pakai bila tidak memenuhi.
 */
export async function requirePermissionApi(permission: Permission): Promise<ApiGuardResult> {
  const user = await getAuthUser();

  if (!user) return unauthorized();

  if (!sessionHasPermission(user, permission)) return forbidden();

  return { ok: true, user };
}

/**
 * Guard untuk seluruh endpoint di bawah `/api/v1/management/*`.
 * - Wajib terautentikasi.
 * - Menolak role portal `tutor` (tutor tidak boleh mengakses API Management).
 * - Bila `permission` diberikan, permission tersebut wajib dimiliki.
 */
export async function requireManagementApi(permission?: Permission): Promise<ApiGuardResult> {
  const user = await getAuthUser();

  if (!user) return unauthorized();

  if (user.role === 'tutor') {
    return forbidden('Forbidden: endpoint Management tidak dapat diakses oleh tutor.');
  }

  if (permission && !sessionHasPermission(user, permission)) return forbidden();

  return { ok: true, user };
}

/**
 * Guard untuk seluruh endpoint di bawah `/api/v1/tutor/*`.
 * - Wajib terautentikasi.
 * - WAJIB memiliki pemetaan `tutorId` (fail closed). Akun tanpa pemetaan tutor
 *   tidak boleh jatuh ke query tanpa scope, sehingga IDOR/leak tercegah.
 * - Bila `permission` diberikan, permission tersebut wajib dimiliki.
 */
export async function requireTutorApi(permission?: Permission): Promise<ApiGuardResult> {
  const user = await getAuthUser();

  if (!user) return unauthorized();

  if (!user.tutorId) {
    return forbidden('Forbidden: akun ini belum dipetakan ke profil tutor.');
  }

  if (permission && !sessionHasPermission(user, permission)) return forbidden();

  return { ok: true, user };
}
