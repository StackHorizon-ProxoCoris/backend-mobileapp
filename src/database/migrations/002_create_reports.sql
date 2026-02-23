-- ============================================================
-- SQL Migration — Tabel reports (Laporan Masalah)
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Klasifikasi
  category VARCHAR(50) NOT NULL,           -- Bencana Alam, Infrastruktur, Lingkungan, dll
  type VARCHAR(30) NOT NULL DEFAULT 'Waves', -- Icon type: Waves, RoadHorizon, Trash, Mountains, Fire

  -- Konten
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  -- Lokasi
  address VARCHAR(300) NOT NULL,
  district VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT 'Kota Bandung',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,

  -- Status & Urgensi
  status VARCHAR(20) DEFAULT 'Menunggu'
    CHECK (status IN ('Menunggu', 'Diverifikasi', 'Ditangani', 'Selesai')),
  urgency INTEGER DEFAULT 0,

  -- Counter (di-update via trigger atau aplikasi)
  votes_count INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  photos_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Penanganan
  responded_by VARCHAR(200),
  estimated_completion TIMESTAMPTZ,

  -- Foto (URL dari Supabase Storage)
  photo_urls TEXT[] DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query performa
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Index geospasial untuk nearby query
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(lat, lng);

-- Trigger auto-update updated_at
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Semua user bisa membaca laporan (publik)
CREATE POLICY "Laporan bisa dibaca semua orang"
  ON reports FOR SELECT
  USING (true);

-- User hanya bisa membuat laporan atas nama sendiri
CREATE POLICY "User bisa buat laporan sendiri"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa edit laporan sendiri
CREATE POLICY "User bisa edit laporan sendiri"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

-- User hanya bisa hapus laporan sendiri
CREATE POLICY "User bisa hapus laporan sendiri"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- Service role akses penuh
CREATE POLICY "Service role akses penuh reports"
  ON reports FOR ALL
  USING (auth.role() = 'service_role');
