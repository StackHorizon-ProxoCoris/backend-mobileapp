// ============================================================
// Controller — Reports (Laporan Masalah)
// CRUD operasi + geo-query + vote toggle
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse, CreateReportRequest, ReportResponse } from '../types';

/**
 * POST /api/reports
 * Membuat laporan masalah baru
 */
export const createReport = async (
  req: Request<{}, ApiResponse, CreateReportRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { category, type, title, description, address, district, city, lat, lng, urgency, photoUrls } = req.body;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: req.user.id,
        category,
        type: type || 'Waves',
        title,
        description,
        address,
        district: district || '',
        city: city || 'Kota Bandung',
        lat,
        lng,
        urgency: urgency || 0,
        photo_urls: photoUrls || [],
        photos_count: photoUrls?.length || 0,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal membuat laporan.', error: error.message });
      return;
    }

    // Update total_reports user (best-effort, tidak block response)
    const { data: currentMeta } = await supabaseAdmin
      .from('users_metadata')
      .select('total_reports')
      .eq('auth_id', req.user.id)
      .single();

    if (currentMeta) {
      await supabaseAdmin
        .from('users_metadata')
        .update({ total_reports: (currentMeta.total_reports || 0) + 1 })
        .eq('auth_id', req.user.id);
    }

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat! Terima kasih atas kontribusi Anda.',
      data: formatReport(data),
    });
  } catch (err) {
    logger.error('createReport:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat laporan.' });
  }
};

/**
 * GET /api/reports
 * Mengambil daftar laporan dengan filter & pagination
 * Query params: ?category=Banjir&status=Menunggu&page=1&limit=10
 */
export const getReports = async (
  req: Request,
  res: Response<ApiResponse<ReportResponse[]>>
): Promise<void> => {
  try {
    const { category, status, type, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, parseInt(limit as string, 10));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('reports')
      .select('*, users_metadata!reports_user_id_fkey(full_name, initials, current_badge, total_reports)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filter opsional
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;

    if (error) {
      // Jika FK join gagal, coba tanpa join
      const fallback = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (fallback.error) {
        res.status(400).json({ success: false, message: 'Gagal mengambil laporan.', error: fallback.error.message });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Daftar laporan berhasil diambil.',
        data: (fallback.data || []).map(formatReport),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: fallback.count || 0,
          totalPages: Math.ceil((fallback.count || 0) / limitNum),
        },
      });
      return;
    }

    // Format response dengan data reporter
    const reports = (data || []).map((report: any) => {
      const formatted = formatReport(report);
      if (report.users_metadata) {
        formatted.reporter = {
          fullName: report.users_metadata.full_name,
          initials: report.users_metadata.initials,
          currentBadge: report.users_metadata.current_badge,
          totalReports: report.users_metadata.total_reports,
        };
      }
      return formatted;
    });

    res.status(200).json({
      success: true,
      message: 'Daftar laporan berhasil diambil.',
      data: reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    logger.error('getReports:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil laporan.' });
  }
};

/**
 * GET /api/reports/nearby
 * Mengambil laporan terdekat berdasarkan koordinat
 * Query params: ?lat=-6.89&lng=107.61&radius=5 (km)
 */
export const getNearbyReports = async (
  req: Request,
  res: Response<ApiResponse<ReportResponse[]>>
): Promise<void> => {
  try {
    const { lat, lng, radius = '5' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ success: false, message: 'Parameter lat dan lng wajib diisi.' });
      return;
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Konversi radius km ke derajat (1 derajat ≈ 111 km)
    const degreeRadius = radiusKm / 111;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .gte('lat', userLat - degreeRadius)
      .lte('lat', userLat + degreeRadius)
      .gte('lng', userLng - degreeRadius)
      .lte('lng', userLng + degreeRadius)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal mencari laporan terdekat.', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Ditemukan ${data?.length || 0} laporan dalam radius ${radiusKm} km.`,
      data: (data || []).map(formatReport),
    });
  } catch (err) {
    logger.error('getNearbyReports:', err);
    res.status(500).json({ success: false, message: 'Gagal mencari laporan terdekat.' });
  }
};

/**
 * GET /api/reports/:id
 * Mengambil detail laporan beserta komentar
 */
export const getReportById = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<ReportResponse>>
): Promise<void> => {
  try {
    const { id } = req.params;

    // Ambil report
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
      return;
    }

    // Ambil data reporter
    const { data: reporter } = await supabaseAdmin
      .from('users_metadata')
      .select('full_name, initials, current_badge, total_reports')
      .eq('auth_id', report.user_id)
      .single();

    // Ambil komentar
    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('target_id', id)
      .eq('target_type', 'report')
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

    // Cek apakah user yang request sudah vote
    let hasVoted = false;
    if (req.user) {
      const { data: vote } = await supabaseAdmin
        .from('report_votes')
        .select('id')
        .eq('report_id', id)
        .eq('user_id', req.user.id)
        .single();
      hasVoted = !!vote;
    }

    const formatted = formatReport(report);
    formatted.reporter = reporter ? {
      fullName: reporter.full_name,
      initials: reporter.initials,
      currentBadge: reporter.current_badge,
      totalReports: reporter.total_reports,
    } : undefined;
    formatted.comments = commentsWithUser;
    formatted.hasVoted = hasVoted;

    res.status(200).json({
      success: true,
      message: 'Detail laporan berhasil diambil.',
      data: formatted,
    });
  } catch (err) {
    logger.error('getReportById:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail laporan.' });
  }
};

/**
 * POST /api/reports/:id/vote
 * Toggle dukungan (support/unsupport) pada laporan
 */
export const toggleVote = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { id } = req.params;

    // Cek apakah sudah pernah vote
    const { data: existingVote } = await supabaseAdmin
      .from('report_votes')
      .select('id')
      .eq('report_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existingVote) {
      // Sudah vote → hapus (unsupport)
      await supabaseAdmin.from('report_votes').delete().eq('id', existingVote.id);

      // Decrement votes_count
      const { data: report } = await supabaseAdmin
        .from('reports').select('votes_count').eq('id', id).single();
      if (report) {
        await supabaseAdmin.from('reports')
          .update({ votes_count: Math.max(0, (report.votes_count || 0) - 1) })
          .eq('id', id);
      }

      res.status(200).json({ success: true, message: 'Dukungan dihapus.' });
    } else {
      // Belum vote → tambah (support)
      await supabaseAdmin.from('report_votes').insert({ user_id: req.user.id, report_id: id });

      // Increment votes_count
      const { data: report } = await supabaseAdmin
        .from('reports').select('votes_count').eq('id', id).single();
      if (report) {
        await supabaseAdmin.from('reports')
          .update({ votes_count: (report.votes_count || 0) + 1 })
          .eq('id', id);
      }

      res.status(201).json({ success: true, message: 'Terima kasih atas dukungan Anda!' });
    }
  } catch (err) {
    logger.error('toggleVote:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses dukungan.' });
  }
};

/**
 * PATCH /api/reports/:id/status
 * Update status laporan
 */
export const updateReportStatus = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { id } = req.params;
    const { status, respondedBy, estimatedCompletion } = req.body;

    const validStatuses = ['Menunggu', 'Diverifikasi', 'Ditangani', 'Selesai'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Status harus salah satu dari: ${validStatuses.join(', ')}` });
      return;
    }

    const updateData: Record<string, any> = { status };
    if (respondedBy) updateData.responded_by = respondedBy;
    if (estimatedCompletion) updateData.estimated_completion = estimatedCompletion;

    const { error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', id);

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal update status.', error: error.message });
      return;
    }

    res.status(200).json({ success: true, message: `Status laporan diubah ke "${status}".` });
  } catch (err) {
    logger.error('updateReportStatus:', err);
    res.status(500).json({ success: false, message: 'Gagal update status laporan.' });
  }
};

// ============================================================
// Helper — Format data dari Supabase ke response
// ============================================================

/**
 * POST /api/reports/:id/verify
 * Verifikasi laporan oleh user
 */
export const verifyReport = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const { id } = req.params;

    // Cek report ada
    const { data: report } = await supabaseAdmin
      .from('reports').select('id, verified_count, status').eq('id', id).single();
    if (!report) {
      res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
      return;
    }

    // Cek duplikat
    const { data: existing } = await supabaseAdmin
      .from('report_verifications')
      .select('id')
      .eq('report_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      res.status(409).json({ success: false, message: 'Anda sudah memverifikasi laporan ini.' });
      return;
    }

    // Insert verification
    await supabaseAdmin.from('report_verifications').insert({ report_id: id, user_id: req.user.id });

    // Increment verified_count
    const newCount = (report.verified_count || 0) + 1;
    const updateData: Record<string, any> = { verified_count: newCount };

    // Auto-promote status jika cukup verifikasi
    if (newCount >= 3 && report.status === 'Menunggu') {
      updateData.status = 'Diverifikasi';
    }

    await supabaseAdmin.from('reports').update(updateData).eq('id', id);

    res.status(201).json({
      success: true,
      message: 'Laporan berhasil diverifikasi!',
      data: { verifiedCount: newCount, statusUpdated: newCount >= 3 && report.status === 'Menunggu' },
    });
  } catch (err) {
    logger.error('verifyReport:', err);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi laporan.' });
  }
};

function formatReport(row: any): ReportResponse {
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
    urgency: row.urgency,
    votesCount: row.votes_count,
    verifiedCount: row.verified_count,
    photosCount: row.photos_count,
    commentsCount: row.comments_count,
    respondedBy: row.responded_by,
    estimatedCompletion: row.estimated_completion,
    photoUrls: row.photo_urls || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
