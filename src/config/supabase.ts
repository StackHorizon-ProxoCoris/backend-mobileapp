// ============================================================
// Konfigurasi Supabase Client
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  // Logger belum bisa dipakai di sini karena circular, pakai console langsung
  console.error('\x1b[31m[ERROR]\x1b[0m SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SUPABASE_ANON_KEY wajib diisi di .env');
  process.exit(1);
}

// Client dengan service_role key — akses penuh, hanya dipakai di backend
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client dengan anon key — akses terbatas, untuk verifikasi token user
export const supabasePublic: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export { supabaseUrl, supabaseAnonKey };
