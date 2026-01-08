-- Update parties table with official ballot numbers from allparty.md
-- 52 Political Parties with correct ballot numbers (เบอร์พรรค)
-- Source: docs/informations/allparty.md

-- Reset province state and player party associations
UPDATE province_state SET controlling_party_id = NULL, attack_counts = '{}';
UPDATE players SET party_id = NULL;

-- Delete existing parties
DELETE FROM parties;

-- Insert 52 parties with correct ballot numbers
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
(52, 'พรรคเครือข่ายชาวนาแห่งประเทศไทย', 'Farmer Network of Thailand Party', 52, '#556B2F', 'diagonal', NULL, 0);

-- Verify
-- SELECT id, ballot_number, name_thai FROM parties ORDER BY ballot_number;
