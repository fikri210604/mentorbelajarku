"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/auth/session";
import { hashPassword } from "@better-auth/utils/password";
import { sendTutorWelcomeEmail } from "@/lib/email/email.service";
import {
  createTutorSchema,
  updateTutorSchema,
  resendCredentialsSchema,
  CreateTutorInput,
  UpdateTutorInput,
  ResendCredentialsInput,
} from "../schemas/tutor.schema";

/**
 * Helper pembuat password default acak yang aman dan mudah dibaca.
 * Format: Mbk{4 digit acak}!{2 huruf acak} -> misal Mbk7182!mP
 */
function generateDefaultPassword(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const chars = "abcdefghjkmnpqrstuvwxyz";
  const suffix1 = chars.charAt(Math.floor(Math.random() * chars.length));
  const suffix2 = chars.charAt(Math.floor(Math.random() * chars.length)).toUpperCase();
  return `Mbk${randomDigits}!${suffix1}${suffix2}`;
}

/**
 * Tambah Tutor Baru & Buat Akun Otomatis di Better Auth & Database
 */
export async function createTutorAction(input: CreateTutorInput) {
  const authCheck = await checkPermission("tutor:create");
  if (!authCheck.allowed) {
    return {
      success: false,
      error: "FORBIDDEN: Anda tidak memiliki izin untuk menambahkan tutor baru.",
    };
  }

  const parsed = createTutorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const data = parsed.data;
  const supabase = createServerClient();

  // 1. Cek apakah email sudah terdaftar di tabel "user"
  const { data: existingUser, error: checkEmailError } = await supabase
    .from("user")
    .select("id, email")
    .eq("email", data.email)
    .maybeSingle();

  if (checkEmailError) {
    console.error("[createTutorAction] Gagal memeriksa email:", checkEmailError);
    return { success: false, error: "Gagal memeriksa ketersediaan email." };
  }

  if (existingUser) {
    return {
      success: false,
      error: `Email "${data.email}" sudah terdaftar di sistem. Gunakan email lain.`,
    };
  }

  // 2. Siapkan password default atau custom
  const rawPassword = (data.customPassword && data.customPassword.trim().length >= 6)
    ? data.customPassword.trim()
    : generateDefaultPassword();

  let hashedPassword: string;
  try {
    hashedPassword = await hashPassword(rawPassword);
  } catch (hashErr) {
    console.error("[createTutorAction] Gagal hashing password:", hashErr);
    return { success: false, error: "Gagal memproses enkripsi password." };
  }

  // 3. Ambil role_id untuk role 'tutor'
  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "tutor")
    .maybeSingle();
  const tutorRoleId = roleRow?.id ?? null;

  // 4. Buat baris di tabel "user"
  const userId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const { error: userError } = await supabase.from("user").insert({
    id: userId,
    name: data.fullName,
    email: data.email,
    email_verified: true,
    role: "tutor",
    role_id: tutorRoleId,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (userError) {
    console.error("[createTutorAction] Gagal insert user:", userError);
    return { success: false, error: "Gagal membuat akun user tutor." };
  }

  // 5. Buat credential account di tabel "account"
  const accountId = crypto.randomUUID();
  const { error: accountError } = await supabase.from("account").insert({
    id: accountId,
    user_id: userId,
    account_id: userId,
    provider_id: "credential",
    password: hashedPassword,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (accountError) {
    console.error("[createTutorAction] Gagal insert account:", accountError);
    // Rollback user
    await supabase.from("user").delete().eq("id", userId);
    return { success: false, error: "Gagal membuat akun kredensial login." };
  }

  // 6. Buat baris di tabel "profiles"
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      full_name: data.fullName,
      phone: data.phone,
      gender: data.gender,
      must_change_password: true,
    })
    .select("id")
    .single();

  if (profileError || !profileRow) {
    console.error("[createTutorAction] Gagal insert profile:", profileError);
    // Rollback user (akan cascade ke account)
    await supabase.from("user").delete().eq("id", userId);
    return { success: false, error: "Gagal membuat profil tutor." };
  }

  // 7. Buat baris di tabel "tutors"
  const { data: tutorRow, error: tutorError } = await supabase
    .from("tutors")
    .insert({
      profile_id: profileRow.id,
      bio: data.bio,
      gender: data.gender,
      status: data.status,
    })
    .select("id")
    .single();

  if (tutorError || !tutorRow) {
    console.error("[createTutorAction] Gagal insert tutor:", tutorError);
    // Rollback profiles & user
    await supabase.from("profiles").delete().eq("id", profileRow.id);
    await supabase.from("user").delete().eq("id", userId);
    return { success: false, error: "Gagal mendaftarkan data tutor." };
  }

  // 8. Kirim email selamat datang berisi kredensial & sapaan Islami
  let emailResult = null;
  if (data.sendEmail) {
    emailResult = await sendTutorWelcomeEmail({
      tutorName: data.fullName,
      gender: data.gender,
      email: data.email,
      password: rawPassword,
    });
  }

  // 9. Catat ke audit_logs (AGENTS.md Rule 16)
  await supabase.from("audit_logs").insert({
    user_id: authCheck.user.user.id,
    action: "CREATE_TUTOR",
    entity_type: "tutors",
    entity_id: tutorRow.id,
    metadata: {
      user_id: userId,
      profile_id: profileRow.id,
      full_name: data.fullName,
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      status: data.status,
      email_sent: emailResult?.success ?? false,
      email_simulated: emailResult?.simulated ?? false,
    },
  });

  revalidatePath("/management/tutors");

  return {
    success: true,
    tutorId: tutorRow.id,
    fullName: data.fullName,
    gender: data.gender,
    email: data.email,
    generatedPassword: rawPassword,
    emailResult,
    message: `Tutor "${data.fullName}" berhasil ditambahkan!`,
  };
}

/**
 * Perbarui Data Tutor & Profil
 */
export async function updateTutorAction(input: UpdateTutorInput) {
  const authCheck = await checkPermission("tutor:update");
  if (!authCheck.allowed) {
    return {
      success: false,
      error: "FORBIDDEN: Anda tidak memiliki izin untuk mengubah data tutor.",
    };
  }

  const parsed = updateTutorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const data = parsed.data;
  const supabase = createServerClient();

  // 1. Ambil data tutor yang ada beserta profile_id & user_id
  const { data: tutor, error: fetchError } = await supabase
    .from("tutors")
    .select("id, profile_id, bio, status, gender, profiles(id, user_id, full_name, phone, gender)")
    .eq("id", data.id)
    .maybeSingle();

  if (fetchError || !tutor) {
    return { success: false, error: "Data tutor tidak ditemukan." };
  }

  const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
  const userId = profile?.user_id;

  // 2. Jika email diubah, pastikan tidak duplikat dengan user lain
  if (userId) {
    const { data: userWithEmail } = await supabase
      .from("user")
      .select("id, email")
      .eq("email", data.email)
      .neq("id", userId)
      .maybeSingle();

    if (userWithEmail) {
      return {
        success: false,
        error: `Email "${data.email}" sudah digunakan oleh pengguna lain.`,
      };
    }

    // Perbarui tabel "user"
    await supabase
      .from("user")
      .update({
        name: data.fullName,
        email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  // 3. Perbarui tabel "profiles"
  if (tutor.profile_id) {
    await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone,
        gender: data.gender,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tutor.profile_id);
  }

  // 4. Perbarui tabel "tutors"
  const { error: updateTutorErr } = await supabase
    .from("tutors")
    .update({
      bio: data.bio,
      gender: data.gender,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateTutorErr) {
    console.error("[updateTutorAction] Error update tutor:", updateTutorErr);
    return { success: false, error: "Gagal memperbarui data tutor." };
  }

  // 5. Catat ke audit_logs (AGENTS.md Rule 16)
  await supabase.from("audit_logs").insert({
    user_id: authCheck.user.user.id,
    action: "UPDATE_TUTOR",
    entity_type: "tutors",
    entity_id: data.id,
    metadata: {
      before: {
        full_name: profile?.full_name,
        gender: tutor.gender,
        phone: profile?.phone,
        bio: tutor.bio,
        status: tutor.status,
      },
      after: {
        full_name: data.fullName,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        status: data.status,
      },
    },
  });

  revalidatePath("/management/tutors");
  revalidatePath(`/management/tutors/${data.id}`);

  return {
    success: true,
    message: `Data tutor "${data.fullName}" berhasil diperbarui.`,
  };
}

/**
 * Hapus Data Tutor (Hard delete jika belum ada histori, tolak jika ada jadwal/sesi)
 */
export async function deleteTutorAction(tutorId: string) {
  const authCheck = await checkPermission("tutor:delete");
  if (!authCheck.allowed) {
    return {
      success: false,
      error: "FORBIDDEN: Anda tidak memiliki izin untuk menghapus data tutor.",
    };
  }

  const supabase = createServerClient();

  // 1. Ambil data tutor
  const { data: tutor, error: tutorError } = await supabase
    .from("tutors")
    .select("id, profile_id, status, profiles(id, user_id, full_name)")
    .eq("id", tutorId)
    .maybeSingle();

  if (tutorError || !tutor) {
    return { success: false, error: "Data tutor tidak ditemukan." };
  }

  const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
  const tutorName = profile?.full_name || "Tutor";
  const userId = profile?.user_id;

  // 2. Periksa apakah tutor memiliki relasi aktif di jadwal, sesi, atau payroll
  const [
    { count: scheduleCount },
    { count: sessionCount },
    { count: paymentCount },
  ] = await Promise.all([
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId),
    supabase
      .from("tutor_payments")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId),
  ]);

  const hasHistory =
    (scheduleCount ?? 0) > 0 ||
    (sessionCount ?? 0) > 0 ||
    (paymentCount ?? 0) > 0;

  if (hasHistory) {
    return {
      success: false,
      hasHistory: true,
      error: `Tutor "${tutorName}" memiliki ${sessionCount ?? 0} sesi mengajar, ${scheduleCount ?? 0} jadwal, dan riwayat payroll. Demi integritas data akademik dan honorarium, tutor tidak dapat dihapus permanen. Silakan nonaktifkan status tutor.`,
    };
  }

  // 3. Jika belum memiliki histori relasi sama sekali:
  await supabase.from("tutor_rates").delete().eq("tutor_id", tutorId);

  const { error: delTutorErr } = await supabase
    .from("tutors")
    .delete()
    .eq("id", tutorId);

  if (delTutorErr) {
    console.error("[deleteTutorAction] Gagal menghapus tutor:", delTutorErr);
    return { success: false, error: "Gagal menghapus data tutor." };
  }

  if (tutor.profile_id) {
    await supabase.from("profiles").delete().eq("id", tutor.profile_id);
  }

  if (userId) {
    await supabase.from("user").delete().eq("id", userId);
  }

  // 4. Catat ke audit_logs (AGENTS.md Rule 16)
  await supabase.from("audit_logs").insert({
    user_id: authCheck.user.user.id,
    action: "DELETE_TUTOR",
    entity_type: "tutors",
    entity_id: tutorId,
    metadata: {
      tutor_name: tutorName,
      user_id: userId,
      profile_id: tutor.profile_id,
    },
  });

  revalidatePath("/management/tutors");

  return {
    success: true,
    message: `Data tutor "${tutorName}" dan akun terkait berhasil dihapus permanen.`,
  };
}

/**
 * Reset Password & Kirim Ulang Kredensial Tutor
 */
export async function resendTutorCredentialsAction(input: ResendCredentialsInput) {
  const authCheck = await checkPermission("tutor:update");
  if (!authCheck.allowed) {
    return {
      success: false,
      error: "FORBIDDEN: Anda tidak memiliki izin untuk mereset kredensial tutor.",
    };
  }

  const parsed = resendCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const { tutorId, customPassword, sendEmail } = parsed.data;
  const supabase = createServerClient();

  // 1. Ambil data tutor, profile, dan user
  const { data: tutor, error: fetchErr } = await supabase
    .from("tutors")
    .select("id, profile_id, gender, profiles(id, user_id, full_name, gender)")
    .eq("id", tutorId)
    .maybeSingle();

  if (fetchErr || !tutor) {
    return { success: false, error: "Data tutor tidak ditemukan." };
  }

  const profile = Array.isArray(tutor.profiles) ? tutor.profiles[0] : tutor.profiles;
  if (!profile?.user_id) {
    return { success: false, error: "Akun login tutor tidak ditemukan." };
  }

  const { data: userRow } = await supabase
    .from("user")
    .select("id, email, name")
    .eq("id", profile.user_id)
    .maybeSingle();

  if (!userRow?.email) {
    return { success: false, error: "Alamat email tutor tidak ditemukan." };
  }

  const tutorGender = tutor.gender || profile.gender || "male";

  // 2. Generate password baru
  const rawPassword = (customPassword && customPassword.trim().length >= 6)
    ? customPassword.trim()
    : generateDefaultPassword();

  let hashedPassword: string;
  try {
    hashedPassword = await hashPassword(rawPassword);
  } catch (hashErr) {
    console.error("[resendTutorCredentialsAction] Hashing error:", hashErr);
    return { success: false, error: "Gagal memproses enkripsi password baru." };
  }

  // 3. Perbarui password pada tabel "account"
  const nowIso = new Date().toISOString();
  const { error: accountUpdateErr } = await supabase
    .from("account")
    .update({
      password: hashedPassword,
      updated_at: nowIso,
    })
    .eq("user_id", profile.user_id)
    .eq("provider_id", "credential");

  if (accountUpdateErr) {
    console.error("[resendTutorCredentialsAction] Account update err:", accountUpdateErr);
    return { success: false, error: "Gagal memperbarui password di akun sistem." };
  }

  // 4. Tandai bahwa user wajib ganti password (must_change_password = true)
  if (tutor.profile_id) {
    await supabase
      .from("profiles")
      .update({ must_change_password: true, updated_at: nowIso })
      .eq("id", tutor.profile_id);
  }

  // 5. Kirim email jika diaktifkan
  let emailResult = null;
  if (sendEmail) {
    emailResult = await sendTutorWelcomeEmail({
      tutorName: profile.full_name,
      gender: tutorGender,
      email: userRow.email,
      password: rawPassword,
    });
  }

  // 6. Catat ke audit_logs (AGENTS.md Rule 16)
  await supabase.from("audit_logs").insert({
    user_id: authCheck.user.user.id,
    action: "RESET_TUTOR_PASSWORD",
    entity_type: "tutors",
    entity_id: tutorId,
    metadata: {
      tutor_name: profile.full_name,
      gender: tutorGender,
      email: userRow.email,
      email_sent: emailResult?.success ?? false,
      email_simulated: emailResult?.simulated ?? false,
    },
  });

  return {
    success: true,
    fullName: profile.full_name,
    gender: tutorGender,
    email: userRow.email,
    generatedPassword: rawPassword,
    emailResult,
    message: `Password tutor "${profile.full_name}" berhasil direset!`,
  };
}

/**
 * Toggle Status Aktif / Nonaktif Tutor
 */
export async function updateTutorStatus(id: string, status: "active" | "inactive") {
  const authCheck = await checkPermission("tutor:update");
  if (!authCheck.allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah status tutor." };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("tutors")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal mengubah status tutor." };
  }

  // Catat ke audit_logs
  await supabase.from("audit_logs").insert({
    user_id: authCheck.user.user.id,
    action: "UPDATE_TUTOR_STATUS",
    entity_type: "tutors",
    entity_id: id,
    metadata: { status },
  });

  revalidatePath("/management/tutors");
  revalidatePath(`/management/tutors/${id}`);

  return {
    success: true,
    message: `Status tutor berhasil diubah menjadi ${status === "active" ? "Aktif" : "Nonaktif"}.`,
  };
}

/**
 * Helper: Ambil daftar ringkas tutor aktif untuk dropdown select
 */
export async function getActiveTutorsForSelectAction() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("tutors")
    .select("id, gender, profiles(full_name, gender)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []).map((t) => {
    const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    return {
      id: t.id,
      name: p?.full_name || "Tutor",
      gender: (t.gender || p?.gender || "male") as "male" | "female",
    };
  });
}

