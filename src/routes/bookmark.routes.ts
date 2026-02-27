// ============================================================
// Routes — Bookmarks
// ============================================================

import { Router } from 'express';
import { toggleBookmark, checkBookmark } from '../controllers/bookmark.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/bookmarks/check — Cek bookmark (perlu login)
router.get('/check', authMiddleware, checkBookmark);

// POST /api/bookmarks — Toggle bookmark (perlu login)
router.post('/', authMiddleware, toggleBookmark);

export default router;
