import { createServerClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/config/app";

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

  const path = `attendance/${year}/${month}/${sessionId}/${studentId}.jpg`;

  const { error } = await supabase.storage
    .from("attendance-photos")
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path };
}

export async function getAttendancePhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createServerClient();
  const { data } = await supabase.storage
    .from("attendance-photos")
    .createSignedUrl(path, 3600); // 1 hour signed URL

  return data?.signedUrl ?? null;
}

export function validateAttendancePhoto(size: number, mimeType: string): { valid: boolean; error?: string } {
  if (size > APP_CONFIG.maxAttendancePhotoSizeBytes) {
    return { valid: false, error: "Ukuran foto melebihi batas 5MB" };
  }
  if (!APP_CONFIG.allowedImageMimeTypes.includes(mimeType)) {
    return { valid: false, error: "Format foto harus JPG, PNG, atau WebP" };
  }
  return { valid: true };
}
