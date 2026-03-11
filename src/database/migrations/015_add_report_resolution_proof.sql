-- ============================================================
-- SQL Migration — Add proof-of-resolution fields to reports
-- ============================================================

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolution_image_url TEXT;
