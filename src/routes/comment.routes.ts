// ============================================================
// Routes — Comments (Komentar)
// ============================================================

import { Router } from 'express';
import { addComment, getComments } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/comments/:targetType/:targetId — Daftar komentar
router.get('/:targetType/:targetId', getComments);

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/comments — Tambah komentar (perlu login)
router.post(
  '/',
  validateRequired(['targetId', 'targetType', 'text']),
  addComment
);

export default router;
