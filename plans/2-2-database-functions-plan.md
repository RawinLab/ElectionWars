# Plan: Database Functions (Module 2.2)

## Module Information
- **Module:** 2.2
- **Name:** Database Functions (Shield System)
- **Dependencies:** 2.1 (Database Tables)
- **Priority:** CRITICAL
- **Estimated:** 1-2 days

---

## Features

### 2.2.1 click_province() - Main Click Handler
Shield-based click mechanic with defend/attack logic

### 2.2.2 join_game() - Player Registration
Create new player with party selection

### 2.2.3 change_party() - Party Switching
Switch party with 24hr cooldown and click reset

### 2.2.4 get_leaderboard() - Party Rankings
Return parties sorted by provinces controlled

### 2.2.5 init_province_shields() - Game Initialization
Initialize all provinces with 50% shield

---

## Technical Design

### Function Signatures (Exact Contracts)

#### click_province()
```sql
-- Input
CREATE OR REPLACE FUNCTION click_province(
  p_player_id UUID,
  p_province_id INTEGER,
  p_party_id INTEGER
) RETURNS JSONB

-- Output Success (Defend)
{
  "success": true,
  "action": "defend",
  "province_id": 1,
  "party_id": 1,
  "shield": 272801,
  "shield_max": 545600,
  "controlling_party": 1,
  "your_attacks": 0
}

-- Output Success (Attack)
{
  "success": true,
  "action": "attack",
  "province_id": 1,
  "party_id": 2,
  "shield": 272799,
  "shield_max": 545600,
  "controlling_party": 1,
  "your_attacks": 1
}

-- Output Success (Capture)
{
  "success": true,
  "action": "capture",
  "province_id": 1,
  "party_id": 2,
  "shield": 27280,
  "shield_max": 545600,
  "controlling_party": 2,
  "your_attacks": 0
}

-- Output Error (Rate Limited)
{
  "success": false,
  "error": "Rate limited"
}
```

#### join_game()
```sql
-- Input
CREATE OR REPLACE FUNCTION join_game(
  p_auth_id UUID,
  p_party_id INTEGER,
  p_nickname VARCHAR(100)
) RETURNS JSONB

-- Output Success (New Player)
{
  "success": true,
  "player_id": "uuid-xxx",
  "existing": false
}

-- Output Success (Existing Player)
{
  "success": true,
  "player_id": "uuid-xxx",
  "existing": true
}
```

#### change_party()
```sql
-- Input
CREATE OR REPLACE FUNCTION change_party(
  p_player_id UUID,
  p_new_party_id INTEGER
) RETURNS JSONB

-- Output Success
{
  "success": true,
  "old_party": 1,
  "new_party": 2,
  "clicks_reset": true
}

-- Output Error (Cooldown)
{
  "success": false,
  "error": "Cooldown active",
  "hours_remaining": 12.5
}

-- Output Error (Same Party)
{
  "success": false,
  "error": "Already in this party"
}
```

#### get_leaderboard()
```sql
-- Input: None
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  party_id INTEGER,
  party_name VARCHAR,
  official_color VARCHAR,
  provinces_controlled BIGINT,
  total_clicks BIGINT
)

-- Output Example
[
  { "rank": 1, "party_id": 1, "party_name": "พรรคเพื่อไทย", "official_color": "#E31838", "provinces_controlled": 25, "total_clicks": 1500000 },
  { "rank": 2, "party_id": 2, "party_name": "พรรคประชาชน", "official_color": "#FF7A00", "provinces_controlled": 20, "total_clicks": 1200000 }
]
```

#### init_province_shields()
```sql
-- Input: None
CREATE OR REPLACE FUNCTION init_province_shields()
RETURNS void

-- Effect: Updates all province_state rows
-- - shield_max = population / 10
-- - shield_current = shield_max * 0.5 (50%)
-- - attack_counts = '{}'
-- - controlling_party_id = NULL
```

---

## Full Implementation

### click_province() - Full Code
```sql
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
  -- Rate limiting: Check last click timestamp
  SELECT last_click_at INTO v_last_click
  FROM players WHERE id = p_player_id;

  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '100 milliseconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limited');
  END IF;

  -- Get current province state
  SELECT shield_current, shield_max, controlling_party_id, attack_counts
  INTO v_current_shield, v_shield_max, v_controlling_party, v_attack_counts
  FROM province_state WHERE province_id = p_province_id;

  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb);

  -- CASE 1: Player's party controls this province → Add shield
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

    -- CASE 3: Shield depleted → Determine new owner
    IF v_current_shield = 0 THEN
      SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
      FROM jsonb_each_text(v_attack_counts)
      ORDER BY value::bigint DESC
      LIMIT 1;

      v_controlling_party := v_max_attacker_id;
      v_current_shield := (v_shield_max * 0.05)::bigint;
      v_attack_counts := '{}'::jsonb;
      v_result_action := 'capture';

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
```

---

## Implementation Steps

### Step 1: Create click_province()
1. Open Supabase SQL Editor
2. Run CREATE FUNCTION statement
3. Test with sample data

### Step 2: Create join_game()
1. Run CREATE FUNCTION statement
2. Test player creation

### Step 3: Create change_party()
1. Run CREATE FUNCTION statement
2. Test cooldown logic

### Step 4: Create get_leaderboard()
1. Run CREATE FUNCTION statement
2. Test ranking query

### Step 5: Create init_province_shields()
1. Run CREATE FUNCTION statement
2. Test initialization

---

## Test Cases

### Unit Tests (pgTAP)
- [ ] click_province: Defend adds +1 shield
- [ ] click_province: Attack reduces -1 shield
- [ ] click_province: Capture when shield = 0
- [ ] click_province: Rate limiting works (100ms)
- [ ] click_province: Highest attacker wins on capture
- [ ] join_game: Creates new player correctly
- [ ] join_game: Returns existing player
- [ ] change_party: 24hr cooldown enforced
- [ ] change_party: Resets clicks to 0
- [ ] get_leaderboard: Returns correct ranking

### Integration Tests
- [ ] Can call functions via Supabase RPC
- [ ] Realtime updates trigger on click
- [ ] Player stats update correctly

---

## Acceptance Criteria
- [ ] All 5 functions created and working
- [ ] Shield mechanics work correctly (defend/attack/capture)
- [ ] Rate limiting prevents spam clicks
- [ ] Party change cooldown works
- [ ] Leaderboard returns correct rankings
