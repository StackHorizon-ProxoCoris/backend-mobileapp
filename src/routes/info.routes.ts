// ============================================================
// Routes — Info & Edukasi (Articles)
// ============================================================

import { Router } from 'express';
import { getInfoList, getInfoById } from '../controllers/info.controller';

const router = Router();

// GET /api/info — Daftar artikel (publik)
router.get('/', getInfoList);

// GET /api/info/:id — Detail artikel (publik, increment views)
router.get('/:id', getInfoById);

export default router;
