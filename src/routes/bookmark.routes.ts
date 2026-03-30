// ============================================================
// Routes — Bookmarks
// ============================================================

import { Router } from 'express';
import { toggleBookmark, checkBookmark } from '../controllers/bookmark.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';

const router = Router();

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// GET /api/bookmarks/check — Cek bookmark (perlu login)
router.get('/check', checkBookmark);

// POST /api/bookmarks — Toggle bookmark (perlu login)
router.post('/', toggleBookmark);

export default router;
