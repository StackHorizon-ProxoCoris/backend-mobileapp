// ============================================================
// Routes — BMKG Data
// Endpoint publik untuk data gempa terkini
// ============================================================

import { Router } from 'express';
import { getGempaTerkini } from '../controllers/bmkg.controller';
import { createBmkgRateLimiter } from '../config/rate-limit';

const router = Router();
const bmkgRateLimiter = createBmkgRateLimiter();

router.use(bmkgRateLimiter);

// GET /api/bmkg/gempa-terkini — Data gempa terbaru dari BMKG
router.get('/gempa-terkini', getGempaTerkini);

export default router;
