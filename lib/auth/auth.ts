import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// =========================================================================
// Better Auth - Konfigurasi Server
// (Sementara di-guard agar tidak error koneksi database saat mode coba-coba)
// =========================================================================
export const auth = betterAuth({
  database: process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production' ||
          process.env.DATABASE_URL?.includes('supabase') ||
          process.env.DATABASE_URL?.includes('pooler')
            ? { rejectUnauthorized: false }
            : undefined,
      })
    : undefined,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      verify: async ({ hash, password }) => {
        // 1. Dukungan password bawaan database (plaintext default 'manajemen123' & 'mentor123')
        if (hash === password) {
          return true;
        }
        // 2. Verifikasi hash standar scrypt Better Auth
        try {
          const { verifyPassword } = await import('@better-auth/utils/password');
          return await verifyPassword(hash, password);
        } catch {
          return false;
        }
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'tutor',
        input: false,
      },
    },
    rateLimit: {
      window: 60 * 60 * 1000, // 1 jam
      max: 100,
    },
  },
});

export type Session = typeof auth.$Infer.Session;