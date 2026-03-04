// ============================================================
// Routes — Reports (Laporan Masalah)
// ============================================================

import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  getReportStats,
  getMapMarkers,
  getNearbyReports,
  toggleVote,
  updateReportStatus,
  verifyReport,
  resolveByUser,
} from '../controllers/report.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { requireGovRole } from '../middleware/role.middleware';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();

// GET /api/reports/stats — Statistik agregasi laporan (harus sebelum /:id)
router.get('/stats', getReportStats);

// GET /api/reports/nearby — Laporan terdekat (harus sebelum /:id)
router.get('/nearby', getNearbyReports);

// GET /api/reports/map-markers — Marker ringan untuk peta (harus sebelum /:id)
router.get('/map-markers', getMapMarkers);

// GET /api/reports — Daftar semua laporan (opsional auth untuk hasVoted)
router.get('/', optionalAuthMiddleware, getReports);

// GET /api/reports/:id — Detail laporan (opsional auth untuk hasVoted)
router.get('/:id', optionalAuthMiddleware, getReportById);

// POST /api/reports — Buat laporan baru (perlu login)
router.post(
  '/',
  authMiddleware,
  validateRequired(['category', 'title', 'description', 'address', 'lat', 'lng']),
  createReport
);

// POST /api/reports/:id/vote — Toggle dukungan (perlu login)
router.post('/:id/vote', authMiddleware, toggleVote);

// PATCH /api/reports/:id/status — Update status (perlu login, hanya Gov)
router.patch(
  '/:id/status',
  authMiddleware,
  requireGovRole,
  validateRequired(['status']),
  updateReportStatus
);

// PATCH /api/reports/:id/resolve-by-user — Pelapor tutup laporannya sendiri (perlu login)
router.patch('/:id/resolve-by-user', authMiddleware, resolveByUser);

// POST /api/reports/:id/verify — Verifikasi laporan (perlu login)
router.post('/:id/verify', authMiddleware, verifyReport);

export default router;
