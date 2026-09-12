import { createServerClient } from "@/lib/supabase/server";
import { uploadAttendancePhoto } from "@/lib/storage";

export class AttendanceService {
  static async processAttendanceSubmission(
    sessionId: string,
    studentId: string,
    status: "present" | "absent" | "permission" | "sick" | "late",
    photoBase64?: string | null,
    material?: string | null,
    notes?: string | null,
    userId?: string
  ) {
    const supabase = createServerClient();
    let photoPath: string | null = null;

    if (photoBase64 && photoBase64.startsWith("data:image")) {
      const base64Data = photoBase64.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const uploadResult = await uploadAttendancePhoto(buffer, sessionId, studentId);
      if (uploadResult.path) {
        photoPath = uploadResult.path;
      }
    }

    const { data, error } = await supabase
      .from("attendance")
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          status,
          verification_status: "submitted",
          photo_path: photoPath,
          material: material ?? null,
          notes: notes ?? null,
          checked_in_at: new Date().toISOString(),
          checked_in_by: userId ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "session_id,student_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
