// ============================================================
// Routes — Reports (Laporan Masalah)
// ============================================================

import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  getNearbyReports,
  toggleVote,
  updateReportStatus,
  verifyReport,
} from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/reports/nearby — Laporan terdekat (harus sebelum /:id)
router.get('/nearby', getNearbyReports);

// GET /api/reports — Daftar semua laporan
router.get('/', getReports);

// GET /api/reports/:id — Detail laporan
router.get('/:id', getReportById);

// POST /api/reports — Buat laporan baru (perlu login)
router.post(
  '/',
  authMiddleware,
  validateRequired(['category', 'title', 'description', 'address', 'lat', 'lng']),
  createReport
);

// POST /api/reports/:id/vote — Toggle dukungan (perlu login)
router.post('/:id/vote', authMiddleware, toggleVote);

// PATCH /api/reports/:id/status — Update status (perlu login)
router.patch(
  '/:id/status',
  authMiddleware,
  validateRequired(['status']),
  updateReportStatus
);

// POST /api/reports/:id/verify — Verifikasi laporan (perlu login)
router.post('/:id/verify', authMiddleware, verifyReport);

export default router;
