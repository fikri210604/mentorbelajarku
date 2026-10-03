import { createServerClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/config/app";

/**
 * Bucket privat tunggal untuk seluruh foto presensi.
 * Mengikuti docs/DESIGN.md: `attendance/{year}/{month}/{session_id}/{student_id}.jpg`.
 */
export const ATTENDANCE_BUCKET = "attendance";

export interface UploadPhotoResult {
  path: string;
  error?: string;
}

export async function uploadAttendancePhoto(
  file: Blob | Buffer,
  sessionId: string,
  studentId: string,
  contentType: string = "image/jpeg"
): Promise<UploadPhotoResult> {
  const supabase = createServerClient();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const path = `${year}/${month}/${sessionId}/${studentId}.jpg`;

  const { error } = await supabase.storage
    .from(ATTENDANCE_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path };
}

/**
 * Menandatangani path foto. JANGAN panggil fungsi ini dengan path sembarang
 * yang berasal dari client. Caller wajib lebih dulu mengotorisasi akses ke
 * attendance/session terkait (lihat getAuthorizedAttendancePhotoUrl).
 */
export async function signAttendancePhotoPath(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createServerClient();
  const { data } = await supabase.storage
    .from(ATTENDANCE_BUCKET)
    .createSignedUrl(path, 3600); // 1 jam

  return data?.signedUrl ?? null;
}

/**
 * Validasi metadata dasar (size + mime). Validasi final wajib memakai magic
 * bytes pada isi file (lib/utils/image-validation.ts).
 */
export function validateAttendancePhoto(
  size: number,
  mimeType: string
): { valid: boolean; error?: string } {
  if (size > APP_CONFIG.maxAttendancePhotoSizeBytes) {
    return { valid: false, error: "Ukuran foto melebihi batas 5MB" };
  }
  if (!APP_CONFIG.allowedImageMimeTypes.includes(mimeType)) {
    return { valid: false, error: "Format foto harus JPG, PNG, atau WebP" };
  }
  return { valid: true };
}
