// ============================================================
// Controller — Bookmarks (Polymorphic)
// Toggle bookmark for report, action, or info
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

/**
 * POST /api/bookmarks
 * Toggle bookmark (insert jika belum ada, delete jika sudah ada)
 * Body: { refType: 'report' | 'action' | 'info', refId: string }
 */
export const toggleBookmark = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { refType, refId } = req.body;

    if (!refType || !refId) {
      res.status(400).json({ success: false, message: 'refType dan refId wajib diisi.' });
      return;
    }

    if (!['report', 'action', 'info'].includes(refType)) {
      res.status(400).json({ success: false, message: 'refType harus report, action, atau info.' });
      return;
    }

    // Cek apakah sudah ada
    const { data: existing } = await supabaseAdmin
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('ref_type', refType)
      .eq('ref_id', refId)
      .single();

    if (existing) {
      // Sudah ada → hapus
      await supabaseAdmin.from('bookmarks').delete().eq('id', existing.id);
      res.status(200).json({ success: true, message: 'Bookmark dihapus.', data: { bookmarked: false } });
    } else {
      // Belum ada → tambah
      await supabaseAdmin.from('bookmarks').insert({
        user_id: req.user.id,
        ref_type: refType,
        ref_id: refId,
      });
      res.status(201).json({ success: true, message: 'Bookmark ditambahkan!', data: { bookmarked: true } });
    }
  } catch (err) {
    logger.error('toggleBookmark:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses bookmark.' });
  }
};

/**
 * GET /api/bookmarks/check?refType=X&refId=Y
 * Cek apakah item sudah di-bookmark oleh user
 */
export const checkBookmark = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { refType, refId } = req.query;

    const { data } = await supabaseAdmin
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('ref_type', refType as string)
      .eq('ref_id', refId as string)
      .single();

    res.status(200).json({ success: true, message: 'Status bookmark.', data: { bookmarked: !!data } });
  } catch (err) {
    logger.error('checkBookmark:', err);
    res.status(500).json({ success: false, message: 'Gagal cek bookmark.' });
  }
};
