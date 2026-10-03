import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  resolvePermissionsForRoleName,
  isOwnerRoleName,
  portalRoleForRoleName,
} from '@/lib/permissions/resolver';
import type { UserRole } from '@/types/database.types';

import type { ManagementSubrole, Permission } from '@/types/auth';

export interface CurrentUserSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    must_change_password: boolean;
  } | null;
  /** Role portal (management/tutor/admin/finance) untuk routing. */
  role: UserRole;
  /** ID role dinamis dari database (user.role_id). */
  roleId: string | null;
  /** Nama role sebenarnya, termasuk role dinamis seperti `curriculum`/`hrd`. */
  roleName: string;
  /** Permission efektif hasil resolusi role. */
  permissions: Permission[];
  subrole?: ManagementSubrole | null;
  tutorId: string | null;
}

const SUBROLE_NAMES: ManagementSubrole[] = [
  'owner',
  'curriculum',
  'hrd',
  'finance',
  'general',
];

function resolvePortalRole(roleName: string, fallback: UserRole): UserRole {
  return portalRoleForRoleName(roleName) ?? fallback;
}

function resolveSubrole(
  roleName: string,
  portalRole: UserRole
): ManagementSubrole | null {
  if (portalRole === 'tutor') return null;
  const normalized = (roleName || '').toLowerCase().trim();
  if (SUBROLE_NAMES.includes(normalized as ManagementSubrole)) {
    return normalized as ManagementSubrole;
  }
  if (normalized === 'management' || normalized === 'admin') return 'owner';
  return 'general';
}

interface CachedUserSession {
  session: CurrentUserSession;
  expiresAt: number;
}

const userSessionCache = new Map<string, CachedUserSession>();

export function invalidateUserSessionCache(key?: string) {
  if (key) {
    userSessionCache.delete(key);
  } else {
    userSessionCache.clear();
  }
}

/**
 * Mengambil session mentah Better Auth dari header request.
 * Hanya token session Better Auth asli yang diterima.
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('__Secure-better-auth.session_token')?.value;

    if (!sessionToken) return null;

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    // Bila database belum siap/timeout, perlakukan sebagai tidak ada sesi (fail closed).
    return null;
  }
}

/**
 * Mengambil konteks user terautentikasi beserta profil dan pemetaan tutor.
 * Fail closed: mengembalikan null bila tidak ada session Better Auth yang valid.
 * Tidak ada lagi fallback ke identitas sintetis.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUserSession | null> => {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get('better-auth.session_token')?.value ||
    cookieStore.get('__Secure-better-auth.session_token')?.value;

  if (!sessionToken) return null;

  // 0. Cache in-memory (45s) untuk menghindari query berulang per request.
  const cached = userSessionCache.get(sessionToken);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.session;
  }

  const session = await getServerSession();

  if (!session?.user || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServerSupabaseClient();
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };

    const [{ data: userRow }, { data: profile }] = await Promise.all([
      db.from('user').select('id, role, role_id').eq('id', session.user.id).maybeSingle(),
      db
        .from('profiles')
        .select('id, user_id, full_name, phone, avatar_url, must_change_password, tutors(id)')
        .eq('user_id', session.user.id)
        .maybeSingle(),
    ]);

    const userRowTyped = userRow as { role?: string; role_id?: string | null } | null;
    const profileTyped = profile as {
      id: string;
      user_id: string;
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
      must_change_password: boolean;
      tutors?: { id?: string }[] | { id?: string } | null;
    } | null;

    const fallbackRole: UserRole =
      (userRowTyped?.role as UserRole) ||
      ((session.user as unknown as { role?: UserRole }).role) ||
      'tutor';

    const roleId: string | null = userRowTyped?.role_id ?? null;
    let roleName: string = userRowTyped?.role || fallbackRole;
    let permissions: Permission[] = [];

    if (roleId) {
      const { data: roleRow } = await db
        .from('roles')
        .select('name, role_permissions(permission_id)')
        .eq('id', roleId)
        .maybeSingle();

      const roleTyped = roleRow as {
        name?: string;
        role_permissions?: { permission_id: string }[];
      } | null;

      if (roleTyped?.name) {
        roleName = roleTyped.name;
        permissions = (roleTyped.role_permissions || []).map(
          (rp) => rp.permission_id as Permission
        );
      }
    }

    if (permissions.length === 0) {
      permissions = resolvePermissionsForRoleName(roleName);
    }

    const portalRole = resolvePortalRole(roleName, fallbackRole);

    let tutorId: string | null = null;
    if (profileTyped) {
      const tutorData = profileTyped.tutors;
      tutorId = Array.isArray(tutorData)
        ? tutorData[0]?.id || null
        : tutorData?.id || null;
    }

    const productionSession: CurrentUserSession = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image || null,
        emailVerified: session.user.emailVerified,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      },
      profile: profileTyped
        ? {
            id: profileTyped.id,
            user_id: profileTyped.user_id,
            full_name: profileTyped.full_name,
            phone: profileTyped.phone,
            avatar_url: profileTyped.avatar_url,
            must_change_password: Boolean(profileTyped.must_change_password),
          }
        : null,
      role: portalRole,
      roleId,
      roleName,
      permissions,
      subrole: resolveSubrole(roleName, portalRole),
      tutorId,
    };

    userSessionCache.set(sessionToken, {
      session: productionSession,
      expiresAt: Date.now() + 45_000,
    });

    return productionSession;
  } catch (dbErr) {
    console.warn('Supabase profile query warning, fail closed:', dbErr);
    return null;
  }
});

/** Alias untuk API routes dan Server Actions. */
export const getAuthUser = getCurrentUser;

/**
 * Enforce authentication in Server Components.
 */
export async function requireAuthUser(): Promise<CurrentUserSession> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }
  return currentUser;
}

/**
 * Enforce role in Server Components.
 */
export async function requireRoleUser(allowedRoles: UserRole[]): Promise<CurrentUserSession> {
  const currentUser = await requireAuthUser();
  if (!allowedRoles.includes(currentUser.role)) {
    redirect('/dashboard?error=forbidden');
  }
  return currentUser;
}

/**
 * Cek permission murni pada sebuah session. Owner selalu lolos.
 */
export function sessionHasPermission(
  session: CurrentUserSession,
  permission: Permission
): boolean {
  if (isOwnerRoleName(session.roleName)) return true;
  return session.permissions.includes(permission);
}

/**
 * Guard untuk Server Component: redirect ke dashboard bila permission tidak cukup.
 */
export async function requirePermissionUser(
  permission: Permission
): Promise<CurrentUserSession> {
  const currentUser = await requireAuthUser();
  if (!sessionHasPermission(currentUser, permission)) {
    redirect('/management/dashboard?error=forbidden');
  }
  return currentUser;
}

/**
 * Guard untuk Server Action: mengembalikan status tanpa melempar/redirect,
 * agar action dapat membalas `{ success: false, message }`.
 */
export async function checkPermission(
  permission: Permission
): Promise<
  | { allowed: true; user: CurrentUserSession }
  | { allowed: false; user: null }
> {
  const user = await getCurrentUser();
  if (!user || !sessionHasPermission(user, permission)) {
    return { allowed: false, user: null };
  }
  return { allowed: true, user };
}
