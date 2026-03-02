-- ============================================================
-- Migration 013: Stored function for atomic eco_points increment
-- Called via supabaseAdmin.rpc('increment_eco_points', { ... })
-- ============================================================

CREATE OR REPLACE FUNCTION increment_eco_points(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users_metadata
  SET eco_points = COALESCE(eco_points, 0) + p_amount
  WHERE auth_id = p_user_id;
END;
$$;
