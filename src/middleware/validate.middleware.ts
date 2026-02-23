// ============================================================
// Middleware — Validator Request Body
// Validasi input sebelum masuk controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validasi field wajib di request body
 * @param fields - Array nama field yang wajib ada
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim())) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Validasi format email
 */
export const validateEmail = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { email } = req.body;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Format email tidak valid.',
    });
    return;
  }

  next();
};

/**
 * Validasi panjang password minimum
 */
export const validatePassword = (minLength: number = 6) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { password } = req.body;

    if (password && password.length < minLength) {
      res.status(400).json({
        success: false,
        message: `Password minimal ${minLength} karakter.`,
      });
      return;
    }

    next();
  };
};
