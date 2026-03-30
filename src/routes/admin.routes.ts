// ============================================================
// Routes — Admin (Super Admin Only)
// ============================================================

import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserStats,
  getAnalytics,
  updateUserRole,
  toggleUserSuspend,
  getDashboard,
  getActivityLog,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter } from '../config/rate-limit';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();
const requireAdmin = requireRoles(['admin']);

router.use(authMiddleware, authenticatedGeneralRateLimiter);

// GET /api/admin/dashboard — Ringkasan dashboard admin
router.get('/dashboard', requireAdmin, getDashboard);

// GET /api/admin/activity-log — Log aktivitas sistem
router.get('/activity-log', requireAdmin, getActivityLog);

// GET /api/admin/users — Daftar semua pengguna
router.get('/users', requireAdmin, getUsers);

// POST /api/admin/users — Buat akun baru oleh admin
router.post('/users', requireAdmin, createUser);

// GET /api/admin/users/stats — Statistik pengguna per role
router.get('/users/stats', requireAdmin, getUserStats);

// GET /api/admin/analytics — Dashboard analitik agregat
router.get('/analytics', requireAdmin, getAnalytics);

// PATCH /api/admin/users/:id/role — Ubah role user
router.patch('/users/:id/role', requireAdmin, updateUserRole);

// PATCH /api/admin/users/:id/suspend — Suspend/aktifkan user
router.patch('/users/:id/suspend', requireAdmin, toggleUserSuspend);

export default router;
