// ============================================================
// Routes — Area Status (Aggregate Stats)
// ============================================================

import { Router } from 'express';
import { getAreaStatus } from '../controllers/area-status.controller';

const router = Router();

// GET /api/area-status — Status area (publik, tanpa auth)
router.get('/', getAreaStatus);

export default router;
