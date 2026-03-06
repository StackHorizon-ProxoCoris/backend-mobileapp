// ============================================================
// Controller — Admin (Super Admin Only)
// Endpoints untuk manajemen pengguna & analitik admin
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

// ────────────────────────────────────────────
// GET /api/admin/users — Daftar semua pengguna
// ────────────────────────────────────────────
export const getUsers = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { role, status, search, sort = 'created_at', page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('users_metadata')
      .select('id, role, full_name, email, phone, district, city, province, instansi, jabatan, eco_points, current_badge, created_at, updated_at', { count: 'exact' });

    // Filter by role
    if (role && typeof role === 'string' && ['user', 'pemerintah', 'admin'].includes(role)) {
      query = query.eq('role', role);
    }

    // Search by name or email
    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }

    // Sort
    const validSorts = ['created_at', 'full_name', 'eco_points', 'role'];
    const sortField = validSorts.includes(sort as string) ? (sort as string) : 'created_at';
    query = query.order(sortField, { ascending: sortField === 'full_name' });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna', error: error.message });
      return;
    }

    res.json({
      success: true,
      message: 'Daftar pengguna berhasil diambil',
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// GET /api/admin/users/stats — Statistik pengguna
// ────────────────────────────────────────────
export const getUserStats = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users_metadata')
      .select('role');

    if (error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil statistik', error: error.message });
      return;
    }

    const total = data?.length || 0;
    const byRole = {
      user: data?.filter(u => u.role === 'user').length || 0,
      pemerintah: data?.filter(u => u.role === 'pemerintah').length || 0,
      admin: data?.filter(u => u.role === 'admin').length || 0,
    };

    res.json({
      success: true,
      message: 'Statistik pengguna',
      data: { total, byRole },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// GET /api/admin/analytics — Dashboard analitik
// ────────────────────────────────────────────
export const getAnalytics = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Parallel fetch semua data
    const [usersRes, reportsRes, actionsRes, reportsDetailRes] = await Promise.all([
      supabaseAdmin.from('users_metadata').select('role, created_at'),
      supabaseAdmin.from('reports').select('status, category, urgency, created_at, votes_count, district'),
      supabaseAdmin.from('actions').select('category, status, points, created_at, total_participants'),
      supabaseAdmin.from('reports').select('status, responded_by, created_at, updated_at').not('status', 'eq', 'Menunggu'),
    ]);

    const users = usersRes.data || [];
    const reports = reportsRes.data || [];
    const actions = actionsRes.data || [];
    const respondedReports = reportsDetailRes.data || [];

    // Report stats
    const reportStats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'Menunggu').length,
      verified: reports.filter(r => r.status === 'Diverifikasi').length,
      inProgress: reports.filter(r => r.status === 'Ditangani').length,
      resolved: reports.filter(r => r.status === 'Selesai').length,
    };

    // Category breakdown
    const categories: Record<string, number> = {};
    reports.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });

    // Top districts
    const districts: Record<string, number> = {};
    reports.forEach(r => {
      if (r.district) districts[r.district] = (districts[r.district] || 0) + 1;
    });
    const topDistricts = Object.entries(districts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // User stats
    const userStats = {
      total: users.length,
      byRole: {
        user: users.filter(u => u.role === 'user').length,
        pemerintah: users.filter(u => u.role === 'pemerintah').length,
        admin: users.filter(u => u.role === 'admin').length,
      },
    };

    // Action stats
    const actionStats = {
      total: actions.length,
      totalParticipants: actions.reduce((sum, a) => sum + (a.total_participants || 0), 0),
      totalPoints: actions.reduce((sum, a) => sum + (a.points || 0), 0),
    };

    // Avg response time (reports yang sudah direspon)
    let avgResponseHours = 0;
    if (respondedReports.length > 0) {
      const totalHours = respondedReports.reduce((sum, r) => {
        const created = new Date(r.created_at).getTime();
        const updated = new Date(r.updated_at).getTime();
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0);
      avgResponseHours = Math.round((totalHours / respondedReports.length) * 10) / 10;
    }

    res.json({
      success: true,
      message: 'Data analitik admin',
      data: {
        reportStats,
        categories,
        topDistricts,
        userStats,
        actionStats,
        avgResponseHours,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// PATCH /api/admin/users/:id/role — Ubah role user
// ────────────────────────────────────────────
export const updateUserRole = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'pemerintah', 'admin'].includes(role)) {
      res.status(400).json({ success: false, message: 'Role tidak valid. Gunakan: user, pemerintah, atau admin' });
      return;
    }

    // Prevent admin from changing own role
    if (req.user?.id === id) {
      res.status(400).json({ success: false, message: 'Tidak bisa mengubah role sendiri' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('users_metadata')
      .update({ role })
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: 'Gagal mengubah role', error: error.message });
      return;
    }

    res.json({ success: true, message: `Role berhasil diubah menjadi ${role}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend — Suspend/activate user
// ────────────────────────────────────────────
export const toggleUserSuspend = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;

    if (req.user?.id === id) {
      res.status(400).json({ success: false, message: 'Tidak bisa suspend akun sendiri' });
      return;
    }

    // Update user_metadata with suspension flag via settings JSONB
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('users_metadata')
      .select('settings')
      .eq('id', id)
      .single();

    if (fetchErr) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      return;
    }

    const settings = { ...(current?.settings || {}), suspended: !!suspended };

    const { error } = await supabaseAdmin
      .from('users_metadata')
      .update({ settings })
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: 'Gagal mengubah status', error: error.message });
      return;
    }

    res.json({
      success: true,
      message: suspended ? 'Pengguna berhasil disuspend' : 'Pengguna berhasil diaktifkan kembali',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
