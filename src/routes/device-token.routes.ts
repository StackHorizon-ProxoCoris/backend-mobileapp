// ============================================================
// Routes — Device Token (Push Notification)
// ============================================================

import { Router } from 'express';
import { registerDeviceToken, deactivateDeviceToken } from '../controllers/device-token.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/device-tokens — Simpan/update token push notification (perlu login)
router.post('/', registerDeviceToken);

// DELETE /api/device-tokens — Nonaktifkan token saat logout (perlu login)
router.delete('/', deactivateDeviceToken);

export default router;
