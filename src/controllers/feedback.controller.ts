// ============================================================
// Controller — Feedback
// Menyimpan feedback user (saran, bug, pujian, lainnya)
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

/**
 * POST /api/feedback
 * Simpan feedback dari user
 * Memerlukan auth middleware
 */
export const createFeedback = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
      return;
    }

    const { type, rating, title, message } = req.body;

    // Validasi
    if (!type || !rating || !title || !message) {
      res.status(400).json({
        success: false,
        message: 'Semua field (type, rating, title, message) harus diisi.',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating harus antara 1-5.',
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .insert({
        user_id: req.user.id,
        type,
        rating,
        title: title.slice(0, 100),
        message: message.slice(0, 1000),
      })
      .select('id, type, rating, title, created_at')
      .single();

    if (error) {
      logger.error('CreateFeedback:', error.message);
      res.status(500).json({
        success: false,
        message: 'Gagal menyimpan feedback.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Feedback berhasil dikirim. Terima kasih!',
      data,
    });
  } catch (err) {
    logger.error('CreateFeedback:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan feedback.',
    });
  }
};
