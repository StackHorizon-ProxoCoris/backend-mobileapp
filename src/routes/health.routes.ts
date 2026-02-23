// ============================================================
// Routes — Health Check
// Endpoint sederhana untuk cek status server
// ============================================================

import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/health — Cek status server
router.get('/', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: 'SIAGA Backend berjalan dengan baik! ',
    data: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
