-- ============================================================
-- Migrasi: Buat tabel device_tokens
-- Menyimpan token push notification perangkat pengguna
-- ============================================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL DEFAULT 'android',
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk lookup cepat berdasarkan user_id
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- Indeks untuk lookup berdasarkan token
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
