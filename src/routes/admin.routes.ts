// ============================================================
// Routes — Admin (Super Admin Only)
// ============================================================

import { Router } from 'express';
import { getUsers, getUserStats, getAnalytics, updateUserRole, toggleUserSuspend } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const router = Router();
const requireAdmin = requireRoles(['admin']);

// GET /api/admin/users — Daftar semua pengguna
router.get('/users', authMiddleware, requireAdmin, getUsers);

// GET /api/admin/users/stats — Statistik pengguna per role
router.get('/users/stats', authMiddleware, requireAdmin, getUserStats);

// GET /api/admin/analytics — Dashboard analitik agregat
router.get('/analytics', authMiddleware, requireAdmin, getAnalytics);

// PATCH /api/admin/users/:id/role — Ubah role user
router.patch('/users/:id/role', authMiddleware, requireAdmin, updateUserRole);

// PATCH /api/admin/users/:id/suspend — Suspend/aktifkan user
router.patch('/users/:id/suspend', authMiddleware, requireAdmin, toggleUserSuspend);

export default router;
