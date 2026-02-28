// ============================================================
// Routes — Auth
// ============================================================

import { Router } from 'express';
import { register, login, getMe, updateProfile, logout, updateSettings, changePassword, forgotPassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequired, validateEmail, validatePassword } from '../middleware/validate.middleware';

const router = Router();

// POST /api/auth/register — Daftar akun baru
router.post(
  '/register',
  validateRequired(['email', 'password', 'fullName']),
  validateEmail,
  validatePassword(6),
  register
);

// POST /api/auth/login — Login
router.post(
  '/login',
  validateRequired(['email', 'password']),
  validateEmail,
  login
);

// GET /api/auth/me — Ambil profil user (perlu token)
router.get('/me', authMiddleware, getMe);

// PATCH /api/auth/profile — Update profil user (perlu token)
router.patch('/profile', authMiddleware, updateProfile);

// PATCH /api/auth/settings — Update settings user (perlu token)
router.patch('/settings', authMiddleware, updateSettings);

// POST /api/auth/change-password — Ubah password (perlu token)
router.post('/change-password', authMiddleware, validateRequired(['currentPassword', 'newPassword']), changePassword);

// POST /api/auth/logout — Logout (perlu token)
router.post('/logout', authMiddleware, logout);

// POST /api/auth/forgot-password — Kirim email reset password (tidak perlu login)
router.post('/forgot-password', validateRequired(['email']), validateEmail, forgotPassword);

export default router;
