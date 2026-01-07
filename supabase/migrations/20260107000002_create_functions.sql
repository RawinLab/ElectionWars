-- ElectionWars Database Functions
-- Module 2.2: Shield System Functions
-- Generated: 2026-01-08

-- ============================================
-- Function: click_province()
-- Main click handler with shield mechanics
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

  -- CASE 1: Player's party controls this province (or neutral attacking) → Defend/Add shield
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
    v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
    v_attack_counts := v_attack_counts || jsonb_build_object(p_party_id::text, v_new_attack_count);

    -- CASE 3: Shield depleted → Determine new owner (highest attacker wins)
    IF v_current_shield = 0 THEN
      SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
      FROM jsonb_each_text(v_attack_counts)
      ORDER BY value::bigint DESC
      LIMIT 1;

      v_controlling_party := v_max_attacker_id;
      v_current_shield := (v_shield_max * 0.05)::bigint;  -- 5% shield on capture
      v_attack_counts := '{}'::jsonb;  -- Reset attack counts
      v_result_action := 'capture';
      v_new_attack_count := 0;  -- Reset for response

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

COMMENT ON FUNCTION click_province IS 'Main click handler: defend (+1 shield), attack (-1 shield), or capture (when shield=0)';

-- ============================================
-- Function: join_game()
-- Player registration with party selection
-- ============================================
CREATE OR REPLACE FUNCTION join_game(
  p_auth_id UUID,
  p_party_id INTEGER,
  p_nickname VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_player_id UUID;
  v_new_player_id UUID;
BEGIN
  -- Check if player already exists
  SELECT id INTO v_existing_player_id
  FROM players WHERE auth_id = p_auth_id;

  IF v_existing_player_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'player_id', v_existing_player_id,
      'existing', true
    );
  END IF;

  -- Validate party exists
  IF NOT EXISTS (SELECT 1 FROM parties WHERE id = p_party_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid party'
    );
  END IF;

  -- Create new player
  INSERT INTO players (auth_id, party_id, nickname, total_clicks, last_active, created_at)
  VALUES (p_auth_id, p_party_id, p_nickname, 0, NOW(), NOW())
  RETURNING id INTO v_new_player_id;

  -- Increment total_players in game_state
  UPDATE game_state
  SET total_players = total_players + 1,
      updated_at = NOW()
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'player_id', v_new_player_id,
    'existing', false
  );
END;
$$;

COMMENT ON FUNCTION join_game IS 'Register new player with party selection, or return existing player';

-- ============================================
-- Function: change_party()
-- Party switching with 24hr cooldown and click reset
-- ============================================
CREATE OR REPLACE FUNCTION change_party(
  p_player_id UUID,
  p_new_party_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_party_id INTEGER;
  v_party_changed_at TIMESTAMPTZ;
  v_hours_remaining NUMERIC;
BEGIN
  -- Get current player data
  SELECT party_id, party_changed_at
  INTO v_current_party_id, v_party_changed_at
  FROM players WHERE id = p_player_id;

  -- Player not found
  IF v_current_party_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Player not found'
    );
  END IF;

  -- Check if trying to change to same party
  IF v_current_party_id = p_new_party_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already in this party'
    );
  END IF;

  -- Validate new party exists
  IF NOT EXISTS (SELECT 1 FROM parties WHERE id = p_new_party_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid party'
    );
  END IF;

  -- Check 24hr cooldown
  IF v_party_changed_at IS NOT NULL THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_party_changed_at + INTERVAL '24 hours' - NOW())) / 3600;

    IF v_hours_remaining > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cooldown active',
        'hours_remaining', ROUND(v_hours_remaining::numeric, 1)
      );
    END IF;
  END IF;

  -- Update player: change party, reset clicks, set cooldown timestamp
  UPDATE players
  SET party_id = p_new_party_id,
      total_clicks = 0,
      party_changed_at = NOW(),
      last_active = NOW()
  WHERE id = p_player_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_party', v_current_party_id,
    'new_party', p_new_party_id,
    'clicks_reset', true
  );
END;
$$;

COMMENT ON FUNCTION change_party IS 'Switch party with 24hr cooldown and click reset';

-- ============================================
-- Function: get_leaderboard()
-- Party rankings sorted by provinces controlled
-- ============================================
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  party_id INTEGER,
  party_name VARCHAR,
  official_color VARCHAR,
  provinces_controlled BIGINT,
  total_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH party_stats AS (
    SELECT
      p.id AS party_id,
      p.name_thai AS party_name,
      p.official_color,
      COALESCE(COUNT(ps.province_id), 0)::BIGINT AS provinces_controlled,
      COALESCE(SUM(pl.total_clicks), 0)::BIGINT AS total_clicks
    FROM parties p
    LEFT JOIN province_state ps ON ps.controlling_party_id = p.id
    LEFT JOIN players pl ON pl.party_id = p.id
    GROUP BY p.id, p.name_thai, p.official_color
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY party_stats.provinces_controlled DESC,
               party_stats.total_clicks DESC
    ) AS rank,
    party_stats.party_id,
    party_stats.party_name,
    party_stats.official_color,
    party_stats.provinces_controlled,
    party_stats.total_clicks
  FROM party_stats
  ORDER BY rank;
END;
$$;

COMMENT ON FUNCTION get_leaderboard IS 'Return party rankings sorted by provinces controlled, then by total clicks';

-- ============================================
-- Function: init_province_shields()
-- Initialize all provinces with 50% shield
-- ============================================
CREATE OR REPLACE FUNCTION init_province_shields()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update province_state for all provinces
  INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, controlling_party_id)
  SELECT
    p.id,
    (p.population / 10)::BIGINT AS shield_max,
    ((p.population / 10) * 0.5)::BIGINT AS shield_current,  -- 50% shield
    '{}'::jsonb AS attack_counts,
    NULL AS controlling_party_id  -- Neutral
  FROM provinces p
  ON CONFLICT (province_id)
  DO UPDATE SET
    shield_max = EXCLUDED.shield_max,
    shield_current = EXCLUDED.shield_current,
    attack_counts = EXCLUDED.attack_counts,
    controlling_party_id = EXCLUDED.controlling_party_id,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION init_province_shields IS 'Initialize all provinces with 50% shield (neutral state)';

-- ============================================
-- Grant execute permissions to authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION click_province(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION click_province(UUID, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION join_game(UUID, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION join_game(UUID, INTEGER, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION change_party(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION change_party(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION init_province_shields() TO authenticated;
