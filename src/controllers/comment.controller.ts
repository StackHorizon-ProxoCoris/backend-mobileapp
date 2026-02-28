// ============================================================
// Controller — Comments (Komentar Polymorphic)
// Bisa untuk report maupun action
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse, CreateCommentRequest, CommentResponse } from '../types';
import { createNotification } from '../services/notification.service';

/**
 * POST /api/comments
 * Menambah komentar ke report atau action
 */
export const addComment = async (
  req: Request<{}, ApiResponse, CreateCommentRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { targetId, targetType, text } = req.body;

    // Validasi target type
    if (!['report', 'action'].includes(targetType)) {
      res.status(400).json({ success: false, message: 'targetType harus "report" atau "action".' });
      return;
    }

    // Validasi target exists
    const tableName = targetType === 'report' ? 'reports' : 'actions';
    const { data: target } = await supabaseAdmin
      .from(tableName)
      .select('id, user_id, title')
      .eq('id', targetId)
      .single();

    if (!target) {
      res.status(404).json({ success: false, message: `${targetType === 'report' ? 'Laporan' : 'Aksi'} tidak ditemukan.` });
      return;
    }

    // Insert komentar
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: req.user.id,
        target_id: targetId,
        target_type: targetType,
        text,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal menambah komentar.', error: error.message });
      return;
    }

    // Update comments_count di tabel target
    const { data: targetData } = await supabaseAdmin
      .from(tableName)
      .select('comments_count')
      .eq('id', targetId)
      .single();

    if (targetData) {
      await supabaseAdmin
        .from(tableName)
        .update({ comments_count: (targetData.comments_count || 0) + 1 })
        .eq('id', targetId);
    }

    // Ambil data user untuk response
    const { data: userData } = await supabaseAdmin
      .from('users_metadata')
      .select('full_name, initials')
      .eq('auth_id', req.user.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Komentar berhasil ditambahkan.',
      data: {
        id: data.id,
        userId: data.user_id,
        targetId: data.target_id,
        targetType: data.target_type,
        text: data.text,
        likes: data.likes,
        createdAt: data.created_at,
        user: userData ? { fullName: userData.full_name, initials: userData.initials } : undefined,
      },
    });

    // === NOTIF TRIGGER: Kirim ke pemilik report/action (skip self-comment) ===
    if (target && target.user_id && target.user_id !== req.user!.id) {
      (async () => {
        try {
          await createNotification({
            userId: target.user_id,
            type: 'comment',
            title: 'Komentar Baru',
            message: `Seseorang mengomentari ${targetType === 'report' ? 'laporan' : 'aksi'} "${target.title || 'Anda'}".`,
            refType: targetType as 'report' | 'action',
            refId: targetId,
          });
        } catch (e) { logger.error('addComment notif error:', e); }
      })();
    }
  } catch (err) {
    logger.error('addComment:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah komentar.' });
  }
};

/**
 * GET /api/comments/:targetType/:targetId
 * Mengambil daftar komentar per report/action
 */
export const getComments = async (
  req: Request<{ targetType: string; targetId: string }>,
  res: Response<ApiResponse<CommentResponse[]>>
): Promise<void> => {
  try {
    const { targetType, targetId } = req.params;

    if (!['report', 'action'].includes(targetType)) {
      res.status(400).json({ success: false, message: 'targetType harus "report" atau "action".' });
      return;
    }

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal mengambil komentar.', error: error.message });
      return;
    }

    // Ambil data user untuk setiap komentar
    const commentsWithUser = await Promise.all(
      (comments || []).map(async (comment: any) => {
        const { data: userData } = await supabaseAdmin
          .from('users_metadata')
          .select('full_name, initials')
          .eq('auth_id', comment.user_id)
          .single();

        return {
          id: comment.id,
          userId: comment.user_id,
          targetId: comment.target_id,
          targetType: comment.target_type,
          text: comment.text,
          likes: comment.likes,
          createdAt: comment.created_at,
          user: userData ? { fullName: userData.full_name, initials: userData.initials } : undefined,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `Ditemukan ${commentsWithUser.length} komentar.`,
      data: commentsWithUser,
    });
  } catch (err) {
    logger.error('getComments:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil komentar.' });
  }
};
