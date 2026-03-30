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
import { authenticatedGeneralRateLimiter, createPublicReadRateLimiter } from '../config/rate-limit';
import { requireGovRole } from '../middleware/role.middleware';
import { validateRequired } from '../middleware/validate.middleware';

const router = Router();
const publicReadRateLimiter = createPublicReadRateLimiter();

// GET /api/reports/stats — Statistik agregasi laporan (harus sebelum /:id)
router.get('/stats', publicReadRateLimiter, getReportStats);

// GET /api/reports/nearby — Laporan terdekat (harus sebelum /:id)
router.get('/nearby', publicReadRateLimiter, getNearbyReports);

// GET /api/reports/map-markers — Marker ringan untuk peta (harus sebelum /:id)
router.get('/map-markers', publicReadRateLimiter, getMapMarkers);

// GET /api/reports — Daftar semua laporan (opsional auth untuk hasVoted)
router.get('/', publicReadRateLimiter, optionalAuthMiddleware, getReports);

// GET /api/reports/:id — Detail laporan (opsional auth untuk hasVoted)
router.get('/:id', publicReadRateLimiter, optionalAuthMiddleware, getReportById);

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// POST /api/reports — Buat laporan baru (perlu login)
router.post(
  '/',
  validateRequired(['category', 'title', 'description', 'address', 'lat', 'lng']),
  createReport
);

// POST /api/reports/:id/vote — Toggle dukungan (perlu login)
router.post('/:id/vote', toggleVote);

// PATCH /api/reports/:id/status — Update status (perlu login, hanya Gov)
router.patch(
  '/:id/status',
  requireGovRole,
  validateRequired(['status']),
  updateReportStatus
);

// PATCH /api/reports/:id/resolve-by-user — Pelapor tutup laporannya sendiri (perlu login)
router.patch('/:id/resolve-by-user', resolveByUser);

// POST /api/reports/:id/verify — Verifikasi laporan (perlu login)
router.post('/:id/verify', verifyReport);

export default router;
