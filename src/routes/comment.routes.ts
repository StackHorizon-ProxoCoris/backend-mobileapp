// ============================================================
// Routes — Comments (Komentar)
// ============================================================

import { Router } from 'express';
import { addComment, getComments } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/comments/:targetType/:targetId — Daftar komentar
router.get('/:targetType/:targetId', getComments);

// POST /api/comments — Tambah komentar (perlu login)
router.post(
  '/',
  authMiddleware,
  validateRequired(['targetId', 'targetType', 'text']),
  addComment
);

export default router;
