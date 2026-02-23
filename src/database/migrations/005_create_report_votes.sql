-- ============================================================
-- SQL Migration — Tabel report_votes (Dukungan Laporan)
-- Mencegah user mendukung laporan yang sama dua kali
-- ============================================================

CREATE TABLE IF NOT EXISTS report_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: satu user hanya bisa vote satu kali per laporan
  UNIQUE (user_id, report_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_report_votes_report ON report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_user ON report_votes(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vote bisa dibaca semua orang"
  ON report_votes FOR SELECT
  USING (true);

CREATE POLICY "User bisa vote"
  ON report_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa un-vote sendiri"
  ON report_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role akses penuh votes"
  ON report_votes FOR ALL
  USING (auth.role() = 'service_role');
