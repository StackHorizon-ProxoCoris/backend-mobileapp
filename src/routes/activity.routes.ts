// ============================================================
// Routes — Activity (User Activity History)
// ============================================================

import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/activities — Riwayat aktivitas user (perlu token)
router.get('/', authMiddleware, getActivities);

export default router;
