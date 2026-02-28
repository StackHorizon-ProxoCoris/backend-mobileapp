// ============================================================
// Controller — Device Token (Push Notification Token Registry)
// Mengelola registrasi dan update token push notification
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

/**
 * POST /api/device-tokens
 * Upsert token push notification perangkat
 * Body: { token, platform }
 * 
 * Logika:
 * - Jika token sudah ada → update user_id, platform, active, updated_at
 * - Jika token belum ada → insert baru
 * - Satu token hanya bisa dimiliki satu user (device berpindah akun)
 */
export const registerDeviceToken = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User tidak terautentikasi.' });
      return;
    }

    const { token, platform } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Token wajib diisi.' });
      return;
    }

    const validPlatform = ['android', 'ios', 'web'].includes(platform) ? platform : 'android';

    // Upsert: insert baru atau update jika token sudah ada
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .upsert(
        {
          user_id: req.user.id,
          token,
          platform: validPlatform,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      )
      .select('id, token, platform, active')
      .single();

    if (error) {
      logger.error('registerDeviceToken:', error.message);
      res.status(500).json({ success: false, message: 'Gagal menyimpan token perangkat.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token perangkat berhasil disimpan.',
      data,
    });
  } catch (err) {
    logger.error('registerDeviceToken:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan token perangkat.' });
  }
};

/**
 * DELETE /api/device-tokens
 * Nonaktifkan token perangkat saat logout
 * Body: { token }
 */
export const deactivateDeviceToken = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Token wajib diisi.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('device_tokens')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      logger.error('deactivateDeviceToken:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Token perangkat dinonaktifkan.',
    });
  } catch (err) {
    logger.error('deactivateDeviceToken:', err);
    res.status(500).json({ success: false, message: 'Gagal menonaktifkan token.' });
  }
};
