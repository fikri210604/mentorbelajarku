'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database.types';

/**
 * Memastikan profil user (dan entri tutor bila perlu) tersedia.
 * Dipakai saat provisioning akun nyata; tidak ada lagi jalur sintetis.
 */
export async function ensureUserProfile(params: {
  userId: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
}) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', params.userId)
      .maybeSingle();

    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .insert({
        user_id: params.userId,
        full_name: params.fullName,
        phone: params.phone || null,
        must_change_password: false,
      })
      .select('id')
      .single();

    if (profErr || !profile) {
      console.error('Error creating user profile:', profErr);
      return { success: false, error: 'Gagal membuat profil pengguna.' };
    }

    if (params.role === 'tutor') {
      const { error: tutorErr } = await supabase
        .from('tutors')
        .insert({ profile_id: profile.id, status: 'active' });

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
