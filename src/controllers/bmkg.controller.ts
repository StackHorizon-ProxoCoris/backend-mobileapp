// ============================================================
// Controller — BMKG Earthquake Data
// Fetch & parse gempa terkini dari API resmi BMKG (XML)
// ============================================================

import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';

const BMKG_AUTOGEMPA_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml';
const BMKG_SHAKEMAP_BASE = 'https://data.bmkg.go.id/DataMKG/TEWS/';
const FETCH_TIMEOUT_MS = 5000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

export const getGempaTerkini = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch dengan timeout 5 detik
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(BMKG_AUTOGEMPA_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/xml' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(502).json({
        success: false,
        message: 'Gagal mengambil data dari BMKG.',
      });
      return;
    }

    const xmlText = await response.text();
    const parsed = xmlParser.parse(xmlText);

    const gempa = parsed?.Infogempa?.gempa;
    if (!gempa) {
      res.status(502).json({
        success: false,
        message: 'Format data BMKG tidak sesuai.',
      });
      return;
    }

    // Ekstrak koordinat dari <point><coordinates>
    const rawCoords = gempa.point?.coordinates || '';
    const [lat, lng] = rawCoords.split(',').map(Number);

    const data = {
      tanggal: gempa.Tanggal || '',
      jam: gempa.Jam || '',
      dateTime: gempa.DateTime || '',
      magnitude: gempa.Magnitude || '',
      kedalaman: gempa.Kedalaman || '',
      wilayah: gempa.Wilayah || '',
      potensi: gempa.Potensi || '',
      dirasakan: gempa.Dirasakan || '',
      lintang: gempa.Lintang || '',
      bujur: gempa.Bujur || '',
      coordinates: { lat: lat || 0, lng: lng || 0 },
      shakemapUrl: gempa.Shakemap
        ? `${BMKG_SHAKEMAP_BASE}${gempa.Shakemap}`
        : null,
    };

    res.status(200).json({
      success: true,
      message: 'Data gempa terkini berhasil diambil.',
      data,
    });
  } catch (error: any) {
    // AbortError = timeout, lainnya = network/parse error
    const isTimeout = error?.name === 'AbortError';
    console.error('[BMKG] Fetch error:', isTimeout ? 'Timeout' : error?.message);

    res.status(502).json({
      success: false,
      message: isTimeout
        ? 'Koneksi ke BMKG timeout. Coba lagi nanti.'
        : 'Gagal mengambil data gempa dari BMKG.',
    });
  }
};
