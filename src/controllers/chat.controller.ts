// ============================================================
// Controller — Chat (AI Assistant via Gemini)
// Proses pertanyaan user, kembalikan respons dari Gemini AI
// ============================================================

import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';
import { getChatResponse } from '../services/ai.service';

/**
 * POST /api/chat
 * Proses pertanyaan user menggunakan Gemini AI
 * Body: { message: string }
 */
export const processChat = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Pesan tidak boleh kosong.',
      });
      return;
    }

    // Kirim ke Gemini AI (dengan key rotation otomatis)
    const response = await getChatResponse(message.trim());

    res.status(200).json({
      success: true,
      message: 'Respons berhasil diproses.',
      data: { response },
    });
  } catch (err) {
    logger.error('ProcessChat:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pesan.',
      data: {
        response:
          '⚠️ Maaf, terjadi kesalahan teknis. Silahkan coba lagi.\n\n' +
          'Untuk informasi darurat, hubungi:\n' +
          '📞 112 — Darurat Nasional\n' +
          '📞 113 — Pemadam Kebakaran',
      },
    });
  }
};
