// ============================================================
// Routes — BMKG Data
// Endpoint publik untuk data gempa terkini
// ============================================================

import { Router } from 'express';
import { getGempaTerkini } from '../controllers/bmkg.controller';

const router = Router();

// GET /api/bmkg/gempa-terkini — Data gempa terbaru dari BMKG
router.get('/gempa-terkini', getGempaTerkini);

export default router;
