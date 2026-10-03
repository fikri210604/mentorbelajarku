import { estimateBase64Bytes } from './image-validation';

/**
 * Image Compression Utility (Client-Side)
 * Mengompresi file foto atau data-URL secara efisien di browser menggunakan HTML5 Canvas.
 * Mencegah pengunggahan gambar raksasa (5MB-20MB) dari kamera smartphone modern
 * dan menguranginya menjadi ~100KB-300KB dengan tetap menjaga kualitas dan ketajaman visual.
 */

export interface ImageCompressionOptions {
  /** Lebar maksimal dalam pixel. Default: 1280 */
  maxWidth?: number;
  /** Tinggi maksimal dalam pixel. Default: 1280 */
  maxHeight?: number;
  /** Kualitas kompresi 0.1 - 1.0. Default: 0.8 */
  quality?: number;
  /** Target batas ukuran byte maksimal. Default: 400 * 1024 (400 KB) */
  maxSizeBytes?: number;
  /** Format MIME target output ('image/jpeg' atau 'image/webp'). Default: 'image/jpeg' */
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface CompressedImageResult {
  /** Base64 Data URL hasil kompresi (siap disimpan / dikirim ke server action) */
  dataUrl: string;
  /** Ukuran hasil kompresi dalam byte */
  sizeBytes: number;
  /** Ukuran file asli sebelum kompresi dalam byte */
  originalSizeBytes: number;
  /** Lebar akhir pixel gambar */
  width: number;
  /** Tinggi akhir pixel gambar */
  height: number;
  /** MIME type hasil kompresi */
  mimeType: string;
  /** Rasio penghematan (misal 0.85 = 85% ukuran terkompresi lebih kecil) */
  compressionRatio: number;
}

/**
 * Format bytes menjadi satuan yang mudah dibaca pengguna (B, KB, MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Mengubah data URL base64 menjadi Blob objek.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const base64Str = parts[1] || '';
  const binaryStr = atob(base64Str);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Internal helper untuk merender elemen Image ke Canvas dan menghasilkan DataURL terkompresi.
 */
function compressHtmlImage(
  img: HTMLImageElement,
  options: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    maxSizeBytes: number;
    mimeType: 'image/jpeg' | 'image/webp';
    originalSizeBytes: number;
  }
): CompressedImageResult {
  const { maxWidth, maxHeight, quality, maxSizeBytes, mimeType, originalSizeBytes } = options;

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Dimensi gambar tidak valid atau bernilai 0.');
  }

  // Hitung penskalaan dengan mempertahankan aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi canvas 2D rendering context.');
  }

  // Jika format JPEG, isi latar dengan warna putih agar area transparan (PNG) tidak menjadi hitam pekat
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Kompresi awal
  let currentQuality = Math.min(Math.max(quality, 0.1), 1.0);
  let dataUrl = canvas.toDataURL(mimeType, currentQuality);
  let base64Part = dataUrl.split(',')[1] || '';
  let sizeBytes = estimateBase64Bytes(base64Part);

  // Loop penyesuaian kualitas adaptif jika ukuran masih melebihi target maxSizeBytes (batas min 0.5)
  while (sizeBytes > maxSizeBytes && currentQuality > 0.5) {
    currentQuality = Math.max(0.5, currentQuality - 0.08);
    dataUrl = canvas.toDataURL(mimeType, currentQuality);
    base64Part = dataUrl.split(',')[1] || '';
    sizeBytes = estimateBase64Bytes(base64Part);
  }

  const compressionRatio =
    originalSizeBytes > 0
      ? Math.max(0, (originalSizeBytes - sizeBytes) / originalSizeBytes)
      : 0;

  return {
    dataUrl,
    sizeBytes,
    originalSizeBytes,
    width,
    height,
    mimeType,
    compressionRatio,
  };
}

/**
 * Mengompresi file foto (File atau Blob) langsung dari input galeri / dokumen.
 */
export async function compressImageFile(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Kompresi gambar hanya dapat dijalankan di browser (client-side).');
  }

  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    maxSizeBytes = 400 * 1024,
    mimeType = 'image/jpeg',
  } = options;

  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const result = compressHtmlImage(img, {
          maxWidth,
          maxHeight,
          quality,
          maxSizeBytes,
          mimeType,
          originalSizeBytes,
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca file gambar. Pastikan format file adalah foto yang sah.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Mengompresi data URL base64 (misal dari hasil tangkapan webcam/react-webcam).
 */
export async function compressImageDataUrl(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Kompresi gambar hanya dapat dijalankan di browser (client-side).');
  }

  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    maxSizeBytes = 400 * 1024,
    mimeType = 'image/jpeg',
  } = options;

  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const originalSizeBytes = estimateBase64Bytes(base64Data);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const result = compressHtmlImage(img, {
          maxWidth,
          maxHeight,
          quality,
          maxSizeBytes,
          mimeType,
          originalSizeBytes,
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Gagal memuat data gambar URL.'));
    };

    img.src = dataUrl;
  });
}
