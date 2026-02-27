// ============================================================
// Controller — Area Status (Aggregate Report Stats)
// Provides area-level statistics from reports data
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

/**
 * GET /api/area-status
 * Mengambil aggregated stats dari reports:
 * - Total laporan aktif (belum selesai)
 * - Response rate (% laporan yang sudah direspons)
 * - Average response time (jam)
 * - Alert level (AMAN / WASPADA / SIAGA / AWAS)
 * - Warning message terbaru dari laporan kritis
 */
export const getAreaStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Ambil semua laporan
    const { data: allReports, error: allError } = await supabaseAdmin
      .from('reports')
      .select('id, status, urgency, category, title, created_at, updated_at, responded_by');

    if (allError) {
      logger.error('getAreaStatus - query error:', allError);
      res.status(400).json({ success: false, message: 'Gagal mengambil data status area.' });
      return;
    }

    const reports = allReports || [];
    const totalReports = reports.length;

    // 2. Hitung laporan aktif (status bukan 'Selesai')
    const activeReports = reports.filter(r => r.status !== 'Selesai').length;

    // 3. Hitung response rate (laporan yang sudah direspons: Diverifikasi, Ditangani, Selesai)
    const respondedStatuses = ['Diverifikasi', 'Ditangani', 'Selesai'];
    const respondedReports = reports.filter(r => respondedStatuses.includes(r.status)).length;
    const responseRate = totalReports > 0 ? Math.round((respondedReports / totalReports) * 100) : 0;

    // 4. Hitung avg response time (jam) untuk laporan yang sudah ditangani/selesai
    const handledReports = reports.filter(r =>
      r.status === 'Ditangani' || r.status === 'Selesai' || r.status === 'Diverifikasi'
    );

    let avgResponseHours = 0;
    if (handledReports.length > 0) {
      const totalHours = handledReports.reduce((sum, r) => {
        const created = new Date(r.created_at).getTime();
        const updated = new Date(r.updated_at).getTime();
        const diffHours = (updated - created) / (1000 * 60 * 60);
        return sum + Math.max(0, diffHours);
      }, 0);
      avgResponseHours = Math.round(totalHours / handledReports.length);
    }

    // 5. Tentukan level bahaya berdasarkan jumlah laporan kritis aktif
    const criticalActiveReports = reports.filter(
      r => r.urgency >= 80 && r.status !== 'Selesai'
    ).length;

    let level: string;
    let levelColor: string;
    let levelBg: string;

    if (criticalActiveReports >= 16) {
      level = 'AWAS';
      levelColor = '#dc2626';
      levelBg = 'rgba(220,38,38,0.2)';
    } else if (criticalActiveReports >= 9) {
      level = 'SIAGA';
      levelColor = '#ea580c';
      levelBg = 'rgba(234,88,12,0.2)';
    } else if (criticalActiveReports >= 4) {
      level = 'WASPADA';
      levelColor = '#f59e0b';
      levelBg = 'rgba(243,156,18,0.2)';
    } else {
      level = 'AMAN';
      levelColor = '#059669';
      levelBg = 'rgba(5,150,105,0.2)';
    }

    // 6. Warning message dari laporan kritis terbaru
    const criticalReports = reports
      .filter(r => r.urgency >= 60 && r.status !== 'Selesai')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const latestCritical = criticalReports[0];
    const warningType = latestCritical?.category || 'Info';
    const warningMessage = latestCritical
      ? `${latestCritical.title} — Urgensi tinggi, butuh perhatian.`
      : 'Tidak ada peringatan saat ini. Area Anda dalam kondisi aman.';

    res.status(200).json({
      success: true,
      message: 'Status area berhasil diambil.',
      data: {
        level,
        levelColor,
        levelBg,
        activeReports,
        totalReports,
        responseRate,
        avgResponseHours,
        criticalCount: criticalActiveReports,
        warningType,
        warningMessage,
        hasWarning: criticalActiveReports > 0,
      },
    });
  } catch (err) {
    logger.error('getAreaStatus:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil status area.' });
  }
};
