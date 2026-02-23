-- ============================================================
-- SQL Migration — Tabel actions (Aksi Positif)
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Klasifikasi
  category VARCHAR(50) NOT NULL,           -- Lingkungan, Infrastruktur, Penghijauan, dll
  type VARCHAR(30) NOT NULL DEFAULT 'Plant', -- Icon type: Plant, RoadHorizon, Tree, Trash, dll

  -- Konten
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  -- Lokasi
  address VARCHAR(300) NOT NULL,
  district VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT 'Kota Bandung',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  -- Detail Kegiatan
  status VARCHAR(20) DEFAULT 'Terjadwal'
    CHECK (status IN ('Terjadwal', 'Berlangsung', 'Selesai')),
  date VARCHAR(50),
  duration VARCHAR(100),
  points INTEGER DEFAULT 0,

  -- Partisipan
  max_participants INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,

  -- Verifikasi
  verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(200),

  -- Counter
  comments_count INTEGER DEFAULT 0,

  -- Foto
  photo_urls TEXT[] DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_category ON actions(category);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);

-- Trigger auto-update updated_at
CREATE TRIGGER trigger_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aksi bisa dibaca semua orang"
  ON actions FOR SELECT
  USING (true);

CREATE POLICY "User bisa buat aksi sendiri"
  ON actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa edit aksi sendiri"
  ON actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User bisa hapus aksi sendiri"
  ON actions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role akses penuh actions"
  ON actions FOR ALL
  USING (auth.role() = 'service_role');
