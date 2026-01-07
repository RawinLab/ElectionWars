# Election War - Technical Architecture Specification

**Version:** 2.0 (Supabase Edition)
**Date:** January 7, 2026
**Author:** Development Team
**Last Updated:** Jan 7, 2026

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                       │
│  HTML5 + CSS3 + JavaScript + Supabase JS Client            │
│  - Thailand Province Map (SVG)                              │
│  - Party Selector                                           │
│  - Real-time UI Updates via Supabase Realtime              │
└────────────────────────────┬────────────────────────────────┘
                             │
              HTTPS + WebSocket (Supabase Realtime)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      SUPABASE CLOUD                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Supabase Realtime                      │    │
│  │         (Postgres LISTEN/NOTIFY)                    │    │
│  │    - Broadcasts province_state changes              │    │
│  │    - Handles 50K+ concurrent connections            │    │
│  └────────────────────────────────────────────────────┘    │
│                             │                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                    │    │
│  │    - parties, provinces, province_state            │    │
│  │    - players, game_state                           │    │
│  │    - Database Functions (PL/pgSQL)                 │    │
│  │    - Row Level Security (RLS)                      │    │
│  └────────────────────────────────────────────────────┘    │
│                             │                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Edge Functions (Optional)                   │    │
│  │    - Advanced rate limiting                         │    │
│  │    - Analytics processing                           │    │
│  └────────────────────────────────────────────────────┘    │
│                             │                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Supabase Auth                          │    │
│  │    - Anonymous sessions                             │    │
│  │    - Player identification                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               STATIC HOSTING (Vercel/Netlify)              │
│    - HTML, CSS, JS bundle                                   │
│    - SVG map assets                                         │
│    - CDN for fast global delivery                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Markup** | HTML5 | Semantic structure, native SVG support |
| **Styling** | CSS3 (Tailwind optional) | Flexbox, Grid, animations; utility-first for rapid development |
| **Scripting** | JavaScript (ES6+) | Client-side state, Supabase events, DOM manipulation |
| **Map Rendering** | SVG | Scalable, interactive province areas, easy color manipulation |
| **Supabase Client** | @supabase/supabase-js | Official client library for database, auth, realtime |
| **Real-time UI** | Vanilla JS (or Alpine.js) | Keep bundle size small, reactive updates |
| **Build Tool** | Vite | Fast dev server, ES modules, minimal config |
| **Deployment** | Firebase Hosting (Google Cloud) | Global CDN, free tier generous, easy CI/CD |
| **Ads** | Google AdSense | Display ads for revenue, easy integration |

### 2.2 Backend (Supabase - Managed)
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Platform** | Supabase Cloud | Fully managed BaaS, rapid development |
| **Database** | PostgreSQL 15 (Supabase-hosted) | ACID compliance, JSONB for click counts, triggers for realtime |
| **Real-time** | Supabase Realtime | Built-in Postgres LISTEN/NOTIFY, auto-broadcast changes |
| **Auth** | Supabase Auth | Anonymous sessions, player identification without passwords |
| **Edge Functions** | Deno-based (optional) | Advanced rate limiting, custom logic if needed |
| **Storage** | Supabase Storage (optional) | If need to store player avatars or assets |

### 2.3 Infrastructure (Google Cloud + Supabase)
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Backend Hosting** | Supabase Cloud | Fully managed, no server maintenance |
| **Frontend Hosting** | Firebase Hosting | Google Cloud CDN, generous free tier, Thai edge nodes |
| **CDN** | Firebase/Google Cloud CDN | Automatic edge caching, fast in Thailand |
| **Monitoring** | Supabase Dashboard + Firebase Console | Built-in metrics and logging |
| **CI/CD** | GitHub Actions + Firebase CLI | Auto-deploy on push to main |
| **Domain/SSL** | Firebase Hosting (free SSL) | Automatic SSL provisioning |
| **Ads** | Google AdSense | Native integration with Google ecosystem |

### 2.4 No Longer Needed (vs. Traditional Architecture)
| Removed | Reason |
|---------|--------|
| ~~Node.js/Express server~~ | Supabase handles backend |
| ~~Socket.io~~ | Supabase Realtime replaces this |
| ~~Redis~~ | Supabase uses Postgres for real-time state |
| ~~RabbitMQ/Message Queue~~ | Not needed for this use case |
| ~~Docker/Kubernetes~~ | Supabase is fully managed |
| ~~Load Balancer~~ | Supabase handles scaling |

### 2.5 Map Data Sources

| Data Source | URL | Content | Format |
|-------------|-----|---------|--------|
| **Province Boundaries** | [cvibhagool/thailand-map](https://github.com/cvibhagool/thailand-map) | 77 provinces with geometry | TopoJSON, GeoJSON, Shapefile |
| **Thai Province Names** | [thailand-geography-data](https://github.com/thailand-geography-data/thailand-geography-json) | Province codes, Thai/English names | JSON |

**Files to use:**
- `thailand-provinces.topojson` - ขนาดเล็ก เหมาะสำหรับ web (recommended)
- `thailand-provinces.geojson` - Full detail สำหรับ convert เป็น SVG
- `provinces.json` - ข้อมูลชื่อจังหวัดภาษาไทย/อังกฤษ

**Province Properties (from TopoJSON):**
| Property | Description | Example |
|----------|-------------|---------|
| `ID_1` | Province ID (1-78) | 13 |
| `NAME_0` | Country name | "Thailand" |
| `NAME_1` | Province name (English) | "Nakhon Pathom" |

**Thai Name Mapping (from thailand-geography-json):**
| Property | Description | Example |
|----------|-------------|---------|
| `provinceCode` | 2-digit code | "73" |
| `provinceNameEn` | English name | "Nakhon Pathom" |
| `provinceNameTh` | Thai name | "นครปฐม" |

---

## 2.6 Map Data Processing

### Converting TopoJSON to SVG
```javascript
// scripts/convert-map.js
import * as topojson from 'topojson-client'
import { geoPath, geoMercator } from 'd3-geo'
import fs from 'fs'

// Load data sources
const topoData = JSON.parse(fs.readFileSync('thailand-provinces.topojson'))
const thaiNames = JSON.parse(fs.readFileSync('provinces.json'))

// Create name mapping (English -> Thai)
const nameMap = {}
thaiNames.forEach(p => {
  nameMap[p.provinceNameEn.toLowerCase()] = {
    code: p.provinceCode,
    nameTh: p.provinceNameTh,
    nameEn: p.provinceNameEn
  }
})

// Convert TopoJSON to GeoJSON
const geojson = topojson.feature(topoData, topoData.objects.thailand_provinces)

// Setup projection for Thailand
const projection = geoMercator()
  .center([101.5, 13.5])  // Center of Thailand
  .scale(2500)
  .translate([400, 500])

const pathGenerator = geoPath().projection(projection)

// Generate SVG paths
let svgPaths = ''
geojson.features.forEach((feature, index) => {
  const englishName = feature.properties.NAME_1
  const thaiData = nameMap[englishName.toLowerCase()] || {}

  const d = pathGenerator(feature)
  const provinceId = feature.properties.ID_1

  svgPaths += `  <path
    id="province-${provinceId}"
    data-province-id="${provinceId}"
    data-name-en="${englishName}"
    data-name-th="${thaiData.nameTh || ''}"
    data-code="${thaiData.code || ''}"
    class="province"
    d="${d}"
  />\n`
})

// Output SVG
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" id="thailand-map">
  <style>
    .province { fill: #e5e7eb; stroke: #9ca3af; stroke-width: 0.5; cursor: pointer; }
    .province:hover { fill: #d1d5db; }
  </style>
${svgPaths}</svg>`

fs.writeFileSync('public/thailand-map.svg', svg)
console.log('Generated thailand-map.svg with 77 provinces')
```

### Province Name Mapping Table (for Seed Data)
```sql
-- Sample mapping: TopoJSON ID_1 -> Thai names with population
-- Full mapping in Appendix D: seeds/provinces.sql
INSERT INTO provinces (id, name_thai, name_english, region, population) VALUES
(1, 'กรุงเทพมหานคร', 'Bangkok', 'Central', 5456000),
(2, 'สมุทรปราการ', 'Samut Prakan', 'Central', 1360000),
(3, 'นนทบุรี', 'Nonthaburi', 'Central', 1270000),
(4, 'ปทุมธานี', 'Pathum Thani', 'Central', 1180000),
(5, 'พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya', 'Central', 818000),
-- ... (77 provinces total - see Appendix D for complete data)
(77, 'บึงกาฬ', 'Bueng Kan', 'Northeastern', 421000);
```

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 Core Tables

#### `parties`
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

-- Indexes
CREATE INDEX idx_parties_ballot_number ON parties(ballot_number);
```

#### `provinces`
```sql
CREATE TABLE provinces (
  id INTEGER PRIMARY KEY,  -- 1-77
  name_thai VARCHAR(255) NOT NULL UNIQUE,
  name_english VARCHAR(255),
  region VARCHAR(50),  -- Northern, Northeastern, Central, Southern, Eastern, Western
  population INTEGER NOT NULL,  -- Population for shield calculation
  svg_path TEXT,  -- SVG path d="..." attribute for map rendering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Computed columns for game mechanics
-- shield_max = population / 10
```

#### `province_state` (Real-time - Supabase Realtime enabled)
```sql
CREATE TABLE province_state (
  province_id INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id INTEGER REFERENCES parties(id),  -- NULL = neutral

  -- Shield System (like Clickwars)
  shield_current BIGINT NOT NULL DEFAULT 0,  -- Current shield value
  shield_max BIGINT NOT NULL,                -- Max shield = population / 10
  attack_counts JSONB NOT NULL DEFAULT '{}', -- { "party_id": clicks } for capture determination

  -- Legacy click tracking (for leaderboard)
  total_clicks BIGINT NOT NULL DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX idx_province_state_controlling ON province_state(controlling_party_id);
CREATE INDEX idx_province_state_shield ON province_state(shield_current);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE province_state;
```

**Shield System Rules:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  SHIELD MECHANICS                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  shield_max = province.population / 10                              │
│                                                                     │
│  NEUTRAL PROVINCE (controlling_party_id = NULL):                    │
│  - shield_current starts at 50% of shield_max                       │
│  - ANY click → shield_current -= 1                                  │
│  - When shield_current = 0 → highest attacker captures              │
│                                                                     │
│  CONTROLLED PROVINCE:                                               │
│  - After capture, shield_current = 5% of shield_max                 │
│  - Owner click → shield_current += 1 (max = shield_max)             │
│  - Attacker click → shield_current -= 1                             │
│  - When shield_current = 0 → highest attacker captures              │
│  - attack_counts resets to {} after capture                         │
└─────────────────────────────────────────────────────────────────────┘
```

#### `players`
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),  -- Supabase Auth user (anonymous)
  party_id INTEGER NOT NULL REFERENCES parties(id),
  nickname VARCHAR(100) NOT NULL,
  total_clicks BIGINT DEFAULT 0,
  last_click_at TIMESTAMPTZ,
  party_changed_at TIMESTAMPTZ DEFAULT NULL,  -- For 24hr cooldown on party change
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_party ON players(party_id);
CREATE INDEX idx_players_auth ON players(auth_id);
CREATE INDEX idx_players_clicks ON players(total_clicks DESC);

-- Nickname validation: 3-20 chars, Thai/English/numbers/underscore/space
-- Regex: ^[\u0E00-\u0E7Fa-zA-Z0-9_\s]{3,20}$
```

#### `game_state` (Singleton)
```sql
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Ensure only one row
  status VARCHAR(20) DEFAULT 'active',  -- active, ended, maintenance
  total_clicks BIGINT DEFAULT 0,
  total_players INTEGER DEFAULT 0,
  game_start_time TIMESTAMPTZ DEFAULT NOW(),
  game_end_time TIMESTAMPTZ DEFAULT '2026-02-08 23:59:59+07',  -- 8 Feb 2026, 23:59 ICT
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial row
INSERT INTO game_state (id) VALUES (1);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
```

### 3.2 Database Functions (PL/pgSQL)

#### `click_province` - Main click handler (Shield System)
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

  -- Initialize attack_counts if null
  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb);

  -- ===== CASE 1: Player's party controls this province → Add shield =====
  IF v_controlling_party = p_party_id THEN
    v_current_shield := LEAST(v_current_shield + 1, v_shield_max);
    v_result_action := 'defend';

    UPDATE province_state
    SET shield_current = v_current_shield,
        total_clicks = total_clicks + 1,
        updated_at = NOW()
    WHERE province_id = p_province_id;

  -- ===== CASE 2 & 3: Attacking → Reduce shield =====
  ELSE
    v_current_shield := GREATEST(v_current_shield - 1, 0);

    -- Track attack count for this party
    v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
    v_attack_counts := v_attack_counts || jsonb_build_object(p_party_id::text, v_new_attack_count);

    -- ===== CASE 3: Shield depleted → Determine new owner =====
    IF v_current_shield = 0 THEN
      -- Find highest attacker
      SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
      FROM jsonb_each_text(v_attack_counts)
      ORDER BY value::bigint DESC
      LIMIT 1;

      -- Transfer ownership to highest attacker
      v_controlling_party := v_max_attacker_id;
      v_current_shield := (v_shield_max * 0.05)::bigint;  -- 5% of max
      v_attack_counts := '{}'::jsonb;  -- Reset attack counts
      v_result_action := 'capture';

      UPDATE province_state
      SET controlling_party_id = v_controlling_party,
          shield_current = v_current_shield,
          attack_counts = v_attack_counts,
          total_clicks = total_clicks + 1,
          updated_at = NOW()
      WHERE province_id = p_province_id;
    ELSE
      -- Just update attack counts and shield
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

#### `join_game` - Player registration
```sql
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
  v_player_id UUID;
BEGIN
  -- Check if player already exists
  SELECT id INTO v_player_id
  FROM players WHERE auth_id = p_auth_id;

  IF v_player_id IS NOT NULL THEN
    -- Return existing player
    RETURN jsonb_build_object(
      'success', true,
      'player_id', v_player_id,
      'existing', true
    );
  END IF;

  -- Create new player
  INSERT INTO players (auth_id, party_id, nickname)
  VALUES (p_auth_id, p_party_id, p_nickname)
  RETURNING id INTO v_player_id;

  -- Update total players count
  UPDATE game_state
  SET total_players = total_players + 1,
      updated_at = NOW()
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'player_id', v_player_id,
    'existing', false
  );
END;
$$;
```

#### `get_leaderboard` - Party rankings
```sql
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  party_id INTEGER,
  party_name VARCHAR,
  official_color VARCHAR,
  provinces_controlled BIGINT,
  total_clicks BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(ps.province_id) DESC, SUM(ps.total_clicks) DESC) as rank,
    p.id as party_id,
    p.name_thai as party_name,
    p.official_color,
    COUNT(ps.province_id) as provinces_controlled,
    COALESCE(SUM(ps.total_clicks), 0) as total_clicks
  FROM parties p
  LEFT JOIN province_state ps ON ps.controlling_party_id = p.id
  GROUP BY p.id, p.name_thai, p.official_color
  ORDER BY provinces_controlled DESC, total_clicks DESC;
$$;
```

#### `change_party` - Party switching with 24hr cooldown
```sql
CREATE OR REPLACE FUNCTION change_party(
  p_player_id UUID,
  p_new_party_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_party INTEGER;
  v_last_change TIMESTAMPTZ;
  v_hours_remaining NUMERIC;
BEGIN
  -- Get current party and last change time
  SELECT party_id, party_changed_at
  INTO v_current_party, v_last_change
  FROM players WHERE id = p_player_id;

  -- Check if same party
  IF v_current_party = p_new_party_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already in this party'
    );
  END IF;

  -- Check 24hr cooldown
  IF v_last_change IS NOT NULL AND v_last_change > NOW() - INTERVAL '24 hours' THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_last_change + INTERVAL '24 hours' - NOW())) / 3600;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cooldown active',
      'hours_remaining', ROUND(v_hours_remaining, 1)
    );
  END IF;

  -- Change party: reset clicks, update party, set cooldown timestamp
  UPDATE players
  SET party_id = p_new_party_id,
      total_clicks = 0,
      party_changed_at = NOW(),
      last_active = NOW()
  WHERE id = p_player_id;

  RETURN jsonb_build_object(
    'success', true,
    'old_party', v_current_party,
    'new_party', p_new_party_id,
    'clicks_reset', true
  );
END;
$$;
```

#### `init_province_shields` - Initialize shields on game start
```sql
CREATE OR REPLACE FUNCTION init_province_shields()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Initialize all provinces as neutral with 50% shield
  UPDATE province_state ps
  SET
    controlling_party_id = NULL,
    shield_max = (SELECT population / 10 FROM provinces WHERE id = ps.province_id),
    shield_current = (SELECT population / 10 * 0.5 FROM provinces WHERE id = ps.province_id)::bigint,
    attack_counts = '{}'::jsonb,
    total_clicks = 0,
    updated_at = NOW();
END;
$$;
```

### 3.3 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Parties: Public read
CREATE POLICY "Parties are viewable by everyone" ON parties
  FOR SELECT USING (true);

-- Provinces: Public read
CREATE POLICY "Provinces are viewable by everyone" ON provinces
  FOR SELECT USING (true);

-- Province State: Public read (for map display)
CREATE POLICY "Province state is viewable by everyone" ON province_state
  FOR SELECT USING (true);

-- Game State: Public read
CREATE POLICY "Game state is viewable by everyone" ON game_state
  FOR SELECT USING (true);

-- Players: Users can read their own data
CREATE POLICY "Users can view own player data" ON players
  FOR SELECT USING (auth.uid() = auth_id);

-- Players: Users can see leaderboard (limited fields)
CREATE POLICY "Leaderboard is public" ON players
  FOR SELECT USING (true);
```

### 3.4 Triggers for Real-time Updates

```sql
-- Trigger to notify on province_state changes (for Supabase Realtime)
CREATE OR REPLACE FUNCTION notify_province_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'province_update',
    json_build_object(
      'province_id', NEW.province_id,
      'controlling_party_id', NEW.controlling_party_id,
      'click_counts', NEW.click_counts
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER province_state_changed
AFTER UPDATE ON province_state
FOR EACH ROW
EXECUTE FUNCTION notify_province_change();
```

---

## 4. Supabase Client API

### 4.1 Supabase Client Setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4.2 Data Fetching (Direct Table Queries)

#### Fetch all parties
```javascript
const { data: parties, error } = await supabase
  .from('parties')
  .select('*')
  .order('ballot_number')

// Response: Array of party objects
```

#### Fetch all provinces with state
```javascript
const { data: provinces, error } = await supabase
  .from('provinces')
  .select(`
    *,
    province_state (
      controlling_party_id,
      click_counts,
      total_clicks
    )
  `)

// Response: Array of provinces with nested state
```

#### Fetch game state
```javascript
const { data: gameState, error } = await supabase
  .from('game_state')
  .select('*')
  .single()

// Response: { total_clicks, total_players, status, game_end_time }
```

### 4.3 Database Functions (RPC Calls)

#### Join game
```javascript
// First: Create anonymous auth session
const { data: authData } = await supabase.auth.signInAnonymously()

// Then: Register player
const { data, error } = await supabase.rpc('join_game', {
  p_auth_id: authData.user.id,
  p_party_id: 1,
  p_nickname: 'PlayerName123'
})

// Response: { success: true, player_id: 'uuid-xxx', existing: false }
```

#### Click province
```javascript
const { data, error } = await supabase.rpc('click_province', {
  p_player_id: 'player-uuid',
  p_province_id: 13,
  p_party_id: 1
})

// Response: { success: true, province_id: 13, new_count: 451, controlling_party: 1 }
// Or: { success: false, error: 'Rate limited' }
```

#### Get leaderboard
```javascript
const { data: leaderboard, error } = await supabase.rpc('get_leaderboard')

// Response: Array of { rank, party_id, party_name, official_color, provinces_controlled, total_clicks }
```

### 4.4 Real-time Subscriptions

#### Subscribe to province state changes
```javascript
const channel = supabase
  .channel('province-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'province_state'
    },
    (payload) => {
      // payload.new contains updated province state
      const { province_id, controlling_party_id, click_counts } = payload.new
      updateMapProvince(province_id, controlling_party_id)
    }
  )
  .subscribe()

// Cleanup on unmount
channel.unsubscribe()
```

#### Subscribe to game state changes
```javascript
const gameChannel = supabase
  .channel('game-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_state'
    },
    (payload) => {
      const { total_clicks, total_players, status } = payload.new
      updateGameStats(total_clicks, total_players, status)
    }
  )
  .subscribe()
```

### 4.5 Authentication (Anonymous Sessions)

```javascript
// Create anonymous session on first visit
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) console.error('Auth error:', error)
    return data.user
  }

  return session.user
}

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### 4.6 Complete Frontend Integration Example

```javascript
// main.js - Full game initialization
import { supabase } from './supabase'

let player = null
let partyId = null

// Initialize game
async function initGame() {
  // 1. Auth
  const user = await initAuth()

  // 2. Load static data
  const [parties, provinces, gameState] = await Promise.all([
    supabase.from('parties').select('*'),
    supabase.from('provinces').select('*, province_state(*)'),
    supabase.from('game_state').select('*').single()
  ])

  // 3. Render UI
  renderPartySelector(parties.data)
  renderMap(provinces.data)
  renderGameStats(gameState.data)

  // 4. Subscribe to real-time updates
  subscribeToUpdates()
}

// Join game with selected party
async function joinParty(selectedPartyId, nickname) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase.rpc('join_game', {
    p_auth_id: user.id,
    p_party_id: selectedPartyId,
    p_nickname: nickname
  })

  player = data.player_id
  partyId = selectedPartyId

  showGameScreen()
}

// Handle province click
async function handleProvinceClick(provinceId) {
  if (!player) return

  // Optimistic UI update
  highlightProvince(provinceId)

  const { data, error } = await supabase.rpc('click_province', {
    p_player_id: player,
    p_province_id: provinceId,
    p_party_id: partyId
  })

  if (!data.success) {
    showError(data.error)  // Rate limited, etc.
  }
}

// Real-time subscriptions
function subscribeToUpdates() {
  supabase
    .channel('game')
    .on('postgres_changes', { event: 'UPDATE', table: 'province_state' }, handleProvinceUpdate)
    .on('postgres_changes', { event: 'UPDATE', table: 'game_state' }, handleGameStateUpdate)
    .subscribe()
}

function handleProvinceUpdate(payload) {
  const { province_id, controlling_party_id, click_counts } = payload.new
  updateProvinceColor(province_id, controlling_party_id)
  updateProvinceTooltip(province_id, click_counts)
}

// Start game
initGame()
```

---

## 5. Click Processing Pipeline (Supabase)

### 5.1 Simplified Click Handling

**Goal:** Handle high concurrent clicks with database function optimization

**Architecture (No Redis/Queue needed):**
```
Player Click (Browser)
    │
    └─→ supabase.rpc('click_province', {...})
           │
           ├─→ Database Function Execution
           │   │
           │   ├─→ Rate Limit Check (last_click_at timestamp)
           │   │   └─ If < 100ms since last click: reject
           │   │
           │   ├─→ Update province_state (JSONB increment)
           │   │   └─ Atomic update using jsonb_set
           │   │
           │   ├─→ Calculate controlling party
           │   │   └─ Party with max clicks wins
           │   │
           │   ├─→ Update player stats
           │   │   └─ total_clicks++, last_click_at = NOW()
           │   │
           │   └─→ Update game_state
           │       └─ total_clicks++
           │
           └─→ Supabase Realtime (automatic)
               └─→ postgres_changes event broadcasted
               └─→ All subscribed clients receive update
               └─→ Map colors update automatically
```

### 5.2 Click Processing Example
```
T=0ms: Player A clicks Nakhon Pathom (province 13), party_id=1
  → supabase.rpc('click_province', { p_province_id: 13, p_party_id: 1 })
  → Database function executes:
    - click_counts: {"1": 450} → {"1": 451}
    - controlling_party_id: 1 (unchanged)
  → Supabase Realtime broadcasts: { province_id: 13, controlling_party_id: 1 }
  → All clients update map

T=50ms: Player B clicks same province, party_id=2
  → Database function executes:
    - click_counts: {"1": 451, "2": 320} → {"1": 451, "2": 321}
    - controlling_party_id: 1 (still highest)
  → Broadcast to all clients

T=100ms: Party 2 overtakes Party 1
  → click_counts: {"1": 451, "2": 452}
  → controlling_party_id: 2 (FLIP!)
  → Broadcast: province_id: 13 now controlled by party 2
  → All maps update to new color
```

### 5.3 Performance Optimizations

| Concern | Solution |
|---------|----------|
| **Database write throughput** | JSONB atomic updates (no row locks), proper indexes |
| **Rate limiting** | Timestamp check in DB function (100ms interval) |
| **Realtime latency** | Supabase Realtime typically <100ms |
| **Connection limits** | Supabase Pro/Team plan for higher limits |
| **Query optimization** | Generated columns for total_clicks, materialized views for leaderboard |

### 5.4 Scaling Considerations

**Free Tier Limits:**
- 500 MB database
- 2 GB bandwidth
- 50K monthly active users
- 500 concurrent Realtime connections

**Pro Plan ($25/mo):**
- 8 GB database
- 250 GB bandwidth
- Unlimited users
- Up to 500 concurrent Realtime connections (can request increase)

**Team Plan ($599/mo) - For Election Day:**
- 100 GB+ database
- 2 TB+ bandwidth
- High availability
- Priority support
- Custom connection limits

---

## 6. Deployment Architecture (Google Cloud + Supabase)

### 6.1 Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSERS                            │
│              (Desktop / Mobile / Tablet)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
              HTTPS + WebSocket Connections
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    │
┌───────────────────┐  ┌─────────────────────┐   │
│  FIREBASE HOSTING │  │  SUPABASE CLOUD     │   │
│  (Google Cloud)   │  │  (Backend)          │   │
│                   │  │                     │   │
│  - index.html     │  │  - PostgreSQL DB    │   │
│  - main.js        │  │  - Realtime Server  │   │
│  - styles.css     │  │  - Auth Service     │   │
│  - map.svg        │  │  - Edge Functions   │   │
│  - ads.js         │  │                     │   │
│                   │  │  Region: Singapore  │   │
│  CDN: Google Edge │  │  (closest to TH)    │   │
│  (Bangkok node)   │  │                     │   │
└───────────────────┘  └─────────────────────┘   │
                             │                    │
        ┌────────────────────┴────────────────────┤
        │                                         │
        ▼                                         │
┌───────────────────┐                            │
│  GOOGLE ADSENSE   │◄───────────────────────────┘
│  - Banner ads     │
│  - Revenue track  │
└───────────────────┘
```

### 6.2 Frontend Deployment (Firebase Hosting)

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          }
        ]
      }
    ]
  }
}
```

**.firebaserc:**
```json
{
  "projects": {
    "default": "election-war-prod"
  }
}
```

**Environment Variables (.env.production):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### 6.3 GitHub Actions CI/CD (Firebase)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_ADSENSE_CLIENT_ID: ${{ secrets.ADSENSE_CLIENT_ID }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: election-war-prod
```

### 6.4 Firebase Project Setup

**Initial Setup:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy manually (first time)
firebase deploy --only hosting
```

### 6.5 Google AdSense Integration

**HTML (index.html):**
```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Election War - เกมเลือกตั้ง 2026</title>

  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
</head>
<body>
  <div id="app">
    <!-- Game content -->
    <header id="game-header">...</header>
    <main id="game-map">...</main>
    <aside id="leaderboard">...</aside>

    <!-- Ad Banner (Bottom) -->
    <footer id="ad-container">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="XXXXXXXXXX"
           data-ad-format="horizontal"
           data-full-width-responsive="true"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </footer>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**CSS (ads styling):**
```css
#ad-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f5f5f5;
  padding: 5px;
  text-align: center;
  z-index: 100;
  border-top: 1px solid #ddd;
}

/* Ensure map doesn't overlap with ad */
#game-map {
  padding-bottom: 100px; /* Height of ad banner */
}

/* Responsive ad container */
@media (max-width: 768px) {
  #ad-container {
    padding: 3px;
  }
  #game-map {
    padding-bottom: 60px; /* Smaller ad on mobile */
  }
}
```

### 6.6 Supabase Project Setup

**Initial Setup (via Supabase Dashboard or CLI):**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to existing project
supabase link --project-ref your-project-id

# Push database migrations
supabase db push

# Deploy edge functions (if any)
supabase functions deploy
```

**Database Migrations (supabase/migrations/001_initial.sql):**
```sql
-- All CREATE TABLE statements from Section 3
-- All CREATE FUNCTION statements
-- All RLS policies
-- Seed data for parties and provinces
```

---

## 7. Monitoring & Observability (Supabase Built-in)

### 7.1 Key Metrics (Supabase Dashboard)

| Metric | Alert Threshold | Where to Monitor |
|--------|-----------------|------------------|
| **Realtime Connections** | > 400 (80% of 500 limit) | Supabase Dashboard → Realtime |
| **Database Size** | > 6GB (75% of Pro) | Supabase Dashboard → Database |
| **API Requests** | Rate limit warnings | Supabase Dashboard → API |
| **Database CPU** | > 80% | Supabase Dashboard → Reports |
| **Bandwidth Usage** | > 200GB | Supabase Dashboard → Usage |
| **Auth Sessions** | Unusual spikes | Supabase Dashboard → Auth |
| **Function Invocations** | Edge function errors | Supabase Dashboard → Functions |

### 7.2 Supabase Logging (Logflare Integration)

**Available Logs:**
- API request logs (all HTTP requests)
- Postgres query logs (slow queries, errors)
- Realtime connection logs
- Auth event logs
- Edge function logs

**Access via:**
- Supabase Dashboard → Logs section
- Logflare dashboard (more advanced filtering)
- Export to external services (Datadog, etc.) on Team plan

### 7.3 Custom Monitoring (Optional)

**Frontend Error Tracking (Sentry):**
```javascript
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: 'production'
})

// Capture Supabase errors
supabase.rpc('click_province', {...})
  .then(({ error }) => {
    if (error) Sentry.captureException(error)
  })
```

**Simple Analytics (Vercel Analytics or Plausible):**
```html
<!-- Vercel Analytics - automatic with Vercel hosting -->
<script defer src="/_vercel/insights/script.js"></script>
```

### 7.4 Alerts Setup

**Supabase Email Alerts (Pro plan):**
- Database approaching storage limit
- High API error rates
- Realtime connection spikes
- Auth suspicious activity

**Custom Alerts (via webhook or Edge Function):**
```sql
-- Example: Alert when game ends
CREATE OR REPLACE FUNCTION check_game_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'active' THEN
    -- Call webhook to notify
    PERFORM net.http_post(
      'https://hooks.slack.com/xxx',
      '{"text": "Election War game has ended!"}',
      'application/json'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Security Considerations (Supabase)

### 8.1 Row Level Security (RLS) - Primary Defense

```sql
-- All tables have RLS enabled
-- Users can only read public data
-- Write operations go through SECURITY DEFINER functions

-- Example: Players can only update their own data
CREATE POLICY "Users update own data" ON players
  FOR UPDATE USING (auth.uid() = auth_id);

-- Province state: Read-only for clients (updates via function)
CREATE POLICY "Province state read only" ON province_state
  FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = blocked by default
```

### 8.2 Input Validation (Database Function)

```sql
-- Validation inside click_province function
CREATE OR REPLACE FUNCTION click_province(
  p_player_id UUID,
  p_province_id INTEGER,
  p_party_id INTEGER
)
RETURNS JSONB AS $$
BEGIN
  -- Validate province_id
  IF p_province_id < 1 OR p_province_id > 77 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid province');
  END IF;

  -- Validate party exists
  IF NOT EXISTS (SELECT 1 FROM parties WHERE id = p_party_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid party');
  END IF;

  -- Validate player exists and belongs to party
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id AND party_id = p_party_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid player');
  END IF;

  -- ... rest of function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.3 Rate Limiting (Database-level)

```sql
-- Rate limiting in click_province function
DECLARE
  v_last_click TIMESTAMPTZ;
BEGIN
  SELECT last_click_at INTO v_last_click
  FROM players WHERE id = p_player_id;

  -- Max 10 clicks per second (100ms between clicks)
  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '100 milliseconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too fast! Slow down.');
  END IF;
  -- ...
END;
```

### 8.4 SQL Injection Prevention

**Supabase client automatically uses parameterized queries:**
```javascript
// Safe - Supabase handles parameterization
const { data } = await supabase
  .from('players')
  .select('*')
  .eq('id', playerId)  // Automatically parameterized

// RPC calls are also safe
await supabase.rpc('click_province', {
  p_player_id: playerId,  // Passed as parameter, not string concatenation
  p_province_id: 13,
  p_party_id: 1
})
```

### 8.5 Authentication Security

```javascript
// Anonymous auth with proper session handling
const { data, error } = await supabase.auth.signInAnonymously()

// Session is stored in secure httpOnly cookie (Supabase default)
// JWT tokens have configurable expiration

// Supabase handles:
// - Token refresh
// - Session invalidation
// - Secure storage
```

### 8.6 API Key Security

```javascript
// Client uses ANON key (public, safe to expose)
// ANON key can only access data allowed by RLS policies

const supabase = createClient(
  'https://xxx.supabase.co',
  'eyJ...'  // This is ANON key, safe in client code
)

// SERVICE_ROLE key (admin) should NEVER be in client code
// Only use in server-side/edge functions if needed
```

### 8.7 CORS (Supabase Managed)

```
Supabase automatically handles CORS:
- API endpoints allow requests from any origin (controlled by RLS)
- Realtime connections are authenticated via JWT
- No additional CORS configuration needed
```

### 8.8 Bot Detection (Simple)

```sql
-- Flag suspicious patterns in database
CREATE OR REPLACE FUNCTION detect_bot_pattern()
RETURNS TRIGGER AS $$
DECLARE
  v_click_count INTEGER;
BEGIN
  -- Count clicks in last minute
  SELECT COUNT(*) INTO v_click_count
  FROM players
  WHERE id = NEW.id
    AND last_click_at > NOW() - INTERVAL '1 minute';

  -- If >500 clicks/minute, flag account
  IF v_click_count > 500 THEN
    UPDATE players SET is_flagged = true WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Testing Strategy (Supabase)

### 9.1 Unit Tests (Vitest)

```javascript
// tests/game.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role for testing
)

describe('Click Province Function', () => {
  beforeEach(async () => {
    // Reset test data
    await supabase.from('province_state')
      .update({ click_counts: {}, controlling_party_id: null })
      .eq('province_id', 1)
  })

  it('should increment click count', async () => {
    const { data } = await supabase.rpc('click_province', {
      p_player_id: 'test-player-uuid',
      p_province_id: 1,
      p_party_id: 1
    })

    expect(data.success).toBe(true)
    expect(data.new_count).toBe(1)
  })

  it('should rate limit rapid clicks', async () => {
    // First click
    await supabase.rpc('click_province', {
      p_player_id: 'test-player-uuid',
      p_province_id: 1,
      p_party_id: 1
    })

    // Immediate second click (should be rate limited)
    const { data } = await supabase.rpc('click_province', {
      p_player_id: 'test-player-uuid',
      p_province_id: 1,
      p_party_id: 1
    })

    expect(data.success).toBe(false)
    expect(data.error).toContain('Rate')
  })
})
```

### 9.2 Integration Tests

```javascript
// tests/integration/realtime.test.js
import { describe, it, expect } from 'vitest'

describe('Realtime Subscriptions', () => {
  it('should receive province update after click', async () => {
    let receivedUpdate = null

    // Subscribe to changes
    const channel = supabase
      .channel('test-updates')
      .on('postgres_changes',
        { event: 'UPDATE', table: 'province_state' },
        (payload) => { receivedUpdate = payload.new }
      )
      .subscribe()

    // Trigger a click
    await supabase.rpc('click_province', {
      p_player_id: 'test-player-uuid',
      p_province_id: 1,
      p_party_id: 1
    })

    // Wait for realtime update
    await new Promise(resolve => setTimeout(resolve, 500))

    expect(receivedUpdate).not.toBeNull()
    expect(receivedUpdate.province_id).toBe(1)

    channel.unsubscribe()
  })
})
```

### 9.3 E2E Tests (Playwright)

```javascript
// tests/e2e/game.spec.js
import { test, expect } from '@playwright/test'

test.describe('Election War Game', () => {
  test('should allow player to join and click', async ({ page }) => {
    await page.goto('/')

    // Select party
    await page.click('[data-party-id="1"]')
    await page.fill('[name="nickname"]', 'TestPlayer')
    await page.click('button:has-text("Enter Game")')

    // Wait for map to load
    await page.waitForSelector('svg#thailand-map')

    // Click a province
    await page.click('[data-province-id="13"]')

    // Verify click feedback
    await expect(page.locator('[data-province-id="13"]')).toHaveClass(/clicked/)
  })

  test('should update map in real-time', async ({ browser }) => {
    // Open two browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    await page1.goto('/')
    await page2.goto('/')

    // Both join as different parties
    // ... setup code ...

    // Player 1 clicks province
    await page1.click('[data-province-id="13"]')

    // Player 2 should see the update
    await expect(page2.locator('[data-province-id="13"]'))
      .toHaveAttribute('fill', '#E31838', { timeout: 2000 })
  })
})
```

### 9.4 Database Function Tests (pgTAP)

```sql
-- supabase/tests/click_province.test.sql
BEGIN;
SELECT plan(3);

-- Test 1: Valid click increments count
SELECT is(
  (click_province('test-uuid', 1, 1))->>'success',
  'true',
  'Valid click should succeed'
);

-- Test 2: Invalid province returns error
SELECT is(
  (click_province('test-uuid', 999, 1))->>'success',
  'false',
  'Invalid province should fail'
);

-- Test 3: Controlling party updates correctly
-- ... more tests ...

SELECT * FROM finish();
ROLLBACK;
```

---

## 10. Performance Optimization (Supabase)

### 10.1 Frontend Optimization
- **Code Splitting:** Lazy-load party data, province SVG via dynamic imports
- **SVG Optimization:** Minify Thailand map SVG, inline critical paths
- **Caching:** Browser cache for static assets, Service Worker for offline
- **Bundle Size:** Target <200KB (gzipped) - no heavy framework
- **Supabase Client:** Use singleton pattern, avoid multiple instances

```javascript
// Lazy load map component
const ThailandMap = lazy(() => import('./components/ThailandMap'))

// Singleton Supabase client
let supabaseInstance = null
export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(URL, KEY)
  }
  return supabaseInstance
}
```

### 10.2 Database Optimization
- **Indexes:** Ensure click_counts queries are fast
- **JSONB Operations:** Use efficient JSONB operators (->>, ||)
- **Generated Columns:** Pre-compute total_clicks
- **Connection Pooling:** Supabase handles this automatically (PgBouncer)

```sql
-- Efficient indexes
CREATE INDEX idx_province_state_party ON province_state(controlling_party_id);
CREATE INDEX idx_players_total_clicks ON players(total_clicks DESC);

-- Use efficient JSONB update (not full replacement)
UPDATE province_state
SET click_counts = click_counts || jsonb_build_object($1::text, new_count)
WHERE province_id = $2;
```

### 10.3 Realtime Optimization
- **Subscribe only to needed tables:** Don't subscribe to all changes
- **Debounce UI updates:** Don't re-render on every single update
- **Connection management:** Reuse single channel for multiple tables

```javascript
// Single channel for all game updates
const gameChannel = supabase
  .channel('game')
  .on('postgres_changes', { table: 'province_state' }, handleProvinceUpdate)
  .on('postgres_changes', { table: 'game_state' }, handleStatsUpdate)
  .subscribe()

// Debounce map re-renders
const debouncedRender = debounce(renderMap, 100)
```

---

## 11. Rollback & Recovery (Supabase)

### 11.1 Frontend Rollback (Firebase Hosting)
```
Firebase Console → Hosting → Release History → Rollback to previous version

Or via CLI:
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION TARGET_SITE_ID:live
```

**Instant Rollback:** Firebase keeps deployment history, rollback is instant via console.

### 11.2 Database Recovery (Supabase)

**Point-in-Time Recovery (Pro plan):**
- Restore to any point in the last 7 days
- Access via Supabase Dashboard → Database → Backups

**Daily Backups (all plans):**
- Automatic daily backups
- 7-day retention (Pro: 30 days)

**Manual Backup:**
```bash
# Export via Supabase CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### 11.3 Disaster Recovery Plan

| Scenario | Recovery Action | RTO |
|----------|----------------|-----|
| **Frontend bug** | Vercel rollback | < 1 min |
| **Database function bug** | Redeploy fixed function | < 5 min |
| **Data corruption** | Point-in-time recovery | < 30 min |
| **Supabase outage** | Wait for Supabase recovery | N/A |
| **Complete data loss** | Restore from backup | < 1 hour |

---

## 12. Cost Estimation (Supabase + Google Cloud)

### 12.1 Development Phase

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Supabase Free Tier** | $0 | Sufficient for development |
| **Firebase Hosting Free** | $0 | 10GB storage, 360MB/day |
| **Domain** | ~$15 one-time | .com or .th domain |
| **Total Dev Phase** | **~$15** | |

### 12.2 Production Phase (Pre-election)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Supabase Pro** | $25 | 8GB DB, 250GB bandwidth |
| **Firebase Hosting** | $0-10 | Free tier usually sufficient |
| **Google AdSense** | +$15-150 | REVENUE (not cost) |
| **Total Monthly** | **~$25-35 cost** | |
| **Net (with ads)** | **-$10 to +$120 profit** | |

### 12.3 Election Day (Peak Traffic)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Supabase Team** | $599 | High availability, custom limits |
| **Firebase Hosting** | $20-50 | Increased bandwidth |
| **Google AdSense** | +$300-3,000 | REVENUE (peak traffic) |
| **Total Cost** | **~$620-650** | |
| **Net (with ads)** | **-$350 to +$2,400** | Could be profitable! |

### 12.4 Total Estimated Cost & Revenue

| Period | Duration | Cost | Ad Revenue | Net |
|--------|----------|------|------------|-----|
| Development | 2 months | ~$30 | $0 | -$30 |
| Pre-launch | 1 month | ~$35 | $15-50 | -$20 to +$15 |
| Production | 3 months | ~$105 | $150-600 | +$45 to +$495 |
| Election month | 1 month | ~$650 | $300-3,000 | -$350 to +$2,350 |
| **Total Project** | **7 months** | **~$820** | **$465-3,650** | **-$355 to +$2,830** |

*Potential to break even or profit with sufficient traffic!*

---

## Appendix A: Environment Variables (Simplified)

### Frontend (.env.production)
```env
# Supabase Connection (safe to expose - ANON key only)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
VITE_GAME_END_TIME=2026-02-08T23:59:59+07:00
VITE_APP_NAME=Election War

# Google AdSense
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_SLOT_ID=XXXXXXXXXX

# Analytics (optional)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Supabase Dashboard Settings
```
Project Settings → API:
- Project URL: https://xxx.supabase.co
- anon public key: eyJ... (use in frontend)
- service_role key: eyJ... (NEVER expose, only for admin scripts)

Project Settings → Database:
- Connection string: postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
- (Use for migrations and backups only)
```

### GitHub Secrets (for CI/CD)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for testing)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} (JSON)
ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### Firebase Project Settings
```
Firebase Console → Project Settings:
- Project ID: election-war-prod
- Web API Key: (auto-generated, not needed for hosting-only)

Firebase Console → Hosting:
- Default site: election-war-prod.web.app
- Custom domain: electionwar.com (optional)
```

### Local Development (.env.local)
```env
# Use local Supabase instance
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ... (local anon key)

# Disable ads in development
VITE_ADSENSE_CLIENT_ID=
VITE_ADSENSE_SLOT_ID=
```

---

## Appendix B: Quick Start Guide

```bash
# 1. Clone repository
git clone https://github.com/your-org/election-war.git
cd election-war

# 2. Install dependencies
npm install

# 3. Setup Supabase
# - Create project at supabase.com
# - Copy URL and anon key to .env.local

# 4. Run database migrations
npx supabase db push

# 5. Seed initial data
npx supabase db seed

# 6. Start development server
npm run dev

# 7. Open http://localhost:5173

# 8. Setup Firebase Hosting
firebase login
firebase init hosting
# Select "dist" as public folder

# 9. Deploy to Firebase
npm run build
firebase deploy --only hosting

# 10. Setup Google AdSense
# - Apply at adsense.google.com
# - Add site for approval
# - Get ad unit code after approval
# - Add to index.html
```

---

## Appendix C: Google AdSense Setup Guide

### Step 1: Apply for AdSense
1. Go to https://adsense.google.com
2. Sign in with Google account
3. Add your website URL
4. Wait for approval (1-14 days)

### Step 2: Create Ad Unit
1. AdSense Dashboard → Ads → By ad unit
2. Create "Display ads"
3. Name: "Election War Bottom Banner"
4. Size: Responsive
5. Copy the ad code

### Step 3: Add to Website
```html
<!-- In index.html <head> -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
   crossorigin="anonymous"></script>

<!-- In index.html <body> footer -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### Step 4: Add Privacy Policy
- Required for AdSense approval
- Must disclose use of cookies and ads
- Template available at many legal sites
- Add link in footer: "Privacy Policy"

### Step 5: PDPA Compliance (Thailand)
- Add cookie consent banner
- Inform users about data collection
- Provide opt-out option

---

## Appendix D: Thailand Province Mapping (77 Provinces)

### Complete Province Reference Table

| ID | Name (Thai) | Name (English) | Region | Code |
|----|-------------|----------------|--------|------|
| 1 | กรุงเทพมหานคร | Bangkok | Central | 10 |
| 2 | สมุทรปราการ | Samut Prakan | Central | 11 |
| 3 | นนทบุรี | Nonthaburi | Central | 12 |
| 4 | ปทุมธานี | Pathum Thani | Central | 13 |
| 5 | พระนครศรีอยุธยา | Phra Nakhon Si Ayutthaya | Central | 14 |
| 6 | อ่างทอง | Ang Thong | Central | 15 |
| 7 | ลพบุรี | Lop Buri | Central | 16 |
| 8 | สิงห์บุรี | Sing Buri | Central | 17 |
| 9 | ชัยนาท | Chai Nat | Central | 18 |
| 10 | สระบุรี | Saraburi | Central | 19 |
| 11 | ชลบุรี | Chon Buri | Eastern | 20 |
| 12 | ระยอง | Rayong | Eastern | 21 |
| 13 | จันทบุรี | Chanthaburi | Eastern | 22 |
| 14 | ตราด | Trat | Eastern | 23 |
| 15 | ฉะเชิงเทรา | Chachoengsao | Eastern | 24 |
| 16 | ปราจีนบุรี | Prachin Buri | Eastern | 25 |
| 17 | นครนายก | Nakhon Nayok | Central | 26 |
| 18 | สระแก้ว | Sa Kaeo | Eastern | 27 |
| 19 | นครราชสีมา | Nakhon Ratchasima | Northeastern | 30 |
| 20 | บุรีรัมย์ | Buri Ram | Northeastern | 31 |
| 21 | สุรินทร์ | Surin | Northeastern | 32 |
| 22 | ศรีสะเกษ | Si Sa Ket | Northeastern | 33 |
| 23 | อุบลราชธานี | Ubon Ratchathani | Northeastern | 34 |
| 24 | ยโสธร | Yasothon | Northeastern | 35 |
| 25 | ชัยภูมิ | Chaiyaphum | Northeastern | 36 |
| 26 | อำนาจเจริญ | Amnat Charoen | Northeastern | 37 |
| 27 | หนองบัวลำภู | Nong Bua Lam Phu | Northeastern | 39 |
| 28 | ขอนแก่น | Khon Kaen | Northeastern | 40 |
| 29 | อุดรธานี | Udon Thani | Northeastern | 41 |
| 30 | เลย | Loei | Northeastern | 42 |
| 31 | หนองคาย | Nong Khai | Northeastern | 43 |
| 32 | มหาสารคาม | Maha Sarakham | Northeastern | 44 |
| 33 | ร้อยเอ็ด | Roi Et | Northeastern | 45 |
| 34 | กาฬสินธุ์ | Kalasin | Northeastern | 46 |
| 35 | สกลนคร | Sakon Nakhon | Northeastern | 47 |
| 36 | นครพนม | Nakhon Phanom | Northeastern | 48 |
| 37 | มุกดาหาร | Mukdahan | Northeastern | 49 |
| 38 | เชียงใหม่ | Chiang Mai | Northern | 50 |
| 39 | ลำพูน | Lamphun | Northern | 51 |
| 40 | ลำปาง | Lampang | Northern | 52 |
| 41 | อุตรดิตถ์ | Uttaradit | Northern | 53 |
| 42 | แพร่ | Phrae | Northern | 54 |
| 43 | น่าน | Nan | Northern | 55 |
| 44 | พะเยา | Phayao | Northern | 56 |
| 45 | เชียงราย | Chiang Rai | Northern | 57 |
| 46 | แม่ฮ่องสอน | Mae Hong Son | Northern | 58 |
| 47 | นครสวรรค์ | Nakhon Sawan | Central | 60 |
| 48 | อุทัยธานี | Uthai Thani | Central | 61 |
| 49 | กำแพงเพชร | Kamphaeng Phet | Central | 62 |
| 50 | ตาก | Tak | Western | 63 |
| 51 | สุโขทัย | Sukhothai | Central | 64 |
| 52 | พิษณุโลก | Phitsanulok | Central | 65 |
| 53 | พิจิตร | Phichit | Central | 66 |
| 54 | เพชรบูรณ์ | Phetchabun | Central | 67 |
| 55 | ราชบุรี | Ratchaburi | Western | 70 |
| 56 | กาญจนบุรี | Kanchanaburi | Western | 71 |
| 57 | สุพรรณบุรี | Suphan Buri | Central | 72 |
| 58 | นครปฐม | Nakhon Pathom | Central | 73 |
| 59 | สมุทรสาคร | Samut Sakhon | Central | 74 |
| 60 | สมุทรสงคราม | Samut Songkhram | Central | 75 |
| 61 | เพชรบุรี | Phetchaburi | Western | 76 |
| 62 | ประจวบคีรีขันธ์ | Prachuap Khiri Khan | Western | 77 |
| 63 | นครศรีธรรมราช | Nakhon Si Thammarat | Southern | 80 |
| 64 | กระบี่ | Krabi | Southern | 81 |
| 65 | พังงา | Phangnga | Southern | 82 |
| 66 | ภูเก็ต | Phuket | Southern | 83 |
| 67 | สุราษฎร์ธานี | Surat Thani | Southern | 84 |
| 68 | ระนอง | Ranong | Southern | 85 |
| 69 | ชุมพร | Chumphon | Southern | 86 |
| 70 | สงขลา | Songkhla | Southern | 90 |
| 71 | สตูล | Satun | Southern | 91 |
| 72 | ตรัง | Trang | Southern | 92 |
| 73 | พัทลุง | Phatthalung | Southern | 93 |
| 74 | ปัตตานี | Pattani | Southern | 94 |
| 75 | ยะลา | Yala | Southern | 95 |
| 76 | นราธิวาส | Narathiwat | Southern | 96 |
| 77 | บึงกาฬ | Bueng Kan | Northeastern | 38 |

### SQL Seed Data (seeds/provinces.sql)
```sql
-- Thailand 77 Provinces Seed Data with Population (December 2024)
-- Source: cvibhagool/thailand-map + thailand-geography-data + กรมการปกครอง
INSERT INTO provinces (id, name_thai, name_english, region, population) VALUES
-- Central Region (26 provinces)
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

-- Initialize province_state with shield system for all provinces
INSERT INTO province_state (province_id, shield_max, shield_current, attack_counts, total_clicks)
SELECT
  id,
  population / 10 as shield_max,                    -- Shield MAX = population / 10
  (population / 10 * 0.5)::bigint as shield_current, -- Neutral start at 50%
  '{}'::jsonb,
  0
FROM provinces;
```

### Shield Examples (Based on Population)
| Province | Population | Shield MAX | Neutral Start (50%) | After Capture (5%) |
|----------|------------|------------|---------------------|---------------------|
| กรุงเทพฯ | 5,456,000 | 545,600 | 272,800 | 27,280 |
| นครราชสีมา | 2,620,000 | 262,000 | 131,000 | 13,100 |
| เชียงใหม่ | 1,800,000 | 180,000 | 90,000 | 9,000 |
| สมุทรสงคราม | 187,000 | 18,700 | 9,350 | 935 |

### Region Summary
| Region | Province Count | Notes |
|--------|---------------|-------|
| Central | 26 | รวมกรุงเทพฯ และปริมณฑล |
| Northeastern (Isan) | 20 | ภาคตะวันออกเฉียงเหนือ |
| Northern | 9 | ภาคเหนือ |
| Southern | 14 | ภาคใต้ |
| Eastern | 7 | ภาคตะวันออก |
| Western | 5 | ภาคตะวันตก |
| **Total** | **77** | |

---

**Document End**

**Next Steps:**
1. Create Supabase project
2. Create Firebase project
3. Run database migrations (Section 3)
4. Implement frontend UI with ad container
5. Test real-time functionality
6. Apply for Google AdSense
7. Deploy to Firebase Hosting
8. Add ads after AdSense approval
9. Monitor revenue in AdSense dashboard

