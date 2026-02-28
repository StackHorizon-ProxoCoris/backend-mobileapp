// ============================================================
// Middleware — Role Guard
// Membatasi akses endpoint berdasarkan role user
// ============================================================

import { NextFunction, Request, Response } from 'express';
import { ApiResponse, UserRole } from '../types';

export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
      return;
    }

    const role = req.user.role || 'user';
    if (!roles.includes(role)) {
      res.status(403).json({
        success: false,
        message: 'Akses hanya untuk pemerintah/admin',
      });
      return;
    }

    next();
  };
};

export const requireGovRole = requireRoles(['pemerintah', 'admin']);
