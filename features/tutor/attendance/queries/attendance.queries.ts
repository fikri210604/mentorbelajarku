import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signAttendancePhotoPath } from "@/lib/storage";
import { AttendanceWithDetails } from "../types";

export async function getAttendances(): Promise<AttendanceWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      students (*),
      sessions (
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
  return (data as unknown as AttendanceWithDetails[]) || [];
}

export async function getAttendanceById(id: string): Promise<AttendanceWithDetails | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      students (*),
      sessions (
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const attendance = data as unknown as AttendanceWithDetails;

  // Otorisasi kepemilikan (anti-IDOR): tutor hanya boleh melihat
  // presensi dari sesi yang ditugaskan kepadanya.
  if (user.role === "tutor") {
    const ownerTutorId = attendance.sessions?.tutor_id;
    if (!user.tutorId || ownerTutorId !== user.tutorId) return null;
  }

  // Bucket privat: buat signed URL server-side, bukan URL publik.
  attendance.photo_url = attendance.photo_path
    ? await signAttendancePhotoPath(attendance.photo_path)
    : null;

  return attendance;
}
