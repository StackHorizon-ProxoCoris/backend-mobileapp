-- ============================================================
-- Migrasi 016: Tambah kolom avatar_url ke users_metadata
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE users_metadata
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

COMMENT ON COLUMN users_metadata.avatar_url IS 'URL foto profil user dari Supabase Storage';
