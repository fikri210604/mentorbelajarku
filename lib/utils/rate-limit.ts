/**
 * Rate limiter in-memory sederhana (sliding window) untuk melindungi endpoint
 * sensitif (login, upload, submit, generate) dari penyalahgunaan.
 *
 * Catatan: implementasi ini per-proses. Pada deployment multi-instance,
 * gunakan store bersama (mis. Redis/Upstash) agar konsisten. Baseline ini
 * tetap memberi perlindungan dasar pada satu instance.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Kunci unik, mis. `login:{ip}`. */
  key: string;
  /** Jumlah maksimum request dalam jendela. */
  limit: number;
  /** Durasi jendela dalam milidetik. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Mengambil identitas client untuk key rate limit dari header proxy umum.
 */
export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Membersihkan bucket kedaluwarsa (dipanggil berkala bila perlu). */
export function pruneRateLimitBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}
