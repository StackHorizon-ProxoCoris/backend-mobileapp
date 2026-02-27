// ============================================================
// Routes — Notification
// ============================================================

import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/notifications — Ambil notifikasi user (perlu token)
router.get('/', authMiddleware, getNotifications);

// PATCH /api/notifications/read-all — Tandai semua sudah dibaca
router.patch('/read-all', authMiddleware, markAllAsRead);

// PATCH /api/notifications/:id/read — Tandai satu notifikasi sudah dibaca
router.patch('/:id/read', authMiddleware, markAsRead);

export default router;
