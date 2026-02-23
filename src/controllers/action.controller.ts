// ============================================================
// Controller — Actions (Aksi Positif)
// CRUD operasi untuk kegiatan positif warga
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse, CreateActionRequest, ActionResponse } from '../types';

/**
 * POST /api/actions
 * Membuat aksi positif baru
 */
export const createAction = async (
  req: Request<{}, ApiResponse, CreateActionRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const {
      category, type, title, description,
      address, district, city, lat, lng,
      date, duration, points, maxParticipants, photoUrls,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('actions')
      .insert({
        user_id: req.user.id,
        category,
        type: type || 'Plant',
        title,
        description,
        address,
        district: district || '',
        city: city || 'Kota Bandung',
        lat: lat || null,
        lng: lng || null,
        date: date || null,
        duration: duration || null,
        points: points || 0,
        max_participants: maxParticipants || 0,
        total_participants: 1, // Pembuat otomatis jadi partisipan pertama
        photo_urls: photoUrls || [],
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal membuat aksi.', error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Aksi positif berhasil dibuat! Terus lakukan hal baik ',
      data: formatAction(data),
    });
  } catch (err) {
    logger.error('createAction:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat aksi.' });
  }
};

/**
 * GET /api/actions
 * Mengambil daftar aksi dengan filter & pagination
 * Query params: ?category=Lingkungan&status=Selesai&page=1&limit=10
 */
export const getActions = async (
  req: Request,
  res: Response<ApiResponse<ActionResponse[]>>
): Promise<void> => {
  try {
    const { category, status, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, parseInt(limit as string, 10));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('actions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal mengambil daftar aksi.', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Daftar aksi berhasil diambil.',
      data: (data || []).map(formatAction),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    logger.error('getActions:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar aksi.' });
  }
};

/**
 * GET /api/actions/:id
 * Mengambil detail aksi beserta komentar dan data organizer
 */
export const getActionById = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<ActionResponse>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Ambil action
    const { data: action, error } = await supabaseAdmin
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !action) {
      res.status(404).json({ success: false, message: 'Aksi tidak ditemukan.' });
      return;
    }

    // Ambil data organizer
    const { data: organizer } = await supabaseAdmin
      .from('users_metadata')
      .select('full_name, initials, current_badge, total_actions')
      .eq('auth_id', action.user_id)
      .single();

    // Ambil komentar
    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('target_id', id)
      .eq('target_type', 'action')
      .order('created_at', { ascending: false });

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

    const formatted = formatAction(action);
    formatted.organizer = organizer ? {
      fullName: organizer.full_name,
      initials: organizer.initials,
      currentBadge: organizer.current_badge,
      totalActions: organizer.total_actions,
    } : undefined;
    formatted.comments = commentsWithUser;

    res.status(200).json({
      success: true,
      message: 'Detail aksi berhasil diambil.',
      data: formatted,
    });
  } catch (err) {
    logger.error('getActionById:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail aksi.' });
  }
};

// ============================================================
// Helper — Format data dari Supabase ke response
// ============================================================

function formatAction(row: any): ActionResponse {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    type: row.type,
    title: row.title,
    description: row.description,
    address: row.address,
    district: row.district,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    date: row.date,
    duration: row.duration,
    points: row.points,
    maxParticipants: row.max_participants,
    totalParticipants: row.total_participants,
    verified: row.verified,
    verifiedBy: row.verified_by,
    commentsCount: row.comments_count,
    photoUrls: row.photo_urls || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
