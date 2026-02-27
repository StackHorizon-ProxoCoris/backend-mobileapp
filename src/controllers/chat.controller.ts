// ============================================================
// Controller — Chat (AI Assistant)
// Proses pertanyaan user, kembalikan respons AI
// ============================================================

import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

// Pattern-based responses (siap diganti dengan real AI engine di masa depan)
const RESPONSE_PATTERNS: { keywords: string[]; response: string }[] = [
  {
    keywords: ['banjir', 'mitigasi', 'bencana alam'],
    response: '🌊 **Tips Mitigasi Banjir:**\n\n1. Pantau peringatan BMKG via aplikasi SIAGA\n2. Siapkan tas darurat (dokumen, obat, senter)\n3. Ketahui rute evakuasi terdekat\n4. Pastikan saluran air di sekitar rumah tidak tersumbat\n5. Simpan nomor darurat: 112\n\nJika air sudah naik, segera ke tempat tinggi dan hubungi SAR (115).',
  },
  {
    keywords: ['lapor', 'cara', 'pelaporan', 'membuat laporan'],
    response: '📝 **Cara Membuat Laporan:**\n\n1. Buka tab "Lapor"\n2. Pilih kategori masalah\n3. Ambil foto bukti (min. 1 foto)\n4. Tulis deskripsi singkat\n5. Lokasi otomatis terdeteksi GPS\n6. Tap "Kirim Laporan"\n\n✅ Laporan akan divalidasi AI dalam 1-3 menit.\n⭐ Dapatkan Eco-Points untuk setiap laporan valid!',
  },
  {
    keywords: ['gempa', 'earthquake'],
    response: '🏚️ **Panduan Gempa Bumi:**\n\n1. Drop, Cover, Hold On — berlindung di bawah meja kokoh\n2. Jauhi jendela, kaca, dan benda berat\n3. Jika di luar, jauhi gedung dan kabel listrik\n4. Setelah gempa, periksa kerusakan struktur\n5. Waspadai aftershock (gempa susulan)\n\n📞 Hubungi BNPB: 117 atau BMKG untuk info terkini.',
  },
  {
    keywords: ['kebakaran', 'api', 'pemadam'],
    response: '🔥 **Panduan Kebakaran:**\n\n1. Segera keluar bangunan lewat jalur evakuasi\n2. Jangan gunakan lift\n3. Tutup hidung dengan kain basah\n4. Merunduk saat melewati area berasap\n5. Hubungi pemadam kebakaran: 113\n\n⚠️ Jangan kembali ke bangunan yang terbakar!',
  },
  {
    keywords: ['darurat', 'emergency', 'sos', 'bantuan'],
    response: '🆘 **Nomor Darurat Penting:**\n\n📞 112 — Darurat Umum\n📞 113 — Pemadam Kebakaran\n📞 115 — SAR (Pencarian & Penyelamatan)\n📞 118/119 — Ambulance\n📞 110 — Polisi\n📞 117 — BNPB\n\n💡 Gunakan tombol SOS di aplikasi SIAGA untuk laporan cepat dengan lokasi otomatis.',
  },
  {
    keywords: ['eco', 'points', 'poin', 'reward'],
    response: '⭐ **Sistem Eco-Points:**\n\n• Buat laporan valid: +10 poin\n• Verifikasi laporan: +5 poin\n• Dukung laporan: +2 poin\n• Aksi nyata: +15 poin\n• Komentar bermanfaat: +3 poin\n\n🏆 Kumpulkan poin untuk naik level dan dapatkan badge!',
  },
  {
    keywords: ['hak', 'warga', 'kewajiban', 'undang'],
    response: '📜 **Hak Warga dalam Pelaporan:**\n\n1. Hak melapor masalah lingkungan (UU No. 32/2009)\n2. Hak mendapat respons dari pemerintah\n3. Hak atas informasi publik (UU No. 14/2008)\n4. Perlindungan identitas pelapor\n5. Hak atas lingkungan hidup yang baik dan sehat\n\n✅ Semua laporan di SIAGA dilindungi oleh regulasi.',
  },
];

const DEFAULT_RESPONSE = '✨ Terima kasih atas pertanyaan Anda! Saya sedang memproses informasi terkait.\n\nUntuk informasi darurat, gunakan tombol SOS atau hubungi:\n📞 112 (Darurat Umum)\n📞 113 (Pemadam)\n📞 118 (Ambulance)\n\nAda pertanyaan lain yang bisa saya bantu?';

function findResponse(question: string): string {
  const lower = question.toLowerCase();
  for (const pattern of RESPONSE_PATTERNS) {
    if (pattern.keywords.some(kw => lower.includes(kw))) {
      return pattern.response;
    }
  }
  return DEFAULT_RESPONSE;
}

/**
 * POST /api/chat
 * Proses pertanyaan user, kembalikan respons AI
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

    const response = findResponse(message.trim());

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
      data: { response: DEFAULT_RESPONSE },
    });
  }
};
