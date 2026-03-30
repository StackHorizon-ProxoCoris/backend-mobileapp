// ============================================================
// Routes — Feedback
// ============================================================

import { Router } from 'express';
import { createFeedback } from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/feedback — Kirim feedback (perlu token)
router.post('/', createFeedback);

export default router;
