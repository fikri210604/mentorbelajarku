"use server";

import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "../schemas/profile.schema";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export interface ProfileActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Memperbarui profil tutor. Identitas SELALU dari sesi server, bukan dari client.
 */
export async function updateTutorProfile(
  input: UpdateProfileInput
): Promise<ProfileActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED: Silakan login terlebih dahulu." };
    }

    const validated = updateProfileSchema.parse(input);
    const userId = user.user.id;
    const supabase = createServerClient();

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        full_name: validated.fullName,
        phone: validated.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileErr) {
      return { success: false, error: "Gagal memperbarui profil." };
    }

    if (validated.bio !== undefined) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (prof?.id) {
        await supabase
          .from("tutors")
          .update({ bio: validated.bio || null, updated_at: new Date().toISOString() })
          .eq("profile_id", prof.id);
      }
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "TUTOR_PROFILE_UPDATED",
      entity_type: "profile",
      entity_id: userId,
      metadata: { updatedFields: Object.keys(validated) },
    });

    revalidatePath("/tutor/profile");
    revalidatePath("/tutor/dashboard");
    return { success: true, message: "Data profil Anda berhasil diperbarui!" };
  } catch (err: unknown) {
    console.error("updateTutorProfile error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat menyimpan profil."),
    };
  }
}

/**
 * Mengubah kata sandi akun melalui Better Auth, lalu menghapus flag
 * must_change_password. Identitas dari sesi server.
 */
export async function changeTutorPassword(
  input: ChangePasswordInput
): Promise<ProfileActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED: Silakan login terlebih dahulu." };
    }

    const validated = changePasswordSchema.parse(input);
    const userId = user.user.id;

    // Ganti kredensial lewat Better Auth (satu-satunya provider autentikasi).
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: validated.currentPassword,
          newPassword: validated.newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch {
      return {
        success: false,
        error: "Kata sandi saat ini salah atau perubahan kata sandi gagal.",
      };
    }

    const supabase = createServerClient();
    await supabase
      .from("profiles")
      .update({ must_change_password: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "TUTOR_PASSWORD_CHANGED",
      entity_type: "user_security",
      entity_id: userId,
      metadata: { mustChangePasswordCleared: true, changedAt: new Date().toISOString() },
    });

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
      error: getSafeErrorMessage(err, "Terjadi kesalahan saat mengubah kata sandi."),
    };
  }
}
