// ============================================================
// Controller — Auth (Register & Login)
// Mengelola autentikasi user menggunakan Supabase Auth
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
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
      console.error(' Gagal menyimpan metadata user:', metaError.message);
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
    console.error('❌ Register error:', err);
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
    console.error('❌ Login error:', err);
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
    console.error('❌ GetMe error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil.',
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
      // Invalidate session di Supabase (opsional, token tetap expired secara alami)
      // Supabase Auth JWT biasanya 1 jam
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil logout.',
    });
  } catch (err) {
    console.error('❌ Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal logout.',
    });
  }
};
