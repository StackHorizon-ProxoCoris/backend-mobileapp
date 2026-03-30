// ============================================================
// Routes — Actions (Aksi Positif)
// ============================================================

import { Router } from 'express';
import { createAction, getActions, getActionById, joinAction, leaveAction } from '../controllers/action.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/actions — Daftar semua aksi
router.get('/', getActions);

// GET /api/actions/:id — Detail aksi
router.get('/:id', getActionById);

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/actions — Buat aksi baru (perlu login)
router.post(
  '/',
  validateRequired(['category', 'title', 'description', 'address']),
  createAction
);

// POST /api/actions/:id/join — Gabung aksi (perlu login)
router.post('/:id/join', joinAction);

// DELETE /api/actions/:id/join — Keluar aksi (perlu login)
router.delete('/:id/join', leaveAction);

export default router;
