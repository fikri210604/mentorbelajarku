import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// =========================================================================
// Better Auth - Konfigurasi Server
// (Sementara di-guard agar tidak error koneksi database saat mode coba-coba)
// =========================================================================
declare global {
  // eslint-disable-next-line no-var
  var _betterAuthPgPool: Pool | undefined;
}

function getOrCreatePgPool(): Pool | undefined {
  if (!process.env.DATABASE_URL) return undefined;

  if (process.env.NODE_ENV !== 'production' && globalThis._betterAuthPgPool) {
    return globalThis._betterAuthPgPool;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 60000, // Menjaga koneksi hangat selama 60 detik (mencegah TLS handshake berulang)
    max: 10,
    keepAlive: true,
    ssl:
      process.env.NODE_ENV === 'production' ||
      process.env.DATABASE_URL?.includes('supabase') ||
      process.env.DATABASE_URL?.includes('pooler')
        ? { rejectUnauthorized: false }
        : undefined,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalThis._betterAuthPgPool = pool;
  }

  return pool;
}

export const auth = betterAuth({
  database: getOrCreatePgPool(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  user: {
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
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
  session: {
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    // Cache data session di cookie bertanda tangan agar `getSession` tidak
    // menembak database (dan tidak membuka koneksi pg Pool) di setiap request.
    // Trade-off: revokasi session baru berlaku setelah maxAge (5 menit) lewat.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 menit
      strategy: 'compact',
    },
  },
  account: {
    fields: {
      userId: 'user_id',
      accountId: 'account_id',
      providerId: 'provider_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  verification: {
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
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
  advanced: {
    database: {
      validateSchema: false,
    },
  },
});

export type Session = typeof auth.$Infer.Session;