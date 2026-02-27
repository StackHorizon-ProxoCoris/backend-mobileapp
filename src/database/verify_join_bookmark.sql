-- ============================================================
-- Migration: Tables for Verify, Join Action, and Bookmarks
-- ============================================================

-- Report Verifications
CREATE TABLE IF NOT EXISTS report_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Action Participants
CREATE TABLE IF NOT EXISTS action_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(action_id, user_id)
);

-- Bookmarks (polymorphic: report, action, info)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ref_type VARCHAR(20) NOT NULL CHECK (ref_type IN ('report', 'action', 'info')),
  ref_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ref_type, ref_id)
);
