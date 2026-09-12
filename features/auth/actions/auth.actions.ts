'use server';

import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SYNTHETIC_USERS } from '@/data/users';
import type { UserRole } from '@/types/database.types';

export async function ensureUserProfile(params: {
  userId: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
}) {
  try {
    const supabase = createServerSupabaseClient();

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', params.userId)
      .single();

    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    // Insert profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .insert({
        user_id: params.userId,
        full_name: params.fullName,
        role: params.role,
        phone: params.phone || null,
      })
      .select('id, role')
      .single();

    if (profErr || !profile) {
      console.error('Error creating user profile:', profErr);
      return { success: false, error: profErr?.message || 'Gagal membuat profil pengguna.' };
    }

    // If role is tutor, create entry in tutors table
    if (params.role === 'tutor') {
      const { error: tutorErr } = await supabase
        .from('tutors')
        .insert({
          profile_id: profile.id,
          status: 'active',
        });

      if (tutorErr) {
        console.error('Error creating tutor entry:', tutorErr);
      }
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return { success: false, error: 'Terjadi kesalahan sistem saat membuat profil.' };
  }
}

/**
 * Server Action untuk login menggunakan akun sintetis (tanpa password).
 * Digunakan untuk mode uji coba/demo prototype.
 */
export async function loginWithSyntheticUser(userIdOrEmail: string) {
  try {
    const cleanQuery = userIdOrEmail.trim().toLowerCase();
    const user = SYNTHETIC_USERS.find(
      (u) => u.id.toLowerCase() === cleanQuery || u.email.toLowerCase() === cleanQuery
    );

    if (!user) {
      return {
        success: false,
        error: 'Akun sintetis tidak ditemukan. Pastikan memilih salah satu akun dari daftar.',
      };
    }

    const cookieStore = await cookies();
    // Simpan identitas user sintesis ke cookie
    cookieStore.set('synthetic_user_id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      sameSite: 'lax',
    });

    // Simpan juga session token cookie untuk kompatibilitas middleware
    cookieStore.set('better-auth.session_token', `synthetic-${user.id}`, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    const redirectTo = user.role === 'tutor' ? '/tutor/dashboard' : '/management/dashboard';

    return {
      success: true,
      user,
      redirectTo,
    };
  } catch (err: unknown) {
    console.error('Error in loginWithSyntheticUser:', err);
    return {
      success: false,
      error: 'Gagal melakukan login sintetis.',
    };
  }
}

/**
 * Server Action untuk logout user sintetis dan membersihkan cookie.
 */
export async function logoutSyntheticUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('synthetic_user_id', '', { path: '/', maxAge: 0, expires: new Date(0) });
    cookieStore.set('better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
    cookieStore.set('__Secure-better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
    cookieStore.delete('synthetic_user_id');
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('__Secure-better-auth.session_token');
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

