// ============================================================
// Routes — Budget
// ============================================================

import { Router } from 'express';
import { getBudgetProjects, getBudgetDinas } from '../controllers/budget.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/budget/projects — Daftar proyek anggaran
router.get('/projects', authMiddleware, getBudgetProjects);

// GET /api/budget/dinas — Serapan per dinas
router.get('/dinas', authMiddleware, getBudgetDinas);

export default router;
