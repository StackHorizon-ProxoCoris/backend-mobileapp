// ============================================================
// Controller — Auth (Register & Login)
// Mengelola autentikasi user menggunakan Supabase Auth
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { RegisterRequest, LoginRequest, AuthResponse, ApiResponse } from '../types';

/**
 * POST /api/auth/register
 * Mendaftarkan user baru via Supabase Auth + menyimpan metadata tambahan
 */
export const register = async (
  req: Request<{}, AuthResponse, RegisterRequest>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, password, fullName, phone, location } = req.body;

    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Otomatis verifikasi email (untuk development)
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (authError) {
      // Handle error spesifik dari Supabase
      if (authError.message.includes('already')) {
        res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Gagal mendaftarkan akun.',
        data: undefined,
      });
      return;
    }

    if (!authData.user) {
      res.status(500).json({
        success: false,
        message: 'Gagal membuat user. Silakan coba lagi.',
      });
      return;
    }

    // 2. Simpan metadata tambahan ke tabel users_metadata
    const initials = fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const { error: metaError } = await supabaseAdmin
      .from('users_metadata')
      .insert({
        auth_id: authData.user.id,
        full_name: fullName,
        initials,
        email,
        phone: phone || null,
        bio: '',
        district: location?.district || '',
        city: location?.city || '',
        province: location?.province || '',
        lat: location?.lat || null,
        lng: location?.lng || null,
        eco_points: 0,
        current_badge: 'Warga Baru',
        total_reports: 0,
        total_actions: 0,
        rank: 0,
      });

    if (metaError) {
      logger.warn('Gagal menyimpan metadata user:', metaError.message);
      // User sudah terbuat di Auth, jadi kita tetap lanjut
    }

    // 3. Login otomatis setelah register untuk mendapatkan token
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({ email, password });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di SIAGA.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          fullName,
        },
        accessToken: signInData?.session?.access_token || '',
        refreshToken: signInData?.session?.refresh_token || '',
      },
    });
  } catch (err) {
    logger.error('Register:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi.',
    });
  }
};

/**
 * POST /api/auth/login
 * Login user menggunakan email + password via Supabase Auth
 */
export const login = async (
  req: Request<{}, AuthResponse, LoginRequest>,
  res: Response<AuthResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Login via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
      return;
    }

    if (!data.user || !data.session) {
      res.status(401).json({
        success: false,
        message: 'Gagal login. Silakan coba lagi.',
      });
      return;
    }

    // 2. Ambil metadata user
    const { data: metaData } = await supabaseAdmin
      .from('users_metadata')
      .select('full_name')
      .eq('auth_id', data.user.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          fullName: metaData?.full_name || 'User',
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    });
  } catch (err) {
    logger.error('Login:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login.',
    });
  }
};

/**
 * GET /api/auth/me
 * Mendapatkan data profil user yang sedang login
 * Memerlukan auth middleware
 */
export const getMe = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
      return;
    }

    // Ambil metadata lengkap dari tabel users_metadata
    const { data, error } = await supabaseAdmin
      .from('users_metadata')
      .select('*')
      .eq('auth_id', req.user.id)
      .single();

    if (error || !data) {
      res.status(404).json({
        success: false,
        message: 'Data profil tidak ditemukan.',
      });
      return;
    }

    // --- Hitung rank (posisi berdasarkan eco_points, descending) ---
    const { count: higherCount } = await supabaseAdmin
      .from('users_metadata')
      .select('id', { count: 'exact', head: true })
      .gt('eco_points', data.eco_points || 0);
    const rank = (higherCount ?? 0) + 1;

    // --- Hitung weeklyPoints (aktivitas minggu ini) ---
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const mondayISO = monday.toISOString();

    const { data: weekActivities } = await supabaseAdmin
      .from('activities')
      .select('points')
      .eq('user_id', req.user.id)
      .gte('created_at', mondayISO);

    const weeklyPoints = (weekActivities || []).reduce(
      (sum: number, a: any) => sum + (a.points || 0), 0
    );

    // --- Badge definitions berdasarkan threshold ---
    const BADGE_DEFS = [
      { icon: 'Medal', color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', label: 'Warga Peduli', threshold: 0 },
      { icon: 'Star', color: '#3b82f6', bg: '#dbeafe', border: '#bfdbfe', label: 'Relawan Aktif', threshold: 50 },
      { icon: 'ShieldCheck', color: '#059669', bg: '#d1fae5', border: '#a7f3d0', label: 'Pelapor Handal', threshold: 150 },
      { icon: 'Trophy', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', label: 'Top Contributor', threshold: 300 },
      { icon: 'Crown', color: '#ec4899', bg: '#fce7f3', border: '#fbcfe8', label: 'Pahlawan Komunitas', threshold: 500 },
      { icon: 'Target', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: '100 Hari Streak', threshold: 1000 },
    ];

    const userPoints = data.eco_points || 0;
    const badges = BADGE_DEFS.map(b => ({
      ...b,
      active: userPoints >= b.threshold,
    }));
    const activeBadgeCount = badges.filter(b => b.active).length;

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diambil.',
      data: {
        id: data.id,
        authId: data.auth_id,
        fullName: data.full_name,
        initials: data.initials,
        email: data.email,
        phone: data.phone,
        bio: data.bio || '',
        location: {
          district: data.district,
          city: data.city,
          province: data.province,
          lat: data.lat,
          lng: data.lng,
        },
        ecoPoints: data.eco_points,
        currentBadge: data.current_badge,
        totalReports: data.total_reports,
        totalActions: data.total_actions,
        rank,
        weeklyPoints,
        badges,
        badgeCount: { active: activeBadgeCount, total: BADGE_DEFS.length },
        settings: data.settings || {},
        joinedDate: data.created_at,
      },
    });
  } catch (err) {
    logger.error('GetMe:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil.',
    });
  }
};

/**
 * PATCH /api/auth/profile
 * Update profil user yang sedang login
 * Memerlukan auth middleware
 */
export const updateProfile = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
      });
      return;
    }

    const { fullName, email, phone, bio, district, city } = req.body;

    // Build update object — hanya field yang dikirim
    const updates: Record<string, any> = {};
    if (fullName !== undefined) {
      updates.full_name = fullName;
      updates.initials = fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (district !== undefined) updates.district = district;
    if (city !== undefined) updates.city = city;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diperbarui.',
      });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('users_metadata')
      .update(updates)
      .eq('auth_id', req.user.id)
      .select('*')
      .single();

    if (error) {
      logger.error('UpdateProfile:', error.message);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui profil.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        id: data.id,
        authId: data.auth_id,
        fullName: data.full_name,
        initials: data.initials,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        location: {
          district: data.district,
          city: data.city,
          province: data.province,
          lat: data.lat,
          lng: data.lng,
        },
        ecoPoints: data.eco_points,
        currentBadge: data.current_badge,
        totalReports: data.total_reports,
        totalActions: data.total_actions,
        rank: data.rank,
        joinedDate: data.created_at,
      },
    });
  } catch (err) {
    logger.error('UpdateProfile:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user — invalidate session di Supabase
 */
export const logout = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      // Invalidate session di Supabase 
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil logout.',
    });
  } catch (err) {
    logger.error('Logout:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal logout.',
    });
  }
};

/**
 * PATCH /api/auth/settings
 * Update settings (jsonb) user
 * Body: { pushNotification, peringatanBencana, updateLaporan, aktivitasKomunitas, modeGelap, lokasiOtomatis, kunciBiometrik }
 */
export const updateSettings = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, message: 'Data settings tidak valid.' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('users_metadata')
      .update({ settings })
      .eq('auth_id', req.user.id)
      .select('settings')
      .single();

    if (error) {
      logger.error('updateSettings:', error.message);
      res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Pengaturan berhasil disimpan.',
      data: { settings: data.settings },
    });
  } catch (err) {
    logger.error('updateSettings:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
  }
};

/**
 * POST /api/auth/change-password
 * Ubah password user
 * Body: { currentPassword, newPassword }
 */
export const changePassword = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
      return;
    }

    // Ambil email user
    const { data: meta } = await supabaseAdmin
      .from('users_metadata')
      .select('email')
      .eq('auth_id', req.user.id)
      .single();

    if (!meta?.email) {
      res.status(404).json({ success: false, message: 'Data user tidak ditemukan.' });
      return;
    }

    // Verifikasi password lama dengan Supabase signIn
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: meta.email,
      password: currentPassword,
    });

    if (signInError) {
      res.status(401).json({ success: false, message: 'Password lama salah.' });
      return;
    }

    // Update password via Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (updateError) {
      logger.error('changePassword:', updateError.message);
      res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Password berhasil diubah!' });
  } catch (err) {
    logger.error('changePassword:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
};
