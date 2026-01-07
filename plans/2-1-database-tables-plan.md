# Plan: Database Tables (Module 2.1)

## Module Information
- **Module:** 2.1
- **Name:** Database Core Tables
- **Dependencies:** 1.1 (Supabase Project Setup)
- **Priority:** CRITICAL
- **Estimated:** 1 day

---

## Features

### 2.1.1 Parties Table
Store 57 Thai political parties with official colors

### 2.1.2 Provinces Table
Store 77 Thai provinces with population data for shield calculation

### 2.1.3 Province State Table
Real-time game state with shield system

### 2.1.4 Players Table
Player profiles with party affiliation and stats

### 2.1.5 Game State Table
Singleton table for global game statistics

---

## Technical Design

### Database Schema (Exact Contracts)

#### parties
```sql
CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name_thai VARCHAR(255) NOT NULL,
  name_english VARCHAR(255) NOT NULL,
  ballot_number INTEGER UNIQUE,
  official_color VARCHAR(7) NOT NULL,  -- HEX: #RRGGBB
  pattern_type VARCHAR(20) DEFAULT 'solid',  -- solid, striped, dotted, diagonal
  leader_name VARCHAR(255),
  mp_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_ballot_number ON parties(ballot_number);
```

#### provinces
```sql
CREATE TABLE provinces (
  id INTEGER PRIMARY KEY,  -- 1-77
  name_thai VARCHAR(255) NOT NULL UNIQUE,
  name_english VARCHAR(255),
  region VARCHAR(50),  -- Northern, Northeastern, Central, Southern, Eastern, Western
  population INTEGER NOT NULL,  -- Population for shield calculation
  svg_path TEXT,  -- SVG path for map rendering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provinces_region ON provinces(region);
```

#### province_state (Realtime enabled)
```sql
CREATE TABLE province_state (
  province_id INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id INTEGER REFERENCES parties(id),  -- NULL = neutral

  -- Shield System
  shield_current BIGINT NOT NULL DEFAULT 0,
  shield_max BIGINT NOT NULL,  -- population / 10
  attack_counts JSONB NOT NULL DEFAULT '{}',  -- {"party_id": click_count}

  -- Stats
  total_clicks BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_province_state_controlling ON province_state(controlling_party_id);
CREATE INDEX idx_province_state_shield ON province_state(shield_current);
```

#### players
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,  -- Supabase auth.users.id
  party_id INTEGER NOT NULL REFERENCES parties(id),
  nickname VARCHAR(100) NOT NULL,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  party_changed_at TIMESTAMPTZ,  -- For 24hr cooldown
  last_click_at TIMESTAMPTZ,  -- For rate limiting
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_party ON players(party_id);
CREATE INDEX idx_players_clicks ON players(total_clicks DESC);
CREATE INDEX idx_players_auth ON players(auth_id);
```

#### game_state (Singleton)
```sql
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_players INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, ended
  game_end_time TIMESTAMPTZ NOT NULL DEFAULT '2026-02-08 23:59:59+07',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enable Realtime
```sql
-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE province_state;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
```

---

## Implementation Steps

### Step 1: Create Tables
1. Open Supabase SQL Editor
2. Run CREATE TABLE statements for all 5 tables
3. Verify tables in Table Editor

### Step 2: Create Indexes
1. Run CREATE INDEX statements
2. Verify indexes are created

### Step 3: Enable Realtime
1. Run ALTER PUBLICATION statement
2. Verify in Supabase Dashboard > Database > Replication

### Step 4: Create Migration File
```bash
# supabase/migrations/20260107000001_create_tables.sql
# Save all CREATE TABLE statements
```

---

## Test Cases

### Unit Tests (pgTAP)
- [ ] All tables exist
- [ ] Primary keys are correct
- [ ] Foreign keys are enforced
- [ ] Indexes are created
- [ ] Default values work

### Integration Tests
- [ ] Can INSERT into all tables
- [ ] Can SELECT from all tables
- [ ] Foreign key constraints work
- [ ] Realtime subscription receives updates

---

## Acceptance Criteria
- [ ] All 5 tables created successfully
- [ ] Indexes created for performance
- [ ] Realtime enabled on province_state and game_state
- [ ] Foreign key relationships work correctly
- [ ] Migration file saved for version control
