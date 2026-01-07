# Plan: RLS Policies & Seed Data (Module 2.3)

## Module Information
- **Module:** 2.3
- **Name:** Row Level Security & Seed Data
- **Dependencies:** 2.1 (Tables), 2.2 (Functions)
- **Priority:** CRITICAL
- **Estimated:** 1 day

---

## Features

### 2.3.1 Row Level Security Policies
Protect data with Supabase RLS

### 2.3.2 Seed Data - Parties
57 Thai political parties with official colors

### 2.3.3 Seed Data - Provinces
77 Thai provinces with population data

### 2.3.4 Initialize Game State
Initialize province_state and game_state

---

## Technical Design

### RLS Policies

#### Enable RLS on All Tables
```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
```

#### Policies - parties (Public Read)
```sql
CREATE POLICY "Anyone can read parties"
  ON parties FOR SELECT
  USING (true);
```

#### Policies - provinces (Public Read)
```sql
CREATE POLICY "Anyone can read provinces"
  ON provinces FOR SELECT
  USING (true);
```

#### Policies - province_state (Public Read, Function Write)
```sql
CREATE POLICY "Anyone can read province_state"
  ON province_state FOR SELECT
  USING (true);

-- No direct INSERT/UPDATE - only via click_province function (SECURITY DEFINER)
```

#### Policies - players (Own Data Access)
```sql
CREATE POLICY "Players can read own data"
  ON players FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Players can update own data"
  ON players FOR UPDATE
  USING (auth.uid() = auth_id);

-- Allow reading player stats for leaderboard
CREATE POLICY "Anyone can read player stats"
  ON players FOR SELECT
  USING (true);
```

#### Policies - game_state (Public Read)
```sql
CREATE POLICY "Anyone can read game_state"
  ON game_state FOR SELECT
  USING (true);
```

---

### Seed Data

#### Major Parties (Sample - 10 of 57)
```sql
INSERT INTO parties (id, name_thai, name_english, ballot_number, official_color, pattern_type, leader_name) VALUES
(1, 'พรรคเพื่อไทย', 'Pheu Thai Party', 9, '#E31838', 'solid', 'แพทองธาร ชินวัตร'),
(2, 'พรรคประชาชน', 'People''s Party', 46, '#FF7A00', 'solid', 'พิธา ลิ้มเจริญรัตน์'),
(3, 'พรรคภูมิใจไทย', 'Bhumjaithai Party', 37, '#004E89', 'solid', 'อนุทิน ชาญวีรกูล'),
(4, 'พรรคประชาธิปัตย์', 'Democrat Party', 27, '#87CEEB', 'solid', 'จุรินทร์ ลักษณวิศิษฏ์'),
(5, 'พรรคพลังประชารัฐ', 'Palang Pracharath Party', 7, '#1B4D3E', 'solid', 'ประวิตร วงษ์สุวรรณ'),
(6, 'พรรครวมไทยสร้างชาติ', 'United Thai Nation Party', 6, '#663399', 'solid', 'พีระพันธุ์ สาลีรัฐวิภาค'),
(7, 'พรรคไทยสร้างไทย', 'Thai Sang Thai Party', 48, '#800020', 'solid', 'สุดารัตน์ เกยุราพันธุ์'),
(8, 'พรรคชาติไทยพัฒนา', 'Chartthaipattana Party', 15, '#008080', 'solid', 'วราวุธ ศิลปอาชา'),
(9, 'พรรคประชาชาติ', 'Prachachart Party', 33, '#000080', 'solid', 'วันมูหะมัดนอร์ มะทา'),
(10, 'พรรคเสรีรวมไทย', 'Thai Liberal Party', 44, '#FFD700', 'striped', 'พล.ต.อ.เสรีพิศุทธ์ เตมียเวส');
-- ... continue for remaining parties
```

#### Provinces with Population (77 provinces)
Full seed data is in Tech Spec Appendix D. Key examples:

```sql
INSERT INTO provinces (id, name_thai, name_english, region, population) VALUES
(1, 'กรุงเทพมหานคร', 'Bangkok', 'Central', 5456000),
(19, 'นครราชสีมา', 'Nakhon Ratchasima', 'Northeastern', 2620000),
(38, 'เชียงใหม่', 'Chiang Mai', 'Northern', 1800000),
(60, 'สมุทรสงคราม', 'Samut Songkhram', 'Central', 187000);
-- ... all 77 provinces (see Tech Spec Appendix D)
```

#### Initialize Province State
```sql
INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, total_clicks)
SELECT
  id,
  population / 10 as shield_max,
  (population / 10 * 0.5)::bigint as shield_current,  -- 50% for neutral
  '{}'::jsonb,
  0
FROM provinces;
```

#### Initialize Game State
```sql
INSERT INTO game_state (id, total_clicks, total_players, status, game_end_time)
VALUES (1, 0, 0, 'active', '2026-02-08 23:59:59+07');
```

---

## Implementation Steps

### Step 1: Enable RLS
```sql
-- Run all ALTER TABLE ... ENABLE ROW LEVEL SECURITY
```

### Step 2: Create Policies
```sql
-- Run all CREATE POLICY statements
```

### Step 3: Seed Parties
```sql
-- Run INSERT INTO parties (full 57 parties)
```

### Step 4: Seed Provinces
```sql
-- Run INSERT INTO provinces (all 77 with population)
```

### Step 5: Initialize Province State
```sql
-- Run INSERT INTO province_state from provinces
```

### Step 6: Initialize Game State
```sql
-- Run INSERT INTO game_state
```

### Step 7: Verify Data
```sql
SELECT COUNT(*) FROM parties;  -- Should be 57
SELECT COUNT(*) FROM provinces;  -- Should be 77
SELECT COUNT(*) FROM province_state;  -- Should be 77
SELECT * FROM game_state;  -- Should have 1 row
```

---

## Test Cases

### RLS Tests
- [ ] Anonymous user can read parties
- [ ] Anonymous user can read provinces
- [ ] Anonymous user can read province_state
- [ ] Anonymous user cannot directly INSERT province_state
- [ ] click_province function bypasses RLS (SECURITY DEFINER)

### Seed Data Tests
- [ ] All 57 parties exist with correct colors
- [ ] All 77 provinces exist with population
- [ ] All provinces have shield_max = population / 10
- [ ] All provinces start with 50% shield
- [ ] game_state has correct end date

---

## Acceptance Criteria
- [ ] RLS enabled on all tables
- [ ] All policies created correctly
- [ ] 57 parties seeded
- [ ] 77 provinces seeded with population
- [ ] Province state initialized with shield values
- [ ] Game state initialized
- [ ] Data can be read from frontend
