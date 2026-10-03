import { APP_CONFIG } from "@/config/app";

export interface ValidatedImage {
  ok: true;
  mimeType: string;
  buffer: Buffer;
}

export interface InvalidImage {
  ok: false;
  error: string;
}

/**
 * Memperkirakan ukuran byte dari payload base64 tanpa melakukan decode penuh.
 * Base64 memakai ~4 karakter per 3 byte, sehingga ukuran ≈ floor(len * 3 / 4)
 * dikurangi padding. Ini mencegah decode buffer raksasa sebelum validasi ukuran.
 */
export function estimateBase64Bytes(base64: string): number {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/**
 * Mendeteksi tipe gambar dari magic bytes isi file, bukan dari metadata yang
 * dikirim browser (yang dapat dipalsukan).
 */
export function detectImageMimeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Memvalidasi data-URL gambar secara aman:
 * 1. Struktur data-URL (`data:image/...;base64,`).
 * 2. Estimasi ukuran sebelum decode (menolak payload besar lebih awal).
 * 3. Magic bytes setelah decode (menolak file yang menyamar).
 */
export function validateImageDataUrl(
  dataUrl: string,
  maxBytes: number = APP_CONFIG.maxAttendancePhotoSizeBytes
): ValidatedImage | InvalidImage {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return { ok: false, error: "Format foto tidak valid." };
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Format foto tidak valid." };
  }

  const declaredMime = match[1].toLowerCase();
  const base64Data = match[2];

  if (!APP_CONFIG.allowedImageMimeTypes.includes(declaredMime) && declaredMime !== "image/jpg") {
    return { ok: false, error: "Format foto harus JPEG, PNG, atau WebP." };
  }

  const estimatedBytes = estimateBase64Bytes(base64Data);
  if (estimatedBytes > maxBytes) {
    return {
      ok: false,
      error: `Ukuran foto maksimal ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    return { ok: false, error: "Foto tidak dapat dibaca." };
  }

  if (buffer.length > maxBytes) {
    return {
      ok: false,
      error: `Ukuran foto maksimal ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    };
  }

  const detectedMime = detectImageMimeFromMagicBytes(buffer);
  if (!detectedMime) {
    return { ok: false, error: "Konten file bukan gambar JPEG, PNG, atau WebP yang sah." };
  }

  return { ok: true, mimeType: detectedMime, buffer };
}

export function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
