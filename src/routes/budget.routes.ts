// ============================================================
// Routes — Budget
// ============================================================

import { Router } from 'express';
import { getBudgetProjects, getBudgetDinas } from '../controllers/budget.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireGovRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/budget/projects — Daftar proyek anggaran
router.get('/projects', authMiddleware, requireGovRole, getBudgetProjects);

// GET /api/budget/dinas — Serapan per dinas
router.get('/dinas', authMiddleware, requireGovRole, getBudgetDinas);

export default router;
