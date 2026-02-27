-- ============================================================
-- Migration 007: Create notifications table
-- Notifikasi untuk user (laporan status update, komentar baru, dll)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info',
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    ref_type VARCHAR(20),
    ref_id VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query notifikasi user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
