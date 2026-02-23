-- ============================================================
-- SQL Migration — Tabel comments (Komentar Polymorphic)
-- Bisa dipakai untuk report maupun action
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Target polymorphic: bisa report atau action
  target_id UUID NOT NULL,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('report', 'action')),

  -- Konten
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Komentar bisa dibaca semua orang"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "User bisa buat komentar"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa edit komentar sendiri"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User bisa hapus komentar sendiri"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role akses penuh comments"
  ON comments FOR ALL
  USING (auth.role() = 'service_role');
