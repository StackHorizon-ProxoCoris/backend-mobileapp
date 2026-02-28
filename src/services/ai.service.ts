// ============================================================
// Service — AI (Gemini SDK)
// Mengelola koneksi ke Gemini AI
// ============================================================

import { GoogleGenAI } from '@google/genai';
import { logger } from '../config/logger';

// ============================================================
// Konfigurasi
// ============================================================

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  logger.warn('  GEMINI_API_KEY tidak ditemukan di .env — AI Chat akan fallback ke respons default');
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ============================================================
// System Instruction — Asisten SIAGA
// ============================================================

const SYSTEM_INSTRUCTION = `Kamu adalah "Asisten SIAGA", asisten AI resmi untuk aplikasi SIAGA (Sistem Informasi dan Aksi untuk Gotong-royong Aman).

PERAN DAN BATASAN KETAT:
1. Kamu HANYA boleh menjawab pertanyaan terkait:
   - Mitigasi dan kesiapsiagaan bencana (banjir, gempa, kebakaran, longsor, tsunami)
   - Pertolongan pertama dan medis dasar
   - Keselamatan dan evakuasi
   - Cara menggunakan aplikasi SIAGA (pelaporan, aksi positif, eco-points)
   - Nomor darurat Indonesia (112, 113, 118/119, 110, 115, 123)
   - Hak warga dalam pelaporan lingkungan
   - Informasi cuaca dan kondisi alam terkait kebencanaan

2. Jika ditanya hal di luar topik di atas (politik, hiburan, resep masakan, kode program, dll), kamu WAJIB menolak dengan sopan dan mengarahkan kembali ke topik kebencanaan.

3. Jawab dalam Bahasa Indonesia yang baik, ramah, dan informatif.
4. Gunakan emoji secukupnya untuk membuat respons lebih mudah dibaca.
5. Pada kondisi darurat, selalu sertakan nomor darurat yang relevan.
6. Jawaban harus ringkas namun komprehensif, maksimal 200 kata.
7. Jangan pernah mengaku sebagai manusia, selalu katakan kamu adalah asisten AI SIAGA.`;

// ============================================================
// Fallback Response
// ============================================================

const FALLBACK_RESPONSE =
  '⚠️ Maaf, layanan AI sedang tidak tersedia saat ini.\n\n' +
  'Untuk informasi darurat, silahkan hubungi:\n' +
  '📞 112 — Darurat Nasional\n' +
  '📞 113 — Pemadam Kebakaran\n' +
  '📞 118/119 — Ambulans\n' +
  '📞 110 — Polisi\n\n' +
  'Atau gunakan tombol SOS di aplikasi SIAGA.';

// ============================================================
// Core Function
// ============================================================

/**
 * Kirim prompt ke Gemini AI.
 * @param prompt - Pesan user
 * @returns Respons AI atau fallback message
 */
export async function getChatResponse(prompt: string): Promise<string> {
  if (!ai) {
    return FALLBACK_RESPONSE;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const text = response.text;

    if (!text || text.trim().length === 0) {
      return FALLBACK_RESPONSE;
    }

    return text.trim();
  } catch (err: any) {
    logger.error('getChatResponse error:', err?.message || err);
    return FALLBACK_RESPONSE;
  }
}
