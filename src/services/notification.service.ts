// ============================================================
// Service — Notification
// Fungsi helper untuk membuat notifikasi dan pencarian user
// berdasarkan radius (Haversine) atau zona (district fallback)
// ============================================================

import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { sendPushToUsers } from './push.service';

// ============================================================
// Tipe & Konstanta
// ============================================================

export type NotificationType =
  | 'status_update'
  | 'vote'
  | 'verify'
  | 'comment'
  | 'new_report'
  | 'new_action'
  | 'info';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  refType?: 'report' | 'action';
  refId?: string;
}

/**
 * Radius dinamis per kategori laporan (dalam kilometer).
 * Bencana alam & banjir punya radius besar karena dampak luas.
 * Infrastruktur & kebakaran radius kecil karena dampak lokal.
 */
const CATEGORY_RADIUS_KM: Record<string, number> = {
  'Banjir': 5,
  'Longsor': 5,
  'Bencana Alam': 5,
  'Kebakaran': 1,
  'Jalan Rusak': 1,
  'Infrastruktur': 1,
  'Sampah': 0.5,
  'Pohon': 1,
};
const DEFAULT_RADIUS_KM = 2;

// ============================================================
// Haversine Distance (km)
// ============================================================

/**
 * Menghitung jarak antara dua titik koordinat menggunakan rumus Haversine.
 * @returns jarak dalam kilometer
 */
function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius bumi (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Insert notifikasi ke tabel `notifications`.
 * Best-effort: jika gagal, log error tapi tidak throw.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      ref_type: params.refType || null,
      ref_id: params.refId || null,
      is_read: false,
    });

    if (error) {
      logger.error('createNotification insert error:', error.message);
    } else {
      // Fire-and-forget: kirim push notification ke perangkat
      sendPushToUsers(
        [params.userId],
        params.title,
        params.message,
        { refType: params.refType || null, refId: params.refId || null }
      ).catch(e => logger.error('createNotification push error:', e));
    }
  } catch (err) {
    logger.error('createNotification exception:', err);
  }
}

/**
 * Batch insert notifikasi ke banyak user sekaligus.
 * Lebih efisien daripada looping `createNotification` satu per satu.
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    // Deduplicate
    const unique = [...new Set(userIds)];

    const rows = unique.map(uid => ({
      user_id: uid,
      type: params.type,
      title: params.title,
      message: params.message,
      ref_type: params.refType || null,
      ref_id: params.refId || null,
      is_read: false,
    }));

    const { error } = await supabaseAdmin.from('notifications').insert(rows);

    if (error) {
      logger.error('createBulkNotifications insert error:', error.message);
    } else {
      logger.info(`Notifikasi dikirim ke ${unique.length} user (type: ${params.type})`);

      // Fire-and-forget: kirim push notification ke semua perangkat
      sendPushToUsers(
        unique,
        params.title,
        params.message,
        { refType: params.refType || null, refId: params.refId || null }
      ).catch(e => logger.error('createBulkNotifications push error:', e));
    }
  } catch (err) {
    logger.error('createBulkNotifications exception:', err);
  }
}

/**
 * Ambil daftar `auth_id` user yang berada dalam radius tertentu dari titik koordinat.
 *
 * Strategi:
 * 1. Query semua user yang punya lat/lng dari `users_metadata`
 * 2. Filter menggunakan Haversine distance
 * 3. Fallback: jika user tidak punya lat/lng tapi punya district yang cocok, masukkan juga
 *
 * @param lat - latitude titik laporan
 * @param lng - longitude titik laporan
 * @param category - kategori laporan (menentukan radius)
 * @param reporterDistrict - kecamatan pelapor (untuk district fallback)
 * @param excludeUserId - user yang dikecualikan (biasanya pelapor sendiri)
 */
export async function getUsersInRadius(
  lat: number,
  lng: number,
  category: string,
  reporterDistrict?: string,
  excludeUserId?: string
): Promise<string[]> {
  try {
    const radiusKm = CATEGORY_RADIUS_KM[category] ?? DEFAULT_RADIUS_KM;

    // Ambil semua user dengan lokasi atau district yang cocok
    const { data: users, error } = await supabaseAdmin
      .from('users_metadata')
      .select('auth_id, lat, lng, district');

    if (error || !users) {
      logger.error('getUsersInRadius query error:', error?.message);
      return [];
    }

    const result: string[] = [];

    for (const user of users) {
      // Skip pelapor sendiri
      if (excludeUserId && user.auth_id === excludeUserId) continue;

      // Strategi 1: Haversine jika user punya koordinat
      if (user.lat != null && user.lng != null) {
        const distance = haversineDistanceKm(lat, lng, user.lat, user.lng);
        if (distance <= radiusKm) {
          result.push(user.auth_id);
          continue;
        }
      }

      // Strategi 2: District fallback jika user belum punya koordinat
      if (
        reporterDistrict &&
        user.district &&
        user.district.toLowerCase() === reporterDistrict.toLowerCase()
      ) {
        result.push(user.auth_id);
      }
    }

    return result;
  } catch (err) {
    logger.error('getUsersInRadius exception:', err);
    return [];
  }
}

/**
 * Ambil semua `auth_id` user dengan role 'pemerintah'.
 */
export async function getGovUserIds(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users_metadata')
      .select('auth_id')
      .eq('role', 'pemerintah');

    if (error || !data) {
      logger.error('getGovUserIds query error:', error?.message);
      return [];
    }

    return data.map(u => u.auth_id);
  } catch (err) {
    logger.error('getGovUserIds exception:', err);
    return [];
  }
}
