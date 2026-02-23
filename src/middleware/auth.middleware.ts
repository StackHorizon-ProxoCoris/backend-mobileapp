// ============================================================
// Middleware — Autentikasi Token Supabase
// Memverifikasi JWT token dari header Authorization
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

// Extend Express Request untuk menyimpan data user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware untuk memverifikasi token Supabase Auth
 * Mengambil token dari header: Authorization: Bearer <token>
 */
export const authMiddleware = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verifikasi token menggunakan Supabase Admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kedaluwarsa.',
        error: error?.message,
      });
      return;
    }

    // Simpan data user di request untuk digunakan controller
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
    };

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi token.',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};
