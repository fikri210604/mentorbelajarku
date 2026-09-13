import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { DEFAULT_SYNTHETIC_USER, SYNTHETIC_USERS } from '@/data/users';
import type { UserRole } from '@/types/database.types';

import type { ManagementSubrole } from '@/types/auth';

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
    role: UserRole;
    must_change_password: boolean;
  } | null;
  role: UserRole;
  subrole?: ManagementSubrole | null;
  tutorId: string | null;
}

/**
 * Get raw session from Better Auth via request headers.
 * (Sementara di-comment untuk mode coba-coba dengan user sintetis.
 *  Dapat dibuka kembali dengan menghapus tanda komentar di bawah ini).
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (err) {
    // If DB is not connected yet, silently return null
    return null;
  }
}

/**
 * Retrieve authenticated user context along with their profile and tutor mapping.
 * Membaca session aktif Better Auth. Jika belum ada, menggunakan user sintetis dari cookie.
 * Dibungkus dengan React cache() untuk mencegah duplicate database & cookie fetch per-request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUserSession> => {
  const session = await getServerSession();

  if (session?.user && isSupabaseConfigured()) {
    try {
      const supabase = createServerSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, avatar_url, role, must_change_password')
        .eq('user_id', session.user.id)
        .single();

      let tutorId: string | null = null;
      if (profile?.id) {
        const { data: tutor } = await supabase
          .from('tutors')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        tutorId = tutor?.id || null;
      }

      const role: UserRole = (profile?.role as UserRole) || (session.user as any).role || 'tutor';

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image || null,
          emailVerified: session.user.emailVerified,
          createdAt: session.user.createdAt,
          updatedAt: session.user.updatedAt,
        },
        profile: profile
          ? {
              ...profile,
              must_change_password: Boolean((profile as any).must_change_password),
            }
          : null,
        role,
        subrole: role === 'management' ? 'owner' : null,
        tutorId,
      };
    } catch (dbErr) {
      console.warn('Supabase profile query warning, using session user:', dbErr);
    }
  }

  // Ambil user sintetis aktif dari cookie, fallback ke DEFAULT_SYNTHETIC_USER
  let activeSyntheticUser = DEFAULT_SYNTHETIC_USER;
  try {
    const cookieStore = await cookies();
    const syntheticId = cookieStore.get('synthetic_user_id')?.value;
    if (syntheticId) {
      const found = SYNTHETIC_USERS.find(
        (u) => u.id === syntheticId || u.email.toLowerCase() === syntheticId.toLowerCase()
      );
      if (found) {
        activeSyntheticUser = found;
      }
    }
  } catch {
    // Fallback jika cookies tidak dapat dibaca di konteks tertentu
  }

  return {
    user: {
      id: activeSyntheticUser.id,
      email: activeSyntheticUser.email,
      name: activeSyntheticUser.name,
      image: activeSyntheticUser.avatarUrl || null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    profile: {
      id: `prof-${activeSyntheticUser.id}`,
      user_id: activeSyntheticUser.id,
      full_name: activeSyntheticUser.name,
      phone: activeSyntheticUser.phone,
      avatar_url: activeSyntheticUser.avatarUrl || null,
      role: activeSyntheticUser.role,
      must_change_password: activeSyntheticUser.mustChangePassword ?? false,
    },
    role: activeSyntheticUser.role,
    subrole: activeSyntheticUser.subrole || (activeSyntheticUser.role === 'management' ? 'owner' : null),
    tutorId: activeSyntheticUser.tutorId || null,
  };
});

/**
 * Alias for getCurrentUser for API routes and Server Actions.
 */
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
