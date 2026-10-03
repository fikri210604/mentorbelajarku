import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signAttendancePhotoPath } from "@/lib/storage";
import { AttendanceWithDetails } from "../types";

/**
 * Selective column projections untuk data absensi dan relasi murid + sesi.
 * Menghindari penarikan data berlebih (SELECT *) dari 5 tabel terelasi.
 */
const ATTENDANCE_SELECT_COLUMNS = `
  id,
  session_id,
  student_id,
  enrollment_id,
  status,
  verification_status,
  photo_path,
  notes,
  checked_in_at,
  checked_in_by,
  verified_at,
  verified_by,
  created_at,
  updated_at,
  learning_records (
    id,
    material,
    notes
  ),
  students (
    id,
    student_code,
    name,
    school,
    grade,
    status
  ),
  sessions (
    id,
    session_date,
    start_time,
    end_time,
    status,
    tutor_id,
    program_id,
    bimbel_type_id,
    tutors (
      id,
      profile_id,
      profiles (
        id,
        user_id,
        full_name,
        phone,
        avatar_url
      )
    ),
    programs (
      id,
      code,
      name,
      level
    ),
    bimbel_types (
      id,
      name,
      duration_minutes
    )
  )
`;

/** Menurunkan materi dari relasi learning_records untuk kebutuhan tampilan. */
function withMaterial(
  row: unknown
): AttendanceWithDetails {
  const record = row as AttendanceWithDetails & {
    learning_records?: { material?: string | null } | { material?: string | null }[] | null;
  };
  const lr = record.learning_records;
  const first = Array.isArray(lr) ? lr[0] : lr;
  return { ...record, material: first?.material ?? null };
}

export const getAttendances = cache(async (limit: number = 100): Promise<AttendanceWithDetails[]> => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("attendance")
      .select(ATTENDANCE_SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }
    return ((data as unknown as AttendanceWithDetails[]) || []).map(withMaterial);
  } catch (err) {
    console.error("getAttendances catch error:", err);
    return [];
  }
});

export async function getAttendanceById(id: string): Promise<AttendanceWithDetails | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("attendance")
      .select(ATTENDANCE_SELECT_COLUMNS)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    const attendance = withMaterial(data);

    // Tutor yang menembus layout hanya boleh melihat presensi sesinya sendiri.
    if (user.role === "tutor") {
      const ownerTutorId = attendance.sessions?.tutor_id;
      if (!user.tutorId || ownerTutorId !== user.tutorId) return null;
    }

    // Bucket privat: buat signed URL server-side, bukan URL publik.
    attendance.photo_url = attendance.photo_path
      ? await signAttendancePhotoPath(attendance.photo_path)
      : null;

    return attendance;
  } catch (err) {
    console.error("getAttendanceById catch error:", err);
    return null;
  }
}
