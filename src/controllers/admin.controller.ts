// ============================================================
// Controller — Admin (Super Admin Only)
// Endpoints untuk dashboard, manajemen pengguna, dan aktivitas admin
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse, UserRole } from '../types';

type ActivityLogType = 'report' | 'action' | 'user' | 'status';

interface AdminActivityLogItem {
  id: string;
  type: ActivityLogType;
  icon: string;
  bgColor: string;
  color: string;
  title: string;
  desc: string;
  time: string;
  date: string;
  points: number;
  status?: string;
  statusColor?: string;
  refId?: string;
  targetType?: 'report' | 'action' | 'user';
}

interface AdminModerationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  severity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  urgency: number;
  time: string;
  createdAt: string;
  district: string;
  city: string;
  votesCount: number;
  verifiedCount: number;
  commentsCount: number;
  photoCount: number;
  reporterName: string;
  reporterInitials: string;
  reporterEmail: string;
}

interface DashboardSystemStatusItem {
  key: 'backend' | 'database' | 'accounts' | 'moderation';
  label: string;
  status: string;
  value: string;
  sub: string;
}

const STATUS_COLORS: Record<string, string> = {
  Menunggu: '#f59e0b',
  Diverifikasi: '#3b82f6',
  Ditangani: '#7c3aed',
  Selesai: '#059669',
  Terjadwal: '#0ea5e9',
  Berlangsung: '#7c3aed',
};

const REPORT_STYLE: Record<string, { icon: string; color: string; bgColor: string }> = {
  Banjir: { icon: 'Waves', color: '#2563eb', bgColor: '#eff6ff' },
  'Jalan Rusak': { icon: 'RoadHorizon', color: '#d97706', bgColor: '#fff7ed' },
  Sampah: { icon: 'Trash', color: '#059669', bgColor: '#ecfdf5' },
  Kebakaran: { icon: 'Fire', color: '#dc2626', bgColor: '#fee2e2' },
  Longsor: { icon: 'Mountains', color: '#7c3aed', bgColor: '#f5f3ff' },
  'Tanah Longsor': { icon: 'Mountains', color: '#7c3aed', bgColor: '#f5f3ff' },
};

const ACTION_STYLE: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Bersih-bersih': { icon: 'Trash', color: '#059669', bgColor: '#ecfdf5' },
  Perbaikan: { icon: 'RoadHorizon', color: '#2563eb', bgColor: '#eff6ff' },
  'Tanam Pohon': { icon: 'Tree', color: '#16a34a', bgColor: '#f0fdf4' },
  'Gotong Royong': { icon: 'Users', color: '#d97706', bgColor: '#fef3c7' },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatUptime(seconds: number): string {
  const totalMinutes = Math.max(1, Math.floor(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} menit`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} jam ${minutes} menit` : `${hours} jam`;
}

function getSeverityFromUrgency(urgency: number): 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah' {
  if (urgency >= 90) return 'Kritis';
  if (urgency >= 70) return 'Tinggi';
  if (urgency >= 40) return 'Sedang';
  return 'Rendah';
}

function getReportStyle(category: string) {
  return REPORT_STYLE[category] || { icon: 'FileText', color: '#3b82f6', bgColor: '#eff6ff' };
}

function getActionStyle(category: string) {
  return ACTION_STYLE[category] || { icon: 'Leaf', color: '#059669', bgColor: '#ecfdf5' };
}

function getUserActivityStyle(role: UserRole) {
  if (role === 'pemerintah') {
    return { icon: 'Buildings', color: '#7c3aed', bgColor: '#f5f3ff' };
  }
  if (role === 'admin') {
    return { icon: 'UserGear', color: '#d97706', bgColor: '#fffbeb' };
  }
  return { icon: 'UserCheck', color: '#059669', bgColor: '#ecfdf5' };
}

function getStatusActivityStyle(status: string) {
  if (status === 'Selesai') {
    return { icon: 'CheckCircle', color: '#059669', bgColor: '#ecfdf5' };
  }
  if (status === 'Ditangani') {
    return { icon: 'Clock', color: '#7c3aed', bgColor: '#f5f3ff' };
  }
  return { icon: 'ShieldCheck', color: '#2563eb', bgColor: '#eff6ff' };
}

function buildModerationItem(
  report: any,
  userMap: Record<string, { full_name?: string; initials?: string; email?: string }>
): AdminModerationItem {
  const reporter = userMap[report.user_id] || {};

  return {
    id: report.id,
    title: report.title,
    description: report.description || '',
    category: report.category || 'Laporan',
    status: report.status || 'Menunggu',
    severity: getSeverityFromUrgency(report.urgency || 0),
    urgency: report.urgency || 0,
    time: timeAgo(report.created_at),
    createdAt: report.created_at,
    district: report.district || '',
    city: report.city || '',
    votesCount: report.votes_count || 0,
    verifiedCount: report.verified_count || 0,
    commentsCount: report.comments_count || 0,
    photoCount: report.photos_count || 0,
    reporterName: reporter.full_name || 'Pengguna SIAGA',
    reporterInitials: reporter.initials || 'SG',
    reporterEmail: reporter.email || '',
  };
}

async function buildActivityLog(limit: number): Promise<AdminActivityLogItem[]> {
  const sourceLimit = clamp(limit, 5, 100);

  const [usersRes, reportsRes, actionsRes] = await Promise.all([
    supabaseAdmin
      .from('users_metadata')
      .select('full_name, role, instansi, district, created_at')
      .order('created_at', { ascending: false })
      .limit(sourceLimit),
    supabaseAdmin
      .from('reports')
      .select('id, title, category, status, district, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(sourceLimit),
    supabaseAdmin
      .from('actions')
      .select('id, title, category, status, created_at')
      .order('created_at', { ascending: false })
      .limit(sourceLimit),
  ]);

  const items: Array<AdminActivityLogItem & { createdAtRaw: string }> = [];

  for (const row of usersRes.data || []) {
    const style = getUserActivityStyle((row.role || 'user') as UserRole);
    const subject =
      row.role === 'pemerintah'
        ? row.instansi || row.full_name || 'Instansi baru'
        : row.full_name || 'Pengguna baru';

    items.push({
      id: `user-${row.created_at}-${subject}`,
      type: 'user',
      icon: style.icon,
      bgColor: style.bgColor,
      color: style.color,
      title:
        row.role === 'pemerintah'
          ? `Akun pemerintah baru: ${subject}`
          : row.role === 'admin'
            ? `Admin baru: ${subject}`
            : `Pengguna baru: ${subject}`,
      desc: row.district ? `Wilayah ${row.district}` : 'Pendaftaran akun baru',
      time: timeAgo(row.created_at),
      date: formatDate(row.created_at),
      points: 0,
      createdAtRaw: row.created_at,
    });
  }

  for (const row of reportsRes.data || []) {
    const style = getReportStyle(row.category);
    items.push({
      id: `report-${row.id}`,
      type: 'report',
      icon: style.icon,
      bgColor: style.bgColor,
      color: style.color,
      title: `Laporan baru: ${row.title}`,
      desc: [row.category, row.district].filter(Boolean).join(' • ') || 'Laporan masuk',
      time: timeAgo(row.created_at),
      date: formatDate(row.created_at),
      points: 0,
      status: row.status,
      statusColor: STATUS_COLORS[row.status] || '#94a3b8',
      refId: row.id,
      targetType: 'report',
      createdAtRaw: row.created_at,
    });

    if (
      row.updated_at &&
      new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() > 60000 &&
      row.status &&
      row.status !== 'Menunggu'
    ) {
      const statusStyle = getStatusActivityStyle(row.status);
      items.push({
        id: `status-${row.id}-${row.updated_at}`,
        type: 'status',
        icon: statusStyle.icon,
        bgColor: statusStyle.bgColor,
        color: statusStyle.color,
        title: `Status laporan: ${row.status}`,
        desc: row.title,
        time: timeAgo(row.updated_at),
        date: formatDate(row.updated_at),
        points: 0,
        status: row.status,
        statusColor: STATUS_COLORS[row.status] || statusStyle.color,
        refId: row.id,
        targetType: 'report',
        createdAtRaw: row.updated_at,
      });
    }
  }

  for (const row of actionsRes.data || []) {
    const style = getActionStyle(row.category);
    items.push({
      id: `action-${row.id}`,
      type: 'action',
      icon: style.icon,
      bgColor: style.bgColor,
      color: style.color,
      title: `Aksi komunitas: ${row.title}`,
      desc: [row.category, row.status].filter(Boolean).join(' • ') || 'Aksi baru',
      time: timeAgo(row.created_at),
      date: formatDate(row.created_at),
      points: 0,
      status: row.status,
      statusColor: STATUS_COLORS[row.status] || '#94a3b8',
      refId: row.id,
      targetType: 'action',
      createdAtRaw: row.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAtRaw).getTime() - new Date(a.createdAtRaw).getTime())
    .slice(0, limit)
    .map(({ createdAtRaw, ...item }) => item);
}

// ────────────────────────────────────────────
// GET /api/admin/dashboard — Dashboard admin
// ────────────────────────────────────────────
export const getDashboard = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const [usersRes, totalReportsQ, pendingReportsQ, verifiedReportsQ, inProgressReportsQ, resolvedReportsQ, totalActionsQ, unreadNotificationsQ, moderationReportsRes, recentActivities] = await Promise.all([
      supabaseAdmin.from('users_metadata').select('role'),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Menunggu'),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Diverifikasi'),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Ditangani'),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Selesai'),
      supabaseAdmin.from('actions').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user!.id)
        .eq('is_read', false),
      supabaseAdmin
        .from('reports')
        .select('id, user_id, title, description, category, status, urgency, district, city, votes_count, verified_count, comments_count, photos_count, created_at')
        .neq('status', 'Selesai')
        .order('urgency', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
      buildActivityLog(6),
    ]);

    if (
      usersRes.error ||
      totalReportsQ.error ||
      pendingReportsQ.error ||
      verifiedReportsQ.error ||
      inProgressReportsQ.error ||
      resolvedReportsQ.error ||
      totalActionsQ.error ||
      unreadNotificationsQ.error ||
      moderationReportsRes.error
    ) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard admin.' });
      return;
    }

    const users = usersRes.data || [];
    const totalUsers = users.length;
    const byRole = {
      user: users.filter((row: any) => row.role === 'user').length,
      pemerintah: users.filter((row: any) => row.role === 'pemerintah').length,
      admin: users.filter((row: any) => row.role === 'admin').length,
    };

    const moderationReports = moderationReportsRes.data || [];
    const reporterIds = [...new Set(moderationReports.map((row: any) => row.user_id).filter(Boolean))];
    const moderationUsersRes = reporterIds.length > 0
      ? await supabaseAdmin
        .from('users_metadata')
        .select('auth_id, full_name, initials, email')
        .in('auth_id', reporterIds)
      : { data: [], error: null };

    if (moderationUsersRes.error) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data pelapor moderasi.' });
      return;
    }

    const reporterMap = Object.fromEntries(
      (moderationUsersRes.data || []).map((row: any) => [row.auth_id, row])
    );

    const totalReports = totalReportsQ.count || 0;
    const pendingReports = pendingReportsQ.count || 0;
    const verifiedReports = verifiedReportsQ.count || 0;
    const inProgressReports = inProgressReportsQ.count || 0;
    const resolvedReports = resolvedReportsQ.count || 0;
    const totalActions = totalActionsQ.count || 0;
    const unreadNotifications = unreadNotificationsQ.count || 0;
    const totalRecords = totalUsers + totalReports + totalActions;

    const systemStatus: DashboardSystemStatusItem[] = [
      {
        key: 'backend',
        label: 'Backend API',
        status: 'Online',
        value: formatUptime(process.uptime()),
        sub: 'Uptime proses backend saat ini',
      },
      {
        key: 'database',
        label: 'Database Supabase',
        status: 'Tersambung',
        value: `${totalRecords.toLocaleString('id-ID')} data`,
        sub: 'Sinkron langsung dengan database utama',
      },
      {
        key: 'accounts',
        label: 'Akun & Auth',
        status: 'Aktif',
        value: `${totalUsers.toLocaleString('id-ID')} akun`,
        sub: `${byRole.pemerintah} pemerintah · ${byRole.admin} admin`,
      },
      {
        key: 'moderation',
        label: 'Moderasi Laporan',
        status: pendingReports > 0 ? 'Perhatian' : 'Stabil',
        value: `${pendingReports.toLocaleString('id-ID')} antrian`,
        sub: `${verifiedReports + inProgressReports} laporan sedang ditindaklanjuti`,
      },
    ];

    res.json({
      success: true,
      message: 'Dashboard admin berhasil diambil.',
      data: {
        summary: {
          totalUsers,
          totalReports,
          pendingReports,
          verifiedReports,
          inProgressReports,
          resolvedReports,
          totalActions,
          unreadNotifications,
        },
        userStats: {
          total: totalUsers,
          byRole,
        },
        reportStats: {
          total: totalReports,
          pending: pendingReports,
          verified: verifiedReports,
          inProgress: inProgressReports,
          resolved: resolvedReports,
        },
        systemStatus,
        moderationQueue: moderationReports.map((row: any) => buildModerationItem(row, reporterMap)),
        recentActivities,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// GET /api/admin/activity-log — Log aktivitas sistem
// ────────────────────────────────────────────
export const getActivityLog = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const limit = clamp(parseInt(req.query.limit as string, 10) || 50, 1, 100);
    const type = typeof req.query.type === 'string' ? req.query.type : 'all';
    const allowedTypes = ['all', 'report', 'action', 'user', 'status'];

    if (!allowedTypes.includes(type)) {
      res.status(400).json({ success: false, message: 'Filter tipe aktivitas tidak valid.' });
      return;
    }

    let activities = await buildActivityLog(Math.min(100, limit * 3));
    if (type !== 'all') {
      activities = activities.filter((item) => item.type === type);
    }

    res.json({
      success: true,
      message: 'Log aktivitas admin berhasil diambil.',
      data: activities.slice(0, limit),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ────────────────────────────────────────────
// POST /api/admin/users — Buat akun oleh admin
// ────────────────────────────────────────────
export const createUser = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
      district,
      city,
      province,
      instansi,
      jabatan,
      nip,
      unitKerja,
      golongan,
      tmt,
    } = req.body;

    const normalizedRole = typeof role === 'string' ? role.trim() : '';
    if (!fullName || !email || !password || !normalizedRole) {
      res.status(400).json({ success: false, message: 'Nama, email, password, dan role wajib diisi.' });
      return;
    }

    if (!['user', 'pemerintah', 'admin'].includes(normalizedRole)) {
      res.status(400).json({ success: false, message: 'Role tidak valid.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
      return;
    }

    if (normalizedRole === 'pemerintah' && !String(instansi || '').trim()) {
      res.status(400).json({ success: false, message: 'Nama instansi wajib diisi untuk akun pemerintah.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedFullName = String(fullName).trim();
    const initials = normalizedFullName
      .split(' ')
      .filter(Boolean)
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        full_name: normalizedFullName,
        phone: phone || null,
        role: normalizedRole,
      },
    });

    if (authError) {
      const authMessage = authError.message.toLowerCase();
      if (authMessage.includes('already') || authMessage.includes('registered')) {
        res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar. Gunakan email lain.',
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Gagal membuat akun baru.',
        error: authError.message,
      });
      return;
    }

    if (!authData.user) {
      res.status(500).json({ success: false, message: 'Gagal membuat akun auth.' });
      return;
    }

    const { data: metadata, error: metaError } = await supabaseAdmin
      .from('users_metadata')
      .insert({
        auth_id: authData.user.id,
        role: normalizedRole,
        full_name: normalizedFullName,
        initials,
        email: normalizedEmail,
        phone: phone || null,
        bio: '',
        district: district || '',
        city: city || 'Kota Bandung',
        province: province || 'Jawa Barat',
        eco_points: 0,
        current_badge: normalizedRole === 'user' ? 'Warga Baru' : 'Akun Baru',
        total_reports: 0,
        total_actions: 0,
        rank: 0,
        instansi: instansi || null,
        jabatan: jabatan || null,
        nip: nip || null,
        unit_kerja: unitKerja || null,
        golongan: golongan || null,
        tmt: tmt || null,
      })
      .select('id, auth_id, role, full_name, email, instansi, created_at')
      .single();

    if (metaError || !metadata) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({
        success: false,
        message: 'Akun auth berhasil dibuat, tetapi metadata gagal disimpan.',
        error: metaError?.message,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: `Akun ${normalizedRole === 'pemerintah' ? 'pemerintah' : normalizedRole === 'admin' ? 'admin' : 'pengguna'} berhasil dibuat.`,
      data: {
        id: metadata.id,
        authId: metadata.auth_id,
        role: metadata.role,
        fullName: metadata.full_name,
        email: metadata.email,
        instansi: metadata.instansi,
        createdAt: metadata.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

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
      .select('id, role, full_name, email, phone, district, city, province, instansi, jabatan, eco_points, current_badge, created_at, updated_at, settings', { count: 'exact' });

    if (role && typeof role === 'string' && ['user', 'pemerintah', 'admin'].includes(role)) {
      query = query.eq('role', role);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const value = search.trim();
      query = query.or(`full_name.ilike.%${value}%,email.ilike.%${value}%`);
    }

    if (status === 'suspended') {
      query = query.contains('settings', { suspended: true });
    }

    const validSorts = ['created_at', 'full_name', 'eco_points', 'role'];
    const sortField = validSorts.includes(sort as string) ? (sort as string) : 'created_at';
    query = query.order(sortField, { ascending: sortField === 'full_name' });
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
      user: data?.filter((row: any) => row.role === 'user').length || 0,
      pemerintah: data?.filter((row: any) => row.role === 'pemerintah').length || 0,
      admin: data?.filter((row: any) => row.role === 'admin').length || 0,
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

    const reportStats = {
      total: reports.length,
      pending: reports.filter((row: any) => row.status === 'Menunggu').length,
      verified: reports.filter((row: any) => row.status === 'Diverifikasi').length,
      inProgress: reports.filter((row: any) => row.status === 'Ditangani').length,
      resolved: reports.filter((row: any) => row.status === 'Selesai').length,
    };

    const categories: Record<string, number> = {};
    reports.forEach((row: any) => {
      categories[row.category] = (categories[row.category] || 0) + 1;
    });

    const districts: Record<string, number> = {};
    reports.forEach((row: any) => {
      if (row.district) districts[row.district] = (districts[row.district] || 0) + 1;
    });
    const topDistricts = Object.entries(districts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const userStats = {
      total: users.length,
      byRole: {
        user: users.filter((row: any) => row.role === 'user').length,
        pemerintah: users.filter((row: any) => row.role === 'pemerintah').length,
        admin: users.filter((row: any) => row.role === 'admin').length,
      },
    };

    const actionStats = {
      total: actions.length,
      totalParticipants: actions.reduce((sum: number, row: any) => sum + (row.total_participants || 0), 0),
      totalPoints: actions.reduce((sum: number, row: any) => sum + (row.points || 0), 0),
    };

    let avgResponseHours = 0;
    if (respondedReports.length > 0) {
      const totalHours = respondedReports.reduce((sum: number, row: any) => {
        const created = new Date(row.created_at).getTime();
        const updated = new Date(row.updated_at).getTime();
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
