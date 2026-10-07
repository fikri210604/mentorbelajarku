import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(
    supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      supabaseKey &&
      !supabaseKey.includes('placeholder')
  );
}

declare global {
  var _supabaseServerClient: ReturnType<typeof createClient<Database>> | undefined;
}

/**
 * Global persistent Supabase client dengan HTTP Keep-Alive connection reuse.
 * Mengurangi overhead inisialisasi client dan TCP connection setup pada setiap request.
 */
export const createServerSupabaseClient = cache(() => {
  if (globalThis._supabaseServerClient) {
    return globalThis._supabaseServerClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  globalThis._supabaseServerClient = client;
  return client;
});

export const createServerClient = createServerSupabaseClient;
