-- ============================================================
-- Migration 014: Add gov-specific profile fields
-- Fields for government users (NIP, jabatan, instansi, etc.)
-- ============================================================

ALTER TABLE users_metadata
  ADD COLUMN IF NOT EXISTS nip TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS jabatan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instansi TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unit_kerja TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS golongan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tmt TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users_metadata.nip IS 'Nomor Induk Pegawai — unique gov employee ID';
COMMENT ON COLUMN users_metadata.jabatan IS 'Jabatan / Position title';
COMMENT ON COLUMN users_metadata.instansi IS 'Instansi / Government agency name';
COMMENT ON COLUMN users_metadata.unit_kerja IS 'Unit Kerja / Department within agency';
COMMENT ON COLUMN users_metadata.golongan IS 'Golongan / Civil service rank (e.g. III/d)';
COMMENT ON COLUMN users_metadata.tmt IS 'TMT / Terhitung Mulai Tanggal (service start date)';
