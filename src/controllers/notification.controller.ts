// ============================================================
// Controller — Notification
// CRUD notifikasi user
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

/**
 * GET /api/notifications
 * Ambil daftar notifikasi user yang sedang login
 */
export const getNotifications = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('GetNotifications:', error.message);
      res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi.' });
      return;
    }

    // Hitung unread count
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.status(200).json({
      success: true,
      message: 'Notifikasi berhasil diambil.',
      data: {
        notifications: data || [],
        unreadCount: count || 0,
      },
    });
  } catch (err) {
    logger.error('GetNotifications:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi.' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Tandai notifikasi sebagai sudah dibaca
 */
export const markAsRead = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      logger.error('MarkAsRead:', error.message);
      res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    logger.error('MarkAsRead:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Tandai semua notifikasi sebagai sudah dibaca
 */
export const markAllAsRead = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) {
      logger.error('MarkAllAsRead:', error.message);
      res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (err) {
    logger.error('MarkAllAsRead:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
  }
};
