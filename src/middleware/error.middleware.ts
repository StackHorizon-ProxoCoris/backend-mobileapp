// ============================================================
// Middleware — Error Handler Global
// Menangkap semua error yang tidak tertangani
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { config } from '../config/env';

/**
 * Middleware error handler global
 * Menangkap error dari controller dan mengirim response yang konsisten
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  console.error(' Error:', err.message);
  if (config.isDev) {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
    error: config.isDev ? err.message : undefined,
  });
};

/**
 * Middleware untuk menangani route yang tidak ditemukan (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
};
