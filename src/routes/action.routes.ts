// ============================================================
// Routes — Actions (Aksi Positif)
// ============================================================

import { Router } from 'express';
import { createAction, getActions, getActionById } from '../controllers/action.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/actions — Daftar semua aksi
router.get('/', getActions);

// GET /api/actions/:id — Detail aksi
router.get('/:id', getActionById);

// POST /api/actions — Buat aksi baru (perlu login)
router.post(
  '/',
  authMiddleware,
  validateRequired(['category', 'title', 'description', 'address']),
  createAction
);

export default router;
