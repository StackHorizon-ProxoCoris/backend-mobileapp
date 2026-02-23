// ============================================================
// Routes — Auth
// ============================================================

import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
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

// POST /api/auth/logout — Logout (perlu token)
router.post('/logout', authMiddleware, logout);

export default router;
