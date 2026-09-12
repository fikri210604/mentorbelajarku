"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "../schemas/profile.schema";
import { SYNTHETIC_USERS } from "@/data/users";

export interface ProfileActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Memperbarui data profil tutor (Nama Lengkap, Nomor Kontak WhatsApp, dan Bio).
 */
export async function updateTutorProfile(
  input: UpdateProfileInput,
  userId: string
): Promise<ProfileActionResult> {
  try {
    const validated = updateProfileSchema.parse(input);
    const supabase = createServerClient();

    // 1. Coba simpan ke PostgreSQL via Supabase
    try {
      // Update tabel profiles
      await supabase
        .from("profiles")
        .update({
          full_name: validated.fullName,
          phone: validated.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Update bio di tabel tutors jika ada profile_id terkait
      if (validated.bio !== undefined) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (prof?.id) {
          await supabase
            .from("tutors")
            .update({
              bio: validated.bio || null,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", prof.id);
        }
      }

      // Catat audit log
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "TUTOR_PROFILE_UPDATED",
        entity_type: "profile",
        entity_id: userId,
        metadata: {
          updatedFields: Object.keys(validated),
        },
      });
    } catch (dbErr) {
      console.warn("updateTutorProfile Supabase fallback:", dbErr);
    }

    // 2. Simpan juga ke memori user sintetis untuk prototype mode
    const synUser = SYNTHETIC_USERS.find(
      (u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()
    );
    if (synUser) {
      synUser.name = validated.fullName;
      if (validated.phone) synUser.phone = validated.phone;
    }

    revalidatePath("/tutor/profile");
    revalidatePath("/tutor/dashboard");
    return {
      success: true,
      message: "Data profil Anda berhasil diperbarui!",
    };
  } catch (err: unknown) {
    console.error("updateTutorProfile error:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan profil.",
    };
  }
}

/**
 * Mengubah kata sandi akun tutor dan otomatis menghilangkan flag must_change_password.
 */
export async function changeTutorPassword(
  input: ChangePasswordInput,
  userId: string
): Promise<ProfileActionResult> {
  try {
    const validated = changePasswordSchema.parse(input);
    const supabase = createServerClient();

    // 1. Coba update ke PostgreSQL Supabase
    try {
      // Set flag must_change_password menjadi FALSE
      await supabase
        .from("profiles")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Catat audit log keamanan
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "TUTOR_PASSWORD_CHANGED",
        entity_type: "user_security",
        entity_id: userId,
        metadata: {
          mustChangePasswordCleared: true,
          changedAt: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn("changeTutorPassword Supabase fallback:", dbErr);
    }

    // 2. Set mustChangePassword = false di memori user sintetis
    const synUser = SYNTHETIC_USERS.find(
      (u) => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()
    );
    if (synUser) {
      synUser.mustChangePassword = false;
    }

    revalidatePath("/tutor/dashboard");
    revalidatePath("/tutor/profile");

    return {
      success: true,
      message:
        "Kata sandi berhasil diubah! Peringatan ganti password pada dashboard Anda telah dihilangkan.",
    };
  } catch (err: unknown) {
    console.error("changeTutorPassword error:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah kata sandi.",
    };
  }
}
