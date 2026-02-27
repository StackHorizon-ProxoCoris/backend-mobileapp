// ============================================================
// Controller — Info & Edukasi (Articles)
// List + Detail with view count increment
// ============================================================

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

// ============================================================
// Types
// ============================================================

interface InfoArticleResponse {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  category: string;
  source: string;
  color: string;
  bg: string;
  gradient: string;
  content: string[];
  photoUrls: string[];
  tags: string[];
  tips: { icon: string; title: string; desc: string }[];
  relatedLinks: { title: string; url: string }[];
  author: {
    name: string;
    initials: string;
    role: string;
    organization: string;
  };
  stats: {
    views: number;
    shares: number;
    bookmarks: number;
  };
  verified: boolean;
  verifiedBy: string | null;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
}

// ============================================================
// Helpers
// ============================================================

function formatArticle(row: any): InfoArticleResponse {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle || '',
    category: row.category,
    source: row.source || '',
    color: row.color || '#3b82f6',
    bg: row.bg || '#eff6ff',
    gradient: row.gradient || '#3b82f6',
    content: row.content || [],
    photoUrls: row.photo_urls || [],
    tags: row.tags || [],
    tips: row.tips || [],
    relatedLinks: row.related_links || [],
    author: {
      name: row.author_name || '',
      initials: row.author_initials || '',
      role: row.author_role || '',
      organization: row.author_organization || '',
    },
    stats: {
      views: row.stats_views || 0,
      shares: row.stats_shares || 0,
      bookmarks: row.stats_bookmarks || 0,
    },
    verified: row.verified || false,
    verifiedBy: row.verified_by || null,
    readTime: row.read_time || '3 menit',
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// Controllers
// ============================================================

/**
 * GET /api/info
 * Mengambil daftar artikel info & edukasi dengan pagination
 * Query params: ?category=cuaca&page=1&limit=10
 */
export const getInfoList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, parseInt(limit as string, 10));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('info_articles')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filter opsional per kategori
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;

    if (error) {
      logger.error('getInfoList:', error);
      res.status(400).json({ success: false, message: 'Gagal mengambil daftar info.', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Daftar info berhasil diambil.',
      data: (data || []).map(formatArticle),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    logger.error('getInfoList:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar info.' });
  }
};

/**
 * GET /api/info/:id
 * Mengambil detail artikel dan increment stats_views
 */
export const getInfoById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Ambil artikel
    const { data: article, error } = await supabaseAdmin
      .from('info_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !article) {
      res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
      return;
    }

    // Increment views (best-effort, tidak block response)
    void supabaseAdmin
      .from('info_articles')
      .update({ stats_views: (article.stats_views || 0) + 1 })
      .eq('id', id);

    res.status(200).json({
      success: true,
      message: 'Detail artikel berhasil diambil.',
      data: formatArticle(article),
    });
  } catch (err) {
    logger.error('getInfoById:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail artikel.' });
  }
};
