// ============================================================
// Routes — Device Token (Push Notification)
// ============================================================

import { Router } from 'express';
import { registerDeviceToken, deactivateDeviceToken } from '../controllers/device-token.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/device-tokens — Simpan/update token push notification (perlu login)
router.post('/', authMiddleware, registerDeviceToken);

// DELETE /api/device-tokens — Nonaktifkan token saat logout (perlu login)
router.delete('/', authMiddleware, deactivateDeviceToken);

export default router;
