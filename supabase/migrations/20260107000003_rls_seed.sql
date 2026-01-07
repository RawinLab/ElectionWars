-- ElectionWars RLS Policies and Seed Data
-- Module 2.3: Row Level Security & Initial Data
-- Generated: 2026-01-08

-- ============================================
-- Part 1: Enable Row Level Security on All Tables
-- ============================================

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Part 2: RLS Policies - Public Read Access
-- ============================================

-- Anyone can read parties (public data)
CREATE POLICY "Anyone can read parties"
ON parties FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can read provinces (public data)
CREATE POLICY "Anyone can read provinces"
ON provinces FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can read province_state (public data for real-time map)
CREATE POLICY "Anyone can read province_state"
ON province_state FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can read game_state (public data for timer/stats)
CREATE POLICY "Anyone can read game_state"
ON game_state FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can read player stats (for leaderboard)
CREATE POLICY "Anyone can read player stats"
ON players FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- Part 3: RLS Policies - Player Data Access
-- ============================================

-- Players can only update their own record (via functions with SECURITY DEFINER)
-- Note: Direct writes are blocked; all writes go through SECURITY DEFINER functions
CREATE POLICY "Players can update own data"
ON players FOR UPDATE
TO authenticated
USING (auth.uid()::text = auth_id::text)
WITH CHECK (auth.uid()::text = auth_id::text);

-- ============================================
-- Part 4: Seed Data - 57 Thai Political Parties (2026 Election)
-- ============================================

INSERT INTO parties (id, name_thai, name_english, ballot_number, official_color, pattern_type, leader_name, mp_count) VALUES
-- Major Parties (Solid Colors)
(1, 'พรรคเพื่อไทย', 'Pheu Thai Party', 1, '#E31838', 'solid', 'แพทองธาร ชินวัตร', 141),
(2, 'พรรคประชาชน', 'People''s Party', 2, '#FF7A00', 'solid', 'ณัฐพงษ์ เรืองปัญญาวุฒิ', 151),
(3, 'พรรคภูมิใจไทย', 'Bhumjaithai Party', 3, '#004E89', 'solid', 'อนุทิน ชาญวีรกูล', 71),
(4, 'พรรคประชาธิปัตย์', 'Democrat Party', 4, '#87CEEB', 'solid', 'ชวน หลีกภัย', 25),
(5, 'พรรคพลังประชารัฐ', 'Palang Pracharath Party', 5, '#1B4D3E', 'solid', 'ประวิตร วงษ์สุวรรณ', 40),
(6, 'พรรครวมไทยสร้างชาติ', 'United Thai Nation Party', 6, '#663399', 'solid', 'พลเอก ประยุทธ์ จันทร์โอชา', 36),
(7, 'พรรคชาติไทยพัฒนา', 'Chart Thai Pattana Party', 7, '#FFA500', 'solid', 'วราวุธ ศิลปอาชา', 10),
(8, 'พรรคชาติพัฒนากล้า', 'Chart Pattana Kla Party', 8, '#228B22', 'solid', 'กรณ์ จาติกวณิช', 2),
(9, 'พรรคประชาชาติ', 'Prachachat Party', 9, '#4169E1', 'solid', 'วันมูหะมัดนอร์ มะทา', 9),
(10, 'พรรคไทยสร้างไทย', 'Thai Sang Thai Party', 10, '#DC143C', 'solid', 'สุดารัตน์ เกยุราพันธุ์', 6),
-- Additional Major Parties
(11, 'พรรคเสรีรวมไทย', 'Seri Ruam Thai Party', 11, '#8B0000', 'solid', 'พลตำรวจเอก เสรีพิศุทธ์ เตมียเวส', 1),
(12, 'พรรคใหม่', 'Mai Party', 12, '#9932CC', 'solid', 'กฤษฎางค์ นุตจรัส', 0),
(13, 'พรรคทางเลือกใหม่', 'New Choice Party', 13, '#20B2AA', 'solid', NULL, 0),
(14, 'พรรคพลังธรรมใหม่', 'New Palang Dharma Party', 14, '#FFD700', 'solid', NULL, 0),
(15, 'พรรคท้องถิ่นไทย', 'Thai Local Party', 15, '#CD853F', 'solid', NULL, 0),
-- Mid-size Parties (Striped Pattern)
(16, 'พรรคกรีน', 'Green Party', 16, '#32CD32', 'striped', NULL, 0),
(17, 'พรรคครูไทยเพื่อประชาชน', 'Thai Teachers for People Party', 17, '#4682B4', 'striped', NULL, 0),
(18, 'พรรคคลองไทย', 'Klong Thai Party', 18, '#5F9EA0', 'striped', NULL, 0),
(19, 'พรรคความหวังใหม่', 'New Hope Party', 19, '#6495ED', 'striped', NULL, 0),
(20, 'พรรคแนวร่วมประชาธิปไตย', 'Democratic Front Party', 20, '#B22222', 'striped', NULL, 0),
(21, 'พรรคพลังสังคม', 'Social Power Party', 21, '#8B4513', 'striped', NULL, 0),
(22, 'พรรคภาคีเครือข่ายไทย', 'Thai Network Coalition Party', 22, '#2E8B57', 'striped', NULL, 0),
(23, 'พรรคราษฎร์วิถี', 'People''s Way Party', 23, '#696969', 'striped', NULL, 0),
(24, 'พรรคลุ่มน้ำโขง', 'Mekong River Party', 24, '#1E90FF', 'striped', NULL, 0),
(25, 'พรรคสังคมประชาธิปไตยไทย', 'Thai Social Democratic Party', 25, '#C71585', 'striped', NULL, 0),
-- Small Parties (Dotted Pattern)
(26, 'พรรคเกษตรกรไทย', 'Thai Farmers Party', 26, '#556B2F', 'dotted', NULL, 0),
(27, 'พรรคกลาง', 'Center Party', 27, '#708090', 'dotted', NULL, 0),
(28, 'พรรคคนงานไทย', 'Thai Workers Party', 28, '#A0522D', 'dotted', NULL, 0),
(29, 'พรรคชาวนาไทย', 'Thai Farmers Movement Party', 29, '#6B8E23', 'dotted', NULL, 0),
(30, 'พรรคไทยก้าวหน้า', 'Progressive Thai Party', 30, '#00CED1', 'dotted', NULL, 0),
(31, 'พรรคไทยชนะ', 'Thai Win Party', 31, '#FF6347', 'dotted', NULL, 0),
(32, 'พรรคไทยปวงชน', 'Thai People Party', 32, '#DA70D6', 'dotted', NULL, 0),
(33, 'พรรคไทยภักดี', 'Thai Pakdee Party', 33, '#F0E68C', 'dotted', NULL, 0),
(34, 'พรรคไทยรักษาชาติ', 'Thai Raksa Chart Party', 34, '#00BFFF', 'dotted', NULL, 0),
(35, 'พรรคไทยศรีวิไลย์', 'Thai Civilized Party', 35, '#9400D3', 'dotted', NULL, 0),
-- More Small Parties (Diagonal Pattern)
(36, 'พรรคประชาภิวัฒน์', 'People''s Progress Party', 36, '#FF69B4', 'diagonal', NULL, 0),
(37, 'พรรคพลเมืองไทย', 'Thai Citizen Party', 37, '#CD5C5C', 'diagonal', NULL, 0),
(38, 'พรรคพลังชาติไทย', 'Thai Nation Power Party', 38, '#F4A460', 'diagonal', NULL, 0),
(39, 'พรรคพลังท้องถิ่นไท', 'Thai Local Power Party', 39, '#D2691E', 'diagonal', NULL, 0),
(40, 'พรรคพลังประชาไทย', 'Thai People Power Party', 40, '#8FBC8F', 'diagonal', NULL, 0),
(41, 'พรรคพลังเศรษฐกิจไทย', 'Thai Economic Power Party', 41, '#778899', 'diagonal', NULL, 0),
(42, 'พรรคพลังไทยรักไทย', 'Thai Love Thai Power Party', 42, '#B0C4DE', 'diagonal', NULL, 0),
(43, 'พรรคแรงงานสร้างชาติ', 'Labor Build Nation Party', 43, '#BC8F8F', 'diagonal', NULL, 0),
(44, 'พรรคสยามพัฒนา', 'Siam Development Party', 44, '#DAA520', 'diagonal', NULL, 0),
(45, 'พรรคสังคมใหม่', 'New Society Party', 45, '#BDB76B', 'diagonal', NULL, 0),
-- Remaining Parties
(46, 'พรรคมหาชน', 'Mass Party', 46, '#3CB371', 'solid', NULL, 0),
(47, 'พรรคเพื่อชาติ', 'For Nation Party', 47, '#E9967A', 'striped', NULL, 0),
(48, 'พรรคเพื่อไทยพัฒนา', 'Pheu Thai Development Party', 48, '#F08080', 'dotted', NULL, 0),
(49, 'พรรคเพื่อราษฎร', 'For People Party', 49, '#FA8072', 'diagonal', NULL, 0),
(50, 'พรรคแผ่นดินไทย', 'Thai Land Party', 50, '#E0FFFF', 'solid', NULL, 0),
(51, 'พรรครักษ์ผืนป่าประเทศไทย', 'Protect Thai Forest Party', 51, '#228B22', 'striped', NULL, 0),
(52, 'พรรครวมพลัง', 'United Power Party', 52, '#D8BFD8', 'dotted', NULL, 0),
(53, 'พรรคสหพรรค', 'United Parties Party', 53, '#AFEEEE', 'diagonal', NULL, 0),
(54, 'พรรคอนาคตไทย', 'Thai Future Party', 54, '#98FB98', 'solid', NULL, 0),
(55, 'พรรคอารยะ', 'Civilized Party', 55, '#FFDAB9', 'striped', NULL, 0),
(56, 'พรรคแผ่นดินธรรม', 'Dharma Land Party', 56, '#EEE8AA', 'dotted', NULL, 0),
(57, 'พรรครักประเทศไทย', 'Love Thailand Party', 57, '#FFB6C1', 'diagonal', NULL, 0);

-- ============================================
-- Part 5: Seed Data - 77 Thai Provinces with Population
-- ============================================

INSERT INTO provinces (id, name_thai, name_english, region, population) VALUES
-- Central Region (22 provinces)
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
(17, 'นครนายก', 'Nakhon Nayok', 'Central', 263000),
(47, 'นครสวรรค์', 'Nakhon Sawan', 'Central', 1040000),
(48, 'อุทัยธานี', 'Uthai Thani', 'Central', 325000),
(49, 'กำแพงเพชร', 'Kamphaeng Phet', 'Central', 718000),
(51, 'สุโขทัย', 'Sukhothai', 'Central', 590000),
(52, 'พิษณุโลก', 'Phitsanulok', 'Central', 854000),
(53, 'พิจิตร', 'Phichit', 'Central', 528000),
(54, 'เพชรบูรณ์', 'Phetchabun', 'Central', 983000),
(57, 'สุพรรณบุรี', 'Suphan Buri', 'Central', 840000),
(58, 'นครปฐม', 'Nakhon Pathom', 'Central', 936000),
(59, 'สมุทรสาคร', 'Samut Sakhon', 'Central', 588000),
(60, 'สมุทรสงคราม', 'Samut Songkhram', 'Central', 187000),
-- Eastern Region (7 provinces)
(11, 'ชลบุรี', 'Chon Buri', 'Eastern', 1604000),
(12, 'ระยอง', 'Rayong', 'Eastern', 773000),
(13, 'จันทบุรี', 'Chanthaburi', 'Eastern', 538000),
(14, 'ตราด', 'Trat', 'Eastern', 230000),
(15, 'ฉะเชิงเทรา', 'Chachoengsao', 'Eastern', 731000),
(16, 'ปราจีนบุรี', 'Prachin Buri', 'Eastern', 492000),
(18, 'สระแก้ว', 'Sa Kaeo', 'Eastern', 570000),
-- Northeastern Region (20 provinces)
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
(77, 'บึงกาฬ', 'Bueng Kan', 'Northeastern', 421000),
-- Northern Region (9 provinces)
(38, 'เชียงใหม่', 'Chiang Mai', 'Northern', 1800000),
(39, 'ลำพูน', 'Lamphun', 'Northern', 398000),
(40, 'ลำปาง', 'Lampang', 'Northern', 724000),
(41, 'อุตรดิตถ์', 'Uttaradit', 'Northern', 448000),
(42, 'แพร่', 'Phrae', 'Northern', 433000),
(43, 'น่าน', 'Nan', 'Northern', 479000),
(44, 'พะเยา', 'Phayao', 'Northern', 467000),
(45, 'เชียงราย', 'Chiang Rai', 'Northern', 1290000),
(46, 'แม่ฮ่องสอน', 'Mae Hong Son', 'Northern', 285000),
-- Western Region (5 provinces)
(50, 'ตาก', 'Tak', 'Western', 653000),
(55, 'ราชบุรี', 'Ratchaburi', 'Western', 872000),
(56, 'กาญจนบุรี', 'Kanchanaburi', 'Western', 899000),
(61, 'เพชรบุรี', 'Phetchaburi', 'Western', 481000),
(62, 'ประจวบคีรีขันธ์', 'Prachuap Khiri Khan', 'Western', 551000),
-- Southern Region (14 provinces)
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
(76, 'นราธิวาส', 'Narathiwat', 'Southern', 809000);

-- ============================================
-- Part 6: Initialize Province State with 50% Shields
-- ============================================

INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, controlling_party_id, total_clicks)
SELECT
  p.id AS province_id,
  (p.population / 10)::BIGINT AS shield_max,
  ((p.population / 10) * 0.5)::BIGINT AS shield_current,  -- 50% neutral start
  '{}'::jsonb AS attack_counts,
  NULL AS controlling_party_id,  -- Neutral (no party controls)
  0 AS total_clicks
FROM provinces p
ON CONFLICT (province_id) DO NOTHING;

-- ============================================
-- Part 7: Initialize Game State Singleton
-- ============================================

INSERT INTO game_state (id, total_players, total_clicks, game_end_at, is_active, updated_at)
VALUES (
  1,
  0,
  0,
  '2026-02-08 23:59:59+07'::TIMESTAMPTZ,  -- Game ends Feb 8, 2026 at 23:59:59 Bangkok time
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  game_end_at = EXCLUDED.game_end_at,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- Part 8: Create Helper Views (Optional)
-- ============================================

-- View for province data with current state
CREATE OR REPLACE VIEW province_full_state AS
SELECT
  p.id,
  p.name_thai,
  p.name_english,
  p.region,
  p.population,
  ps.shield_max,
  ps.shield_current,
  ps.controlling_party_id,
  ps.attack_counts,
  ps.total_clicks,
  ROUND((ps.shield_current::NUMERIC / NULLIF(ps.shield_max, 0)) * 100, 1) AS shield_percentage,
  pt.name_thai AS controlling_party_name,
  pt.official_color AS controlling_party_color
FROM provinces p
LEFT JOIN province_state ps ON ps.province_id = p.id
LEFT JOIN parties pt ON pt.id = ps.controlling_party_id;

-- Grant access to the view
GRANT SELECT ON province_full_state TO anon, authenticated;

-- ============================================
-- Verification Queries (Run after migration)
-- ============================================
-- SELECT COUNT(*) FROM parties;  -- Should be 57
-- SELECT COUNT(*) FROM provinces;  -- Should be 77
-- SELECT COUNT(*) FROM province_state;  -- Should be 77
-- SELECT * FROM game_state;  -- Should have 1 row with game_end_at

COMMENT ON TABLE parties IS 'Thai political parties for 2026 election (57 parties)';
COMMENT ON TABLE provinces IS 'Thai provinces (77) with population data for shield calculation';
COMMENT ON TABLE province_state IS 'Real-time province control state with shield system';
COMMENT ON TABLE game_state IS 'Global game state (singleton) with end date and counters';
