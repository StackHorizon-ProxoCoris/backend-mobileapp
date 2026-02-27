// ============================================================
// Routes — Chat
// ============================================================

import { Router } from 'express';
import { processChat } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/chat — Kirim pesan ke AI (perlu token)
router.post('/', authMiddleware, processChat);

export default router;
