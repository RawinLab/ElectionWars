-- ElectionWars Consolidated Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gltmvgqbknslnkcortgu/sql/new
-- Generated: 2026-01-08

-- ============================================
-- PART 0: CLEANUP - DROP EXISTING OBJECTS
-- ============================================

-- Remove tables from realtime publication first (ignore errors if not exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'province_state') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE province_state;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'game_state') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE game_state;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop existing policies (ignore errors if not exist)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read parties" ON parties;
  DROP POLICY IF EXISTS "Anyone can read provinces" ON provinces;
  DROP POLICY IF EXISTS "Anyone can read province_state" ON province_state;
  DROP POLICY IF EXISTS "Anyone can read game_state" ON game_state;
  DROP POLICY IF EXISTS "Anyone can read player stats" ON players;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop existing functions
DROP FUNCTION IF EXISTS click_province(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS join_game(UUID, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS change_party(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS init_province_shields() CASCADE;

-- Drop existing tables (order matters due to foreign keys, use CASCADE)
DROP TABLE IF EXISTS province_state CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS game_state CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS parties CASCADE;

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

-- Table: parties
CREATE TABLE IF NOT EXISTS parties (
  id SERIAL PRIMARY KEY,
  name_thai VARCHAR(255) NOT NULL,
  name_english VARCHAR(255) NOT NULL,
  ballot_number INTEGER UNIQUE,
  official_color VARCHAR(7) NOT NULL,
  pattern_type VARCHAR(20) DEFAULT 'solid',
  leader_name VARCHAR(255),
  mp_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parties_ballot_number ON parties(ballot_number);

-- Table: provinces
CREATE TABLE IF NOT EXISTS provinces (
  id INTEGER PRIMARY KEY,
  name_thai VARCHAR(255) NOT NULL UNIQUE,
  name_english VARCHAR(255),
  region VARCHAR(50),
  population INTEGER NOT NULL,
  svg_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provinces_region ON provinces(region);

-- Table: province_state
CREATE TABLE IF NOT EXISTS province_state (
  province_id INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id INTEGER REFERENCES parties(id),
  shield_current BIGINT NOT NULL DEFAULT 0,
  shield_max BIGINT NOT NULL,
  attack_counts JSONB NOT NULL DEFAULT '{}',
  total_clicks BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_province_state_controlling ON province_state(controlling_party_id);
CREATE INDEX IF NOT EXISTS idx_province_state_shield ON province_state(shield_current);

-- Table: players
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  party_id INTEGER NOT NULL REFERENCES parties(id),
  nickname VARCHAR(100) NOT NULL,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  party_changed_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_party ON players(party_id);
CREATE INDEX IF NOT EXISTS idx_players_clicks ON players(total_clicks DESC);
CREATE INDEX IF NOT EXISTS idx_players_auth ON players(auth_id);

-- Table: game_state (Singleton)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_players INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  game_end_time TIMESTAMPTZ NOT NULL DEFAULT '2026-02-08 23:59:59+07',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize game_state singleton
INSERT INTO game_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE province_state;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- ============================================
-- PART 2: CREATE FUNCTIONS
-- ============================================

-- Function: click_province()
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
  SELECT last_click_at INTO v_last_click FROM players WHERE id = p_player_id;

  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '100 milliseconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limited');
  END IF;

  SELECT shield_current, shield_max, controlling_party_id, attack_counts
  INTO v_current_shield, v_shield_max, v_controlling_party, v_attack_counts
  FROM province_state WHERE province_id = p_province_id;

  IF v_shield_max IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Province not found');
  END IF;

  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb);
  v_new_attack_count := 0;

  IF v_controlling_party = p_party_id THEN
    v_current_shield := LEAST(v_current_shield + 1, v_shield_max);
    v_result_action := 'defend';

    UPDATE province_state
    SET shield_current = v_current_shield,
        total_clicks = total_clicks + 1,
        updated_at = NOW()
    WHERE province_id = p_province_id;
  ELSE
    v_current_shield := GREATEST(v_current_shield - 1, 0);
    v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
    v_attack_counts := v_attack_counts || jsonb_build_object(p_party_id::text, v_new_attack_count);

    IF v_current_shield = 0 THEN
      SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
      FROM jsonb_each_text(v_attack_counts)
      ORDER BY value::bigint DESC
      LIMIT 1;

      v_controlling_party := v_max_attacker_id;
      v_current_shield := (v_shield_max * 0.05)::bigint;
      v_attack_counts := '{}'::jsonb;
      v_result_action := 'capture';
      v_new_attack_count := 0;

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

  UPDATE players
  SET total_clicks = total_clicks + 1,
      last_click_at = NOW(),
      last_active = NOW()
  WHERE id = p_player_id;

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

-- Function: join_game()
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
  SELECT id INTO v_existing_player_id FROM players WHERE auth_id = p_auth_id;

  IF v_existing_player_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'player_id', v_existing_player_id, 'existing', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM parties WHERE id = p_party_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid party');
  END IF;

  INSERT INTO players (auth_id, party_id, nickname, total_clicks, last_active, created_at)
  VALUES (p_auth_id, p_party_id, p_nickname, 0, NOW(), NOW())
  RETURNING id INTO v_new_player_id;

  UPDATE game_state SET total_players = total_players + 1, updated_at = NOW() WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'player_id', v_new_player_id, 'existing', false);
END;
$$;

-- Function: change_party()
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
  SELECT party_id, party_changed_at INTO v_current_party_id, v_party_changed_at
  FROM players WHERE id = p_player_id;

  IF v_current_party_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player not found');
  END IF;

  IF v_current_party_id = p_new_party_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already in this party');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM parties WHERE id = p_new_party_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid party');
  END IF;

  IF v_party_changed_at IS NOT NULL THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_party_changed_at + INTERVAL '24 hours' - NOW())) / 3600;
    IF v_hours_remaining > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cooldown active', 'hours_remaining', ROUND(v_hours_remaining::numeric, 1));
    END IF;
  END IF;

  UPDATE players
  SET party_id = p_new_party_id, total_clicks = 0, party_changed_at = NOW(), last_active = NOW()
  WHERE id = p_player_id;

  RETURN jsonb_build_object('success', true, 'old_party', v_current_party_id, 'new_party', p_new_party_id, 'clicks_reset', true);
END;
$$;

-- Function: get_leaderboard()
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
    ROW_NUMBER() OVER (ORDER BY party_stats.provinces_controlled DESC, party_stats.total_clicks DESC) AS rank,
    party_stats.party_id,
    party_stats.party_name,
    party_stats.official_color,
    party_stats.provinces_controlled,
    party_stats.total_clicks
  FROM party_stats
  ORDER BY rank;
END;
$$;

-- Function: init_province_shields()
CREATE OR REPLACE FUNCTION init_province_shields()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, controlling_party_id)
  SELECT
    p.id,
    (p.population / 10)::BIGINT AS shield_max,
    ((p.population / 10) * 0.5)::BIGINT AS shield_current,
    '{}'::jsonb AS attack_counts,
    NULL AS controlling_party_id
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION click_province(UUID, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION join_game(UUID, INTEGER, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION change_party(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_leaderboard() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION init_province_shields() TO authenticated;

-- ============================================
-- PART 3: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Anyone can read parties" ON parties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read provinces" ON provinces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read province_state" ON province_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read game_state" ON game_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read player stats" ON players FOR SELECT TO anon, authenticated USING (true);

-- ============================================
-- PART 4: SEED DATA - 52 PARTIES (from allparty.md)
-- Official ballot numbers (เบอร์พรรค) for 2026 election
-- ============================================

INSERT INTO parties (id, name_thai, name_english, ballot_number, official_color, pattern_type, leader_name, mp_count) VALUES
(1, 'พรรคไทยทรัพย์ทวี', 'Thai Sap Thawee Party', 1, '#CD853F', 'solid', NULL, 0),
(2, 'พรรคเพื่อชาติไทย', 'Pheu Chart Thai Party', 2, '#E9967A', 'solid', NULL, 0),
(3, 'พรรคใหม่', 'Mai Party', 3, '#9932CC', 'solid', NULL, 0),
(4, 'พรรคมิติใหม่', 'New Dimension Party', 4, '#6A5ACD', 'solid', NULL, 0),
(5, 'พรรครวมใจไทย', 'Ruam Jai Thai Party', 5, '#4169E1', 'solid', NULL, 0),
(6, 'พรรครวมไทยสร้างชาติ', 'United Thai Nation Party', 6, '#663399', 'solid', NULL, 0),
(7, 'พรรคพลวัต', 'Movement Party', 7, '#2F4F4F', 'solid', NULL, 0),
(8, 'พรรคประชาธิปไตยใหม่', 'New Democracy Party', 8, '#B22222', 'solid', NULL, 0),
(9, 'พรรคเพื่อไทย', 'Pheu Thai Party', 9, '#E31838', 'solid', NULL, 0),
(10, 'พรรคทางเลือกใหม่', 'New Alternative Party', 10, '#20B2AA', 'solid', NULL, 0),
(11, 'พรรคเศรษฐกิจ', 'Economic Party', 11, '#FFD700', 'solid', NULL, 0),
(12, 'พรรคเสรีรวมไทย', 'Thai Liberal Party', 12, '#8B0000', 'solid', NULL, 0),
(13, 'พรรครวมพลังประชาชน', 'People''s Power Party', 13, '#FF6347', 'solid', NULL, 0),
(14, 'พรรคท้องที่ไทย', 'Thai Counties Party', 14, '#8B4513', 'solid', NULL, 0),
(15, 'พรรคอนาคตไทย', 'Thai Future Party', 15, '#98FB98', 'solid', NULL, 0),
(16, 'พรรคพลังเพื่อไทย', 'Power Thai Party', 16, '#DC143C', 'striped', NULL, 0),
(17, 'พรรคไทยชนะ', 'Thai Win Party', 17, '#FF6347', 'striped', NULL, 0),
(18, 'พรรคพลังสังคมใหม่', 'New Social Power Party', 18, '#4682B4', 'striped', NULL, 0),
(19, 'พรรคสังคมประชาธิปไตยไทย', 'Thai Social Democratic Party', 19, '#C71585', 'striped', NULL, 0),
(20, 'พรรคฟิวชัน', 'Fusion Party', 20, '#FF69B4', 'striped', NULL, 0),
(21, 'พรรคไทยรวมพลัง', 'Thai United Power Party', 21, '#2E8B57', 'striped', NULL, 0),
(22, 'พรรคก้าวอิสระ', 'Independent Party', 22, '#00CED1', 'striped', NULL, 0),
(23, 'พรรคปวงชนไทย', 'Thai People Party', 23, '#DA70D6', 'striped', NULL, 0),
(24, 'พรรควินัยไทย', 'Thai Discipline Party', 24, '#708090', 'striped', NULL, 0),
(25, 'พรรคเพื่อชีวิตใหม่', 'For New Life Party', 25, '#32CD32', 'striped', NULL, 0),
(26, 'พรรคคลองไทย', 'Klong Thai Party', 26, '#5F9EA0', 'striped', NULL, 0),
(27, 'พรรคประชาธิปัตย์', 'Democrat Party', 27, '#87CEEB', 'striped', NULL, 0),
(28, 'พรรคไทยก้าวหน้า', 'Thai Progress Party', 28, '#00CED1', 'striped', NULL, 0),
(29, 'พรรคไทยภักดี', 'Thai Pakdee Party', 29, '#F0E68C', 'striped', NULL, 0),
(30, 'พรรคแรงงานสร้างชาติ', 'Nation Building Labour Party', 30, '#BC8F8F', 'striped', NULL, 0),
(31, 'พรรคประชากรไทย', 'Thai Citizen Party', 31, '#CD5C5C', 'dotted', NULL, 0),
(32, 'พรรคครูไทยเพื่อประชาชน', 'Thai Teachers for People Party', 32, '#4682B4', 'dotted', NULL, 0),
(33, 'พรรคประชาชาติ', 'Prachachat Party', 33, '#4169E1', 'dotted', NULL, 0),
(34, 'พรรคสร้างอนาคตไทย', 'Futurise Thailand Party', 34, '#9370DB', 'dotted', NULL, 0),
(35, 'พรรครักชาติ', 'Rak Chart Party', 35, '#FFB6C1', 'dotted', NULL, 0),
(36, 'พรรคไทยพร้อม', 'Thai Prompt Party', 36, '#6495ED', 'dotted', NULL, 0),
(37, 'พรรคภูมิใจไทย', 'Bhumjaithai Party', 37, '#004E89', 'dotted', NULL, 0),
(38, 'พรรคพลังธรรมใหม่', 'New Palangdharma Party', 38, '#FFD700', 'dotted', NULL, 0),
(39, 'พรรคกรีน', 'Green Party', 39, '#32CD32', 'dotted', NULL, 0),
(40, 'พรรคไทยธรรม', 'Thai Morality Party', 40, '#DAA520', 'dotted', NULL, 0),
(41, 'พรรคแผ่นดินธรรม', 'Land of Dharma Party', 41, '#EEE8AA', 'dotted', NULL, 0),
(42, 'พรรคกล้าธรรม', 'Klatham Party', 42, '#228B22', 'dotted', NULL, 0),
(43, 'พรรคพลังประชารัฐ', 'Palang Pracharath Party', 43, '#1B4D3E', 'dotted', NULL, 0),
(44, 'พรรคโอกาสไทย', 'Thai Opportunity Party', 44, '#FF8C00', 'dotted', NULL, 0),
(45, 'พรรคเป็นธรรม', 'Fair Party', 45, '#9ACD32', 'dotted', NULL, 0),
(46, 'พรรคประชาชน', 'People''s Party', 46, '#FF7A00', 'diagonal', NULL, 0),
(47, 'พรรคประชาไทย', 'Thai Population Party', 47, '#FA8072', 'diagonal', NULL, 0),
(48, 'พรรคไทยสร้างไทย', 'Thai Sang Thai Party', 48, '#DC143C', 'diagonal', NULL, 0),
(49, 'พรรคไทยก้าวใหม่', 'Thai Kao Mai Party', 49, '#00BFFF', 'diagonal', NULL, 0),
(50, 'พรรคประชาอาสาชาติ', 'Nation Volunteer Party', 50, '#8B0000', 'diagonal', NULL, 0),
(51, 'พรรคพลัง', 'Power Party', 51, '#FFA500', 'diagonal', NULL, 0),
(52, 'พรรคเครือข่ายชาวนาแห่งประเทศไทย', 'Farmer Network of Thailand Party', 52, '#556B2F', 'diagonal', NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 5: SEED DATA - 77 PROVINCES
-- ============================================

INSERT INTO provinces (id, name_thai, name_english, region, population) VALUES
(1, 'กรุงเทพมหานคร', 'Bangkok', 'Central', 5456000),
(2, 'สมุทรปราการ', 'Samut Prakan', 'Central', 1360000),
(3, 'นนทบุรี', 'Nonthaburi', 'Central', 1270000),
(4, 'ปทุมธานี', 'Pathum Thani', 'Central', 1180000),
(5, 'พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya', 'Central', 818000),
(6, 'อ่างทอง', 'Ang Thong', 'Central', 276000),
(7, 'ลพบุรี', 'Lop Buri', 'Central', 743000),
(8, 'สิงห์บุรี', 'Sing Buri', 'Central', 203000),
(9, 'ชัยนาท', 'Chai Nat', 'Central', 321000),
(10, 'สระบุรี', 'Saraburi', 'Central', 649000),
(11, 'ชลบุรี', 'Chon Buri', 'Eastern', 1604000),
(12, 'ระยอง', 'Rayong', 'Eastern', 773000),
(13, 'จันทบุรี', 'Chanthaburi', 'Eastern', 538000),
(14, 'ตราด', 'Trat', 'Eastern', 230000),
(15, 'ฉะเชิงเทรา', 'Chachoengsao', 'Eastern', 731000),
(16, 'ปราจีนบุรี', 'Prachin Buri', 'Eastern', 492000),
(17, 'นครนายก', 'Nakhon Nayok', 'Central', 263000),
(18, 'สระแก้ว', 'Sa Kaeo', 'Eastern', 570000),
(19, 'นครราชสีมา', 'Nakhon Ratchasima', 'Northeastern', 2620000),
(20, 'บุรีรัมย์', 'Buri Ram', 'Northeastern', 1580000),
(21, 'สุรินทร์', 'Surin', 'Northeastern', 1380000),
(22, 'ศรีสะเกษ', 'Si Sa Ket', 'Northeastern', 1460000),
(23, 'อุบลราชธานี', 'Ubon Ratchathani', 'Northeastern', 1870000),
(24, 'ยโสธร', 'Yasothon', 'Northeastern', 533000),
(25, 'ชัยภูมิ', 'Chaiyaphum', 'Northeastern', 1130000),
(26, 'อำนาจเจริญ', 'Amnat Charoen', 'Northeastern', 377000),
(27, 'หนองบัวลำภู', 'Nong Bua Lam Phu', 'Northeastern', 508000),
(28, 'ขอนแก่น', 'Khon Kaen', 'Northeastern', 1770000),
(29, 'อุดรธานี', 'Udon Thani', 'Northeastern', 1570000),
(30, 'เลย', 'Loei', 'Northeastern', 634000),
(31, 'หนองคาย', 'Nong Khai', 'Northeastern', 519000),
(32, 'มหาสารคาม', 'Maha Sarakham', 'Northeastern', 952000),
(33, 'ร้อยเอ็ด', 'Roi Et', 'Northeastern', 1290000),
(34, 'กาฬสินธุ์', 'Kalasin', 'Northeastern', 972000),
(35, 'สกลนคร', 'Sakon Nakhon', 'Northeastern', 1140000),
(36, 'นครพนม', 'Nakhon Phanom', 'Northeastern', 718000),
(37, 'มุกดาหาร', 'Mukdahan', 'Northeastern', 354000),
(38, 'เชียงใหม่', 'Chiang Mai', 'Northern', 1800000),
(39, 'ลำพูน', 'Lamphun', 'Northern', 398000),
(40, 'ลำปาง', 'Lampang', 'Northern', 724000),
(41, 'อุตรดิตถ์', 'Uttaradit', 'Northern', 448000),
(42, 'แพร่', 'Phrae', 'Northern', 433000),
(43, 'น่าน', 'Nan', 'Northern', 479000),
(44, 'พะเยา', 'Phayao', 'Northern', 467000),
(45, 'เชียงราย', 'Chiang Rai', 'Northern', 1290000),
(46, 'แม่ฮ่องสอน', 'Mae Hong Son', 'Northern', 285000),
(47, 'นครสวรรค์', 'Nakhon Sawan', 'Central', 1040000),
(48, 'อุทัยธานี', 'Uthai Thani', 'Central', 325000),
(49, 'กำแพงเพชร', 'Kamphaeng Phet', 'Central', 718000),
(50, 'ตาก', 'Tak', 'Western', 653000),
(51, 'สุโขทัย', 'Sukhothai', 'Central', 590000),
(52, 'พิษณุโลก', 'Phitsanulok', 'Central', 854000),
(53, 'พิจิตร', 'Phichit', 'Central', 528000),
(54, 'เพชรบูรณ์', 'Phetchabun', 'Central', 983000),
(55, 'ราชบุรี', 'Ratchaburi', 'Western', 872000),
(56, 'กาญจนบุรี', 'Kanchanaburi', 'Western', 899000),
(57, 'สุพรรณบุรี', 'Suphan Buri', 'Central', 840000),
(58, 'นครปฐม', 'Nakhon Pathom', 'Central', 936000),
(59, 'สมุทรสาคร', 'Samut Sakhon', 'Central', 588000),
(60, 'สมุทรสงคราม', 'Samut Songkhram', 'Central', 187000),
(61, 'เพชรบุรี', 'Phetchaburi', 'Western', 481000),
(62, 'ประจวบคีรีขันธ์', 'Prachuap Khiri Khan', 'Western', 551000),
(63, 'นครศรีธรรมราช', 'Nakhon Si Thammarat', 'Southern', 1550000),
(64, 'กระบี่', 'Krabi', 'Southern', 486000),
(65, 'พังงา', 'Phangnga', 'Southern', 272000),
(66, 'ภูเก็ต', 'Phuket', 'Southern', 418000),
(67, 'สุราษฎร์ธานี', 'Surat Thani', 'Southern', 1080000),
(68, 'ระนอง', 'Ranong', 'Southern', 194000),
(69, 'ชุมพร', 'Chumphon', 'Southern', 512000),
(70, 'สงขลา', 'Songkhla', 'Southern', 1450000),
(71, 'สตูล', 'Satun', 'Southern', 328000),
(72, 'ตรัง', 'Trang', 'Southern', 643000),
(73, 'พัทลุง', 'Phatthalung', 'Southern', 520000),
(74, 'ปัตตานี', 'Pattani', 'Southern', 706000),
(75, 'ยะลา', 'Yala', 'Southern', 538000),
(76, 'นราธิวาส', 'Narathiwat', 'Southern', 809000),
(77, 'บึงกาฬ', 'Bueng Kan', 'Northeastern', 421000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 6: INITIALIZE PROVINCE STATE WITH 50% SHIELDS
-- ============================================

INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, controlling_party_id, total_clicks)
SELECT
  p.id AS province_id,
  (p.population / 10)::BIGINT AS shield_max,
  ((p.population / 10) * 0.5)::BIGINT AS shield_current,
  '{}'::jsonb AS attack_counts,
  NULL AS controlling_party_id,
  0 AS total_clicks
FROM provinces p
ON CONFLICT (province_id) DO NOTHING;

-- ============================================
-- VERIFICATION (Uncomment to check)
-- ============================================
-- SELECT 'parties' as table_name, COUNT(*) as count FROM parties;
-- SELECT 'provinces' as table_name, COUNT(*) as count FROM provinces;
-- SELECT 'province_state' as table_name, COUNT(*) as count FROM province_state;
-- SELECT * FROM game_state;
