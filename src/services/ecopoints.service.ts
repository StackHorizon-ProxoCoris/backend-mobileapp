// ============================================================
// Service — Eco Points
// Atomic increment of user's eco_points via Supabase RPC
// ============================================================

import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

/** Points awarded per activity type */
export const ECO_POINTS = {
  CREATE_REPORT: 10,
  CREATE_ACTION: 50,
  ADD_COMMENT: 2,
  VOTE_REPORT: 2,
  VERIFY_REPORT: 5,
} as const;

/**
 * Atomically increment a user's eco_points.
 * Uses Supabase RPC to call a stored function so the update is
 * `eco_points = eco_points + amount` — no race conditions.
 *
 * This is a best-effort operation: failures are logged but do NOT
 * propagate to the caller, ensuring the main action always succeeds.
 */
export async function addEcoPoints(
  userId: string,
  amount: number,
  reason?: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('increment_eco_points', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (error) {
      logger.error(`[EcoPoints] Failed to add ${amount} pts to ${userId} (${reason}):`, error.message);
    } else {
      logger.info(`[EcoPoints] +${amount} pts → ${userId} (${reason})`);
    }
  } catch (err) {
    logger.error(`[EcoPoints] Exception adding ${amount} pts to ${userId} (${reason}):`, err);
  }
}
