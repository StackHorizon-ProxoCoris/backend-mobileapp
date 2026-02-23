// ============================================================
// Controller — Upload (File Upload ke Supabase Storage)
// Upload dan hapus foto bukti laporan/aksi
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { config } from '../config/env';
import { ApiResponse, UploadResponse } from '../types';
import crypto from 'crypto';

const BUCKET_NAME = 'report-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * POST /api/upload
 * Upload foto ke Supabase Storage
 * Menggunakan multer middleware untuk parsing multipart form
 */
export const uploadPhoto = async (
  req: Request,
  res: Response<ApiResponse<UploadResponse>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'File foto wajib disertakan.' });
      return;
    }

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `Tipe file tidak didukung. Gunakan: ${ALLOWED_TYPES.join(', ')}`,
      });
      return;
    }

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      res.status(400).json({
        success: false,
        message: 'Ukuran file maksimal 5MB.',
      });
      return;
    }

    // Generate nama file unik
    const ext = file.originalname.split('.').pop() || 'jpg';
    const uniqueName = `${req.user.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    // Upload ke Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(uniqueName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal upload foto.', error: error.message });
      return;
    }

    // Dapatkan public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    res.status(201).json({
      success: true,
      message: 'Foto berhasil diupload.',
      data: {
        url: urlData.publicUrl,
        path: data.path,
        filename: uniqueName,
      },
    });
  } catch (err) {
    logger.error('uploadPhoto:', err);
    res.status(500).json({ success: false, message: 'Gagal upload foto.' });
  }
};

/**
 * DELETE /api/upload/:filename
 * Hapus foto dari Supabase Storage
 * :filename format: userId/timestamp-hash.ext
 */
export const deletePhoto = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      return;
    }

    const filename = req.query.filename as string;
    if (!filename) {
      res.status(400).json({ success: false, message: 'Parameter filename wajib diisi.' });
      return;
    }

    // Keamanan: pastikan user hanya bisa hapus file miliknya sendiri
    if (!filename.startsWith(req.user.id)) {
      res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menghapus file ini.' });
      return;
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      res.status(400).json({ success: false, message: 'Gagal menghapus foto.', error: error.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Foto berhasil dihapus.' });
  } catch (err) {
    logger.error('deletePhoto:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
  }
};
