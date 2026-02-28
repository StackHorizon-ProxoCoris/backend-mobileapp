// ============================================================
// Controller — Activity (User Activity History)
// Derive activities from user's reports, actions, and comments
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

// Mapping kategori → icon/color untuk reports
const REPORT_STYLE: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Banjir':      { icon: 'Camera', color: '#3b82f6', bgColor: '#eff6ff' },
  'Jalan Rusak': { icon: 'Camera', color: '#ea580c', bgColor: '#fff7ed' },
  'Sampah':      { icon: 'Trash',  color: '#059669', bgColor: '#ecfdf5' },
  'Longsor':     { icon: 'Camera', color: '#ea580c', bgColor: '#fff7ed' },
  'Kebakaran':   { icon: 'Camera', color: '#dc2626', bgColor: '#fee2e2' },
  'Pohon':       { icon: 'Tree',   color: '#16a34a', bgColor: '#f0fdf4' },
};

const ACTION_STYLE: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Bersih-bersih':  { icon: 'Trash',  color: '#059669', bgColor: '#ecfdf5' },
  'Perbaikan':      { icon: 'Camera', color: '#3b82f6', bgColor: '#eff6ff' },
  'Tanam Pohon':    { icon: 'Tree',   color: '#16a34a', bgColor: '#f0fdf4' },
  'Gotong Royong':  { icon: 'Camera', color: '#d97706', bgColor: '#fef3c7' },
};

const STATUS_COLOR: Record<string, string> = {
  'Menunggu':     '#f59e0b',
  'Diverifikasi': '#3b82f6',
  'Ditangani':    '#3b82f6',
  'Selesai':      '#059669',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 hari lalu';
  return `${days} hari lalu`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * GET /api/activities
 * Mendapatkan riwayat aktivitas user yang sedang login
 * Derive dari reports, actions, dan comments yang dibuat user
 */
export const getActivities = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const userId = req.user.id;
    const activities: any[] = [];

    // 1. Reports yang dibuat user
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('id, title, category, status, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (reports) {
      for (const r of reports) {
        const style = REPORT_STYLE[r.category] || REPORT_STYLE['Banjir'];
        activities.push({
          id: `act_r_${r.id}`,
          type: 'report',
          icon: style.icon,
          bgColor: style.bgColor,
          color: style.color,
          title: `Melaporkan: ${r.title}`,
          desc: r.description?.slice(0, 60) || '',
          time: timeAgo(r.created_at),
          date: formatDate(r.created_at),
          points: 10,
          status: r.status,
          statusColor: STATUS_COLOR[r.status] || '#94a3b8',
          refId: r.id,
          _sortDate: r.created_at,
        });
      }
    }

    // 2. Actions yang dibuat user
    const { data: actions } = await supabaseAdmin
      .from('actions')
      .select('id, title, type, status, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (actions) {
      for (const a of actions) {
        const style = ACTION_STYLE[a.type] || ACTION_STYLE['Bersih-bersih'];
        activities.push({
          id: `act_a_${a.id}`,
          type: 'action',
          icon: style.icon,
          bgColor: style.bgColor,
          color: style.color,
          title: `Aksi: ${a.title}`,
          desc: a.description?.slice(0, 60) || '',
          time: timeAgo(a.created_at),
          date: formatDate(a.created_at),
          points: 50,
          status: a.status,
          statusColor: STATUS_COLOR[a.status] || '#94a3b8',
          refId: a.id,
          _sortDate: a.created_at,
        });
      }
    }

    // 3. Comments yang dibuat user
    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('id, text, target_type, target_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (comments) {
      for (const c of comments) {
        activities.push({
          id: `act_c_${c.id}`,
          type: 'comment',
          icon: 'ChatCircle',
          bgColor: '#eff6ff',
          color: '#3b82f6',
          title: `Komentar: ${c.target_type === 'report' ? 'Laporan' : 'Aksi'}`,
          desc: c.text?.slice(0, 60) || '',
          time: timeAgo(c.created_at),
          date: formatDate(c.created_at),
          points: 2,
          refId: c.target_id,
          _sortDate: c.created_at,
        });
      }
    }

    // Sort by date (newest first) and remove internal _sortDate
    activities.sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
    const cleaned = activities.map(({ _sortDate, ...rest }) => rest);

    res.status(200).json({
      success: true,
      message: 'Riwayat aktivitas berhasil diambil.',
      data: cleaned,
    });
  } catch (err) {
    logger.error('GetActivities:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat aktivitas.',
    });
  }
};
