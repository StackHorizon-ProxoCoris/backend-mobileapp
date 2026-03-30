// ============================================================
// Routes — Notification
// ============================================================

import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// GET /api/notifications — Ambil notifikasi user (perlu token)
router.get('/', getNotifications);

// PATCH /api/notifications/read-all — Tandai semua sudah dibaca
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read — Tandai satu notifikasi sudah dibaca
router.patch('/:id/read', markAsRead);

export default router;
