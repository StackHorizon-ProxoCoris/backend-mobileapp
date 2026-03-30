// ============================================================
// Routes — Auth
// ============================================================

import { Router } from 'express';
import { register, login, refreshSession, getMe, updateProfile, logout, updateSettings, changePassword, forgotPassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequired, validateEmail, validatePassword } from '../middleware/validate.middleware';
import { authenticatedGeneralRateLimiter, createAuthRefreshRateLimiter, createPublicAuthRateLimiter } from '../config/rate-limit';

const router = Router();
const publicAuthRateLimiter = createPublicAuthRateLimiter();
const authRefreshRateLimiter = createAuthRefreshRateLimiter();
const protectedAuthRouteMiddleware = [authMiddleware, authenticatedGeneralRateLimiter] as const;

// POST /api/auth/register — Daftar akun baru
router.post(
  '/register',
  publicAuthRateLimiter,
  validateRequired(['email', 'password', 'fullName']),
  validateEmail,
  validatePassword(6),
  register
);

// POST /api/auth/login — Login
router.post(
  '/login',
  publicAuthRateLimiter,
  validateRequired(['email', 'password']),
  validateEmail,
  login
);

// POST /api/auth/refresh — Perbarui session menggunakan refresh token
router.post(
  '/refresh',
  authRefreshRateLimiter,
  validateRequired(['refreshToken']),
  refreshSession
);

// GET /api/auth/me — Ambil profil user (perlu token)
router.get('/me', ...protectedAuthRouteMiddleware, getMe);

// PATCH /api/auth/profile — Update profil user (perlu token)
router.patch('/profile', ...protectedAuthRouteMiddleware, updateProfile);

// PATCH /api/auth/settings — Update settings user (perlu token)
router.patch('/settings', ...protectedAuthRouteMiddleware, updateSettings);

// POST /api/auth/change-password — Ubah password (perlu token)
router.post('/change-password', ...protectedAuthRouteMiddleware, validateRequired(['currentPassword', 'newPassword']), changePassword);

// POST /api/auth/logout — Logout (perlu token)
router.post('/logout', ...protectedAuthRouteMiddleware, logout);

// POST /api/auth/forgot-password — Kirim email reset password (tidak perlu login)
router.post('/forgot-password', publicAuthRateLimiter, validateRequired(['email']), validateEmail, forgotPassword);

export default router;
