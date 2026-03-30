// ============================================================
// Routes — Activity (User Activity History)
// ============================================================

import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// GET /api/activities — Riwayat aktivitas user (perlu token)
router.get('/', getActivities);

export default router;
