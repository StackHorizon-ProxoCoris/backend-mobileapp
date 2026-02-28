// ============================================================
// Service — Push Notification Delivery (Expo Push API)
// Mengirim notifikasi push ke perangkat via Expo Server SDK
// ============================================================

import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

// Inisialisasi singleton Expo SDK client
const expo = new Expo();

// ============================================================
// Core Push Function
// ============================================================

/**
 * Kirim push notification ke semua perangkat aktif milik user-user tertentu.
 *
 * Alur:
 * 1. Query `device_tokens` WHERE user_id IN (userIds) AND active = true
 * 2. Validasi token via `Expo.isExpoPushToken(token)`
 * 3. Chunk pesan dan kirim via Expo Push API
 * 4. Auto-cleanup: nonaktifkan token yang error `DeviceNotRegistered`
 *
 * @param userIds  - array user_id (auth_id) yang akan menerima push
 * @param title    - judul notifikasi
 * @param body     - isi pesan notifikasi
 * @param data     - payload tambahan (refType, refId untuk deep-linking)
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    // 1. Query semua token aktif milik user-user tersebut
    const { data: tokenRows, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('active', true);

    if (error || !tokenRows || tokenRows.length === 0) {
      if (error) logger.error('sendPushToUsers query error:', error.message);
      return;
    }

    // 2. Filter hanya token Expo yang valid
    const validTokens = tokenRows
      .map(row => row.token)
      .filter(token => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) return;

    // 3. Bangun array pesan
    const messages: ExpoPushMessage[] = validTokens.map(pushToken => ({
      to: pushToken,
      title,
      body,
      sound: 'default' as const,
      data: data || {},
      priority: 'high' as const,
      channelId: 'default',
    }));

    // 4. Chunk dan kirim — Expo SDK otomatis batasi per chunk
    const chunks = expo.chunkPushNotifications(messages);

    const allTickets: ExpoPushTicket[] = [];
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        allTickets.push(...tickets);
      } catch (chunkErr) {
        logger.error('sendPushToUsers chunk error:', chunkErr);
      }
    }

    // 5. Auto-cleanup: nonaktifkan token yang error DeviceNotRegistered
    const tokensToDeactivate: string[] = [];
    allTickets.forEach((ticket, idx) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        tokensToDeactivate.push(validTokens[idx]);
      }
    });

    if (tokensToDeactivate.length > 0) {
      await deactivateTokens(tokensToDeactivate);
      logger.info(`Auto-cleanup: ${tokensToDeactivate.length} token dinonaktifkan (DeviceNotRegistered)`);
    }

    logger.info(`Push dikirim: ${validTokens.length} perangkat, ${tokensToDeactivate.length} dibersihkan`);
  } catch (err) {
    logger.error('sendPushToUsers exception:', err);
  }
}

// ============================================================
// Helper: Deactivate Tokens
// ============================================================

/**
 * Nonaktifkan token yang sudah tidak valid (DeviceNotRegistered).
 * Menjaga database tetap bersih dari token mati.
 */
async function deactivateTokens(tokens: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('device_tokens')
      .update({ active: false, updated_at: new Date().toISOString() })
      .in('token', tokens);

    if (error) {
      logger.error('deactivateTokens error:', error.message);
    }
  } catch (err) {
    logger.error('deactivateTokens exception:', err);
  }
}
