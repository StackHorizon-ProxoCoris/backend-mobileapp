// ============================================================
// Routes — Feedback
// ============================================================

import { Router } from 'express';
import { createFeedback } from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/feedback — Kirim feedback (perlu token)
router.post('/', authMiddleware, createFeedback);

export default router;
