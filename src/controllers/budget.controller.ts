// ============================================================
// Controller — Budget
// Data anggaran proyek dan serapan per dinas
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

/**
 * GET /api/budget/projects
 * Ambil daftar proyek anggaran
 */
export const getBudgetProjects = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;

    let query = supabaseAdmin
      .from('budget_projects')
      .select('*')
      .order('id', { ascending: true });

    if (status && status !== 'Semua') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('GetBudgetProjects:', error.message);
      res.status(500).json({ success: false, message: 'Gagal mengambil data proyek.' });
      return;
    }

    // Hitung summary
    const projects = data || [];
    const totalApbd = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const totalTerserap = projects.reduce((s, p) => s + (p.budget || 0) * (p.realisasi || 0) / 100, 0);
    const anomaliCount = projects.filter(p => p.status === 'Anomali').length;
    const pctSerap = totalApbd > 0 ? Math.round((totalTerserap / totalApbd) * 100) : 0;

    res.status(200).json({
      success: true,
      message: 'Data proyek berhasil diambil.',
      data: {
        projects,
        summary: {
          totalApbd,
          totalTerserap,
          totalSisa: totalApbd - totalTerserap,
          pctSerap,
          anomaliCount,
          totalProjects: projects.length,
        },
        filterCounts: {
          Semua: projects.length,
          Normal: projects.filter(p => p.status === 'Normal').length,
          Anomali: anomaliCount,
          Selesai: projects.filter(p => p.status === 'Selesai').length,
        },
      },
    });
  } catch (err) {
    logger.error('GetBudgetProjects:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data proyek.' });
  }
};

/**
 * GET /api/budget/dinas
 * Ambil data serapan per dinas
 */
export const getBudgetDinas = async (
  _req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('budget_dinas')
      .select('*')
      .order('serap', { ascending: false });

    if (error) {
      logger.error('GetBudgetDinas:', error.message);
      res.status(500).json({ success: false, message: 'Gagal mengambil data dinas.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data dinas berhasil diambil.',
      data: data || [],
    });
  } catch (err) {
    logger.error('GetBudgetDinas:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data dinas.' });
  }
};
