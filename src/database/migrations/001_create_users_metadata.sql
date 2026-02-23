-- ============================================================
-- SQL Migration — Tabel users_metadata
-- Jalankan di Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Tabel untuk menyimpan metadata user tambahan
-- Data auth (email, password) dikelola oleh Supabase Auth
-- Tabel ini menyimpan data spesifik aplikasi SIAGA
CREATE TABLE IF NOT EXISTS users_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informasi Profil
  full_name VARCHAR(100) NOT NULL,
  initials VARCHAR(4) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  bio TEXT DEFAULT '',
  
  -- Lokasi
  district VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  province VARCHAR(100) DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Gamifikasi
  eco_points INTEGER DEFAULT 0,
  current_badge VARCHAR(50) DEFAULT 'Warga Baru',
  total_reports INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat berdasarkan auth_id
CREATE INDEX IF NOT EXISTS idx_users_metadata_auth_id ON users_metadata(auth_id);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_metadata_updated_at
  BEFORE UPDATE ON users_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- User hanya bisa membaca dan mengubah data miliknya sendiri
-- ============================================================

ALTER TABLE users_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa membaca data sendiri
CREATE POLICY "User bisa baca profil sendiri"
  ON users_metadata
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Policy: User bisa mengubah data sendiri
CREATE POLICY "User bisa ubah profil sendiri"
  ON users_metadata
  FOR UPDATE
  USING (auth.uid() = auth_id);

-- Policy: Service role bisa melakukan semua operasi (untuk backend)
CREATE POLICY "Service role akses penuh"
  ON users_metadata
  FOR ALL
  USING (auth.role() = 'service_role');
