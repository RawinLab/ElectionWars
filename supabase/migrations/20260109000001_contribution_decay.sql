-- ElectionWars: Contribution Decay System
-- Fixes "First Attacker Advantage" by using 300-second rolling window
-- Generated: 2026-01-09

-- ============================================
-- Table: province_contributions
-- Stores timestamped attack contributions for fair capture calculation
-- ============================================
CREATE TABLE IF NOT EXISTS province_contributions (
  id BIGSERIAL PRIMARY KEY,
  province_id INTEGER NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  damage INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_contributions_province_time ON province_contributions(province_id, created_at DESC);
CREATE INDEX idx_contributions_party ON province_contributions(party_id);
CREATE INDEX idx_contributions_cleanup ON province_contributions(created_at);

COMMENT ON TABLE province_contributions IS 'Timestamped attack contributions for 300s rolling window capture calculation';

-- ============================================
-- Function: click_province() - Updated with Contribution Decay
-- Main click handler with 300-second rolling window for fair capture
-- ============================================
CREATE OR REPLACE FUNCTION click_province(
  p_player_id UUID,
  p_province_id INTEGER,
  p_party_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_shield BIGINT;
  v_shield_max BIGINT;
  v_controlling_party INTEGER;
  v_attack_counts JSONB;
  v_new_attack_count BIGINT;
  v_max_attacker_id INTEGER;
  v_max_attack_count BIGINT;
  v_last_click TIMESTAMPTZ;
  v_result_action TEXT;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Rate limiting: Check last click timestamp (100ms cooldown)
  SELECT last_click_at INTO v_last_click
  FROM players WHERE id = p_player_id;

  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '100 milliseconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limited');
  END IF;

  -- Get current province state
  SELECT shield_current, shield_max, controlling_party_id, attack_counts
  INTO v_current_shield, v_shield_max, v_controlling_party, v_attack_counts
  FROM province_state WHERE province_id = p_province_id;

  -- Province not found
  IF v_shield_max IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Province not found');
  END IF;

  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb);
  v_new_attack_count := 0;

  -- CASE 1: Player's party controls this province → Defend/Add shield
  IF v_controlling_party = p_party_id THEN
    v_current_shield := LEAST(v_current_shield + 1, v_shield_max);
    v_result_action := 'defend';

    UPDATE province_state
    SET shield_current = v_current_shield,
        total_clicks = total_clicks + 1,
        updated_at = NOW()
    WHERE province_id = p_province_id;

  -- CASE 2 & 3: Attacking → Reduce shield
  ELSE
    v_current_shield := GREATEST(v_current_shield - 1, 0);

    -- Record contribution with timestamp
    INSERT INTO province_contributions (province_id, party_id, damage, created_at)
    VALUES (p_province_id, p_party_id, 1, NOW());

    -- Update legacy attack_counts for display purposes
    v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
    v_attack_counts := v_attack_counts || jsonb_build_object(p_party_id::text, v_new_attack_count);

    -- CASE 3: Shield depleted → Determine new owner using 300s rolling window
    IF v_current_shield = 0 THEN
      -- Calculate window start (300 seconds ago)
      v_window_start := NOW() - INTERVAL '300 seconds';

      -- Find party with most damage in the rolling window
      SELECT party_id, SUM(damage)::BIGINT INTO v_max_attacker_id, v_max_attack_count
      FROM province_contributions
      WHERE province_id = p_province_id
        AND created_at >= v_window_start
      GROUP BY party_id
      ORDER BY SUM(damage) DESC, MAX(created_at) DESC  -- Tie-breaker: most recent activity
      LIMIT 1;

      -- Fallback to legacy system if no contributions found (shouldn't happen)
      IF v_max_attacker_id IS NULL THEN
        SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
        FROM jsonb_each_text(v_attack_counts)
        ORDER BY value::bigint DESC
        LIMIT 1;
      END IF;

      v_controlling_party := v_max_attacker_id;
      v_current_shield := (v_shield_max * 0.05)::bigint;  -- 5% shield on capture
      v_attack_counts := '{}'::jsonb;  -- Reset attack counts
      v_result_action := 'capture';
      v_new_attack_count := 0;  -- Reset for response

      -- Clean up contributions for this province after capture
      DELETE FROM province_contributions WHERE province_id = p_province_id;

      UPDATE province_state
      SET controlling_party_id = v_controlling_party,
          shield_current = v_current_shield,
          attack_counts = v_attack_counts,
          total_clicks = total_clicks + 1,
          updated_at = NOW()
      WHERE province_id = p_province_id;
    ELSE
      v_result_action := 'attack';

      UPDATE province_state
      SET shield_current = v_current_shield,
          attack_counts = v_attack_counts,
          total_clicks = total_clicks + 1,
          updated_at = NOW()
      WHERE province_id = p_province_id;
    END IF;
  END IF;

  -- Update player stats
  UPDATE players
  SET total_clicks = total_clicks + 1,
      last_click_at = NOW(),
      last_active = NOW()
  WHERE id = p_player_id;

  -- Update global stats
  UPDATE game_state
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_result_action,
    'province_id', p_province_id,
    'party_id', p_party_id,
    'shield', v_current_shield,
    'shield_max', v_shield_max,
    'controlling_party', v_controlling_party,
    'your_attacks', COALESCE(v_new_attack_count, 0)
  );
END;
$$;

COMMENT ON FUNCTION click_province IS 'Main click handler with 300s rolling window for fair province capture';

-- ============================================
-- Function: cleanup_old_contributions()
-- Removes contributions older than 5 minutes to keep table small
-- Should be called periodically (e.g., every 5 minutes via cron)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_contributions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM province_contributions
  WHERE created_at < NOW() - INTERVAL '300 seconds';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_contributions IS 'Cleanup contributions older than 300 seconds';

-- ============================================
-- Function: get_province_contributions()
-- Returns current contribution counts per party for a province (last 300s)
-- ============================================
CREATE OR REPLACE FUNCTION get_province_contributions(p_province_id INTEGER)
RETURNS TABLE (
  party_id INTEGER,
  total_damage BIGINT,
  last_attack TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.party_id,
    SUM(pc.damage)::BIGINT AS total_damage,
    MAX(pc.created_at) AS last_attack
  FROM province_contributions pc
  WHERE pc.province_id = p_province_id
    AND pc.created_at >= NOW() - INTERVAL '300 seconds'
  GROUP BY pc.party_id
  ORDER BY total_damage DESC;
END;
$$;

COMMENT ON FUNCTION get_province_contributions IS 'Get current attack contributions per party for a province (300s window)';

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT, INSERT, DELETE ON province_contributions TO authenticated;
GRANT SELECT, INSERT, DELETE ON province_contributions TO anon;
GRANT USAGE, SELECT ON SEQUENCE province_contributions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE province_contributions_id_seq TO anon;
GRANT EXECUTE ON FUNCTION cleanup_old_contributions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_contributions() TO anon;
GRANT EXECUTE ON FUNCTION get_province_contributions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_province_contributions(INTEGER) TO anon;

-- ============================================
-- Enable RLS on province_contributions
-- ============================================
ALTER TABLE province_contributions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read contributions
CREATE POLICY "Anyone can view contributions"
  ON province_contributions FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow all authenticated users to insert contributions (via function)
CREATE POLICY "Anyone can insert contributions"
  ON province_contributions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow cleanup function to delete old contributions
CREATE POLICY "Anyone can delete old contributions"
  ON province_contributions FOR DELETE
  TO authenticated, anon
  USING (created_at < NOW() - INTERVAL '300 seconds');
