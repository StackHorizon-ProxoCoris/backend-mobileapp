// ============================================================
// Routes — Chat
// ============================================================

import { Router } from 'express';
import { processChat } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/chat — Kirim pesan ke AI (perlu token)
router.post('/', processChat);

export default router;
