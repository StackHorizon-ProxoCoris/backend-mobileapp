// ============================================================
// Middleware — Autentikasi Token Supabase
// Memverifikasi JWT token dari header Authorization
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse, UserRole } from '../types';

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

    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
      return;
    }

    // Verifikasi token menggunakan Supabase Admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kedaluwarsa.',
      });
      return;
    }

    // Ambil role dari metadata app (single source of truth), fallback ke "user" (least privilege).
    let role: UserRole = 'user';
    const { data: metadata, error: metadataError } = await supabaseAdmin
      .from('users_metadata')
      .select('role')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (metadataError) {
      logger.warn('authMiddleware: gagal mengambil role user, fallback ke role "user".', metadataError.message);
    } else if (metadata?.role && ['user', 'pemerintah', 'admin'].includes(metadata.role)) {
      role = metadata.role as UserRole;
    }

    // Simpan data user di request untuk digunakan controller
    req.user = {
      id: data.user.id,
      email: data.user.email || undefined,
      role,
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

/**
 * Middleware opsional — jika ada token, populate req.user. Jika tidak, lanjut tanpa error.
 * Digunakan di endpoint publik yang butuh info user tapi tidak wajib login (contoh: getReportById → hasVoted).
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      next();
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      next();
      return;
    }

    let role: UserRole = 'user';
    const { data: metadata } = await supabaseAdmin
      .from('users_metadata')
      .select('role')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (metadata?.role && ['user', 'pemerintah', 'admin'].includes(metadata.role)) {
      role = metadata.role as UserRole;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || undefined,
      role,
    };

    next();
  } catch {
    // Token gagal diverifikasi — lanjut tanpa user
    next();
  }
};
