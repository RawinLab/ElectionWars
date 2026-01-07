# Election War - Technical Architecture Review

**Date:** 2026-01-07
**Tech Lead:** Architecture Team
**Version:** 1.0

---

## 1. Tech Stack Decisions

### 1.1 Backend (Supabase - Fully Managed BaaS)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Platform** | Supabase Cloud | Fully managed PostgreSQL with real-time capabilities, eliminates need for custom backend |
| **Database** | PostgreSQL 15 | ACID compliance, JSONB for attack counts, proven scalability |
| **Real-time** | Supabase Realtime | Built-in Postgres LISTEN/NOTIFY, handles 500+ concurrent connections, <100ms latency |
| **Auth** | Supabase Auth | Anonymous sessions for frictionless onboarding, automatic JWT management |
| **Functions** | Database Functions (PL/pgSQL) | Server-side logic in database, SECURITY DEFINER for secure operations |

### 1.2 Frontend (Vanilla JS + Vite)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | Vanilla JavaScript (ES6+) | Small bundle size (<200KB), fast load times, no framework overhead |
| **Build Tool** | Vite | Lightning-fast dev server, ES modules, minimal configuration |
| **Map Rendering** | SVG (Inline) | Scalable, interactive province areas, easy color manipulation via CSS/JS |
| **Styling** | CSS3 (optional Tailwind) | Modern flexbox/grid, animations, utility-first for rapid development |
| **Client SDK** | @supabase/supabase-js | Official client for database, auth, real-time subscriptions |

### 1.3 Hosting & Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend Hosting** | Firebase Hosting | Google Cloud CDN, free tier generous, Thai edge nodes, easy CI/CD |
| **Backend Hosting** | Supabase Cloud (Singapore) | Closest region to Thailand, managed scaling, automatic backups |
| **CDN** | Google Cloud CDN | Automatic edge caching via Firebase, low latency in Thailand |
| **CI/CD** | GitHub Actions | Automated deployment on push, Firebase CLI integration |
| **Monitoring** | Supabase Dashboard + Sentry | Built-in metrics, error tracking |

### 1.4 Revenue & Analytics

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Ads** | Google AdSense | Native Google ecosystem integration, responsive ad units |
| **Analytics** | Plausible or Vercel Analytics | Privacy-friendly, lightweight tracking |

---

## 2. Database Schema

### 2.1 Core Tables

#### `parties`
```sql
CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name_thai VARCHAR(255) NOT NULL,
  name_english VARCHAR(255) NOT NULL,
  ballot_number INTEGER UNIQUE,
  official_color VARCHAR(7) NOT NULL,          -- HEX: #RRGGBB
  pattern_type VARCHAR(20) DEFAULT 'solid',    -- solid, striped, dotted
  leader_name VARCHAR(255),
  mp_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_ballot_number ON parties(ballot_number);
```

#### `provinces`
```sql
CREATE TABLE provinces (
  id INTEGER PRIMARY KEY,                      -- 1-77
  name_thai VARCHAR(255) NOT NULL UNIQUE,
  name_english VARCHAR(255),
  region VARCHAR(50),                          -- Northern, Northeastern, Central, Southern, Eastern, Western
  population INTEGER NOT NULL,                 -- Population for shield calculation
  svg_path TEXT,                               -- SVG path d="..." for rendering
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `province_state` (Real-time Enabled)
```sql
CREATE TABLE province_state (
  province_id INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id INTEGER REFERENCES parties(id),  -- NULL = neutral

  -- Shield System (Clickwars-inspired)
  shield_current BIGINT NOT NULL DEFAULT 0,    -- Current shield value
  shield_max BIGINT NOT NULL,                  -- Max = population / 10
  attack_counts JSONB NOT NULL DEFAULT '{}',   -- { "party_id": clicks } for capture

  -- Legacy tracking
  total_clicks BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_province_state_controlling ON province_state(controlling_party_id);
CREATE INDEX idx_province_state_shield ON province_state(shield_current);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE province_state;
```

**Shield System Rules:**
```
shield_max = province.population / 10

NEUTRAL (controlling_party_id = NULL):
  - shield_current starts at 50% of shield_max
  - ANY click → shield_current -= 1
  - When shield_current = 0 → highest attacker captures

CONTROLLED:
  - After capture, shield_current = 5% of shield_max
  - Owner click → shield_current += 1 (max = shield_max)
  - Attacker click → shield_current -= 1
  - When shield_current = 0 → highest attacker captures
  - attack_counts resets to {} after capture
```

#### `players`
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),      -- Supabase Auth (anonymous)
  party_id INTEGER NOT NULL REFERENCES parties(id),
  nickname VARCHAR(100) NOT NULL,
  total_clicks BIGINT DEFAULT 0,
  last_click_at TIMESTAMPTZ,
  party_changed_at TIMESTAMPTZ DEFAULT NULL,   -- For 24hr cooldown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_party ON players(party_id);
CREATE INDEX idx_players_auth ON players(auth_id);
CREATE INDEX idx_players_clicks ON players(total_clicks DESC);
```

#### `game_state` (Singleton)
```sql
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status VARCHAR(20) DEFAULT 'active',         -- active, ended, maintenance
  total_clicks BIGINT DEFAULT 0,
  total_players INTEGER DEFAULT 0,
  game_start_time TIMESTAMPTZ DEFAULT NOW(),
  game_end_time TIMESTAMPTZ DEFAULT '2026-02-08 23:59:59+07',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO game_state (id) VALUES (1);
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
```

### 2.2 Key Database Functions

#### `click_province` - Main Click Handler
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
  v_last_click TIMESTAMPTZ;
BEGIN
  -- Rate limiting: 100ms between clicks
  SELECT last_click_at INTO v_last_click FROM players WHERE id = p_player_id;
  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '100 milliseconds' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limited');
  END IF;

  -- Get province state
  SELECT shield_current, shield_max, controlling_party_id, attack_counts
  INTO v_current_shield, v_shield_max, v_controlling_party, v_attack_counts
  FROM province_state WHERE province_id = p_province_id;

  -- CASE 1: Defending (player's party controls province)
  IF v_controlling_party = p_party_id THEN
    v_current_shield := LEAST(v_current_shield + 1, v_shield_max);
    UPDATE province_state
    SET shield_current = v_current_shield, updated_at = NOW()
    WHERE province_id = p_province_id;

    -- Update player stats
    UPDATE players SET total_clicks = total_clicks + 1, last_click_at = NOW() WHERE id = p_player_id;
    UPDATE game_state SET total_clicks = total_clicks + 1 WHERE id = 1;

    RETURN jsonb_build_object('success', true, 'action', 'defend', 'shield', v_current_shield);
  END IF;

  -- CASE 2: Attacking
  v_current_shield := GREATEST(v_current_shield - 1, 0);
  v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb) || jsonb_build_object(p_party_id::text, v_new_attack_count);

  -- CASE 3: Capture (shield depleted)
  IF v_current_shield = 0 THEN
    SELECT key::integer INTO v_max_attacker_id
    FROM jsonb_each_text(v_attack_counts)
    ORDER BY value::bigint DESC LIMIT 1;

    UPDATE province_state
    SET controlling_party_id = v_max_attacker_id,
        shield_current = (v_shield_max * 0.05)::bigint,
        attack_counts = '{}'::jsonb,
        updated_at = NOW()
    WHERE province_id = p_province_id;

    UPDATE players SET total_clicks = total_clicks + 1, last_click_at = NOW() WHERE id = p_player_id;
    UPDATE game_state SET total_clicks = total_clicks + 1 WHERE id = 1;

    RETURN jsonb_build_object('success', true, 'action', 'capture', 'new_owner', v_max_attacker_id);
  END IF;

  -- Just attacking
  UPDATE province_state
  SET shield_current = v_current_shield, attack_counts = v_attack_counts, updated_at = NOW()
  WHERE province_id = p_province_id;

  UPDATE players SET total_clicks = total_clicks + 1, last_click_at = NOW() WHERE id = p_player_id;
  UPDATE game_state SET total_clicks = total_clicks + 1 WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'action', 'attack', 'shield', v_current_shield);
END;
$$;
```

#### `join_game` - Player Registration
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
  SELECT id INTO v_player_id FROM players WHERE auth_id = p_auth_id;

  IF v_player_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'player_id', v_player_id, 'existing', true);
  END IF;

  INSERT INTO players (auth_id, party_id, nickname)
  VALUES (p_auth_id, p_party_id, p_nickname)
  RETURNING id INTO v_player_id;

  UPDATE game_state SET total_players = total_players + 1 WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'player_id', v_player_id, 'existing', false);
END;
$$;
```

#### `change_party` - Party Switching (24hr Cooldown)
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
  v_last_change TIMESTAMPTZ;
  v_hours_remaining NUMERIC;
BEGIN
  SELECT party_changed_at INTO v_last_change FROM players WHERE id = p_player_id;

  IF v_last_change IS NOT NULL AND v_last_change > NOW() - INTERVAL '24 hours' THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_last_change + INTERVAL '24 hours' - NOW())) / 3600;
    RETURN jsonb_build_object('success', false, 'error', 'Cooldown active', 'hours_remaining', ROUND(v_hours_remaining, 1));
  END IF;

  UPDATE players
  SET party_id = p_new_party_id,
      total_clicks = 0,
      party_changed_at = NOW()
  WHERE id = p_player_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
```

#### `get_leaderboard` - Party Rankings
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
LANGUAGE sql STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(ps.province_id) DESC, SUM(ps.total_clicks) DESC) as rank,
    p.id,
    p.name_thai,
    p.official_color,
    COUNT(ps.province_id) as provinces_controlled,
    COALESCE(SUM(ps.total_clicks), 0) as total_clicks
  FROM parties p
  LEFT JOIN province_state ps ON ps.controlling_party_id = p.id
  GROUP BY p.id, p.name_thai, p.official_color
  ORDER BY provinces_controlled DESC, total_clicks DESC;
$$;
```

---

## 3. Frontend Architecture

### 3.1 Recommended Approach: Vanilla JS with Modules

**Rationale:**
- Small bundle size (<200KB gzipped)
- Fast initial load critical for viral potential
- No framework learning curve
- Direct DOM manipulation for map interactions
- Supabase client handles state management

### 3.2 File Structure
```
/home/dev/projects/ElectionWars/
├── public/
│   ├── index.html
│   ├── thailand-map.svg          # Generated from TopoJSON
│   ├── sounds/
│   │   └── click.mp3
│   └── favicon.ico
├── src/
│   ├── main.js                   # Entry point, game initialization
│   ├── lib/
│   │   └── supabase.js           # Supabase client singleton
│   ├── modules/
│   │   ├── map.js                # SVG map rendering, province interactions
│   │   ├── party-selector.js    # Party selection UI
│   │   ├── leaderboard.js       # Real-time leaderboard updates
│   │   ├── game-stats.js        # Game state display (total clicks, timer)
│   │   ├── audio.js              # Sound effects manager
│   │   ├── notifications.js     # Toast notifications
│   │   └── i18n.js               # Language switching (TH/EN)
│   ├── styles/
│   │   ├── main.css
│   │   ├── map.css
│   │   └── animations.css
│   └── utils/
│       ├── constants.js          # Game config, API endpoints
│       └── formatters.js         # Number formatting, date/time
├── scripts/
│   └── convert-map.js            # TopoJSON → SVG converter
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql
│   ├── seed.sql
│   └── config.toml
├── .env.local
├── .env.production
├── vite.config.js
├── firebase.json
├── .firebaserc
└── package.json
```

### 3.3 Key Technical Contracts

#### Type Definitions (JSDoc)
```javascript
/**
 * @typedef {Object} Province
 * @property {number} id - Province ID (1-77)
 * @property {string} name_thai - Thai name
 * @property {string} name_english - English name
 * @property {string} region - Region (Northern, Northeastern, etc.)
 * @property {number} population - Population for shield calculation
 * @property {string} svg_path - SVG path data
 */

/**
 * @typedef {Object} ProvinceState
 * @property {number} province_id
 * @property {number|null} controlling_party_id
 * @property {number} shield_current
 * @property {number} shield_max
 * @property {Object.<string, number>} attack_counts - { "party_id": count }
 * @property {number} total_clicks
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} Party
 * @property {number} id
 * @property {string} name_thai
 * @property {string} name_english
 * @property {number} ballot_number
 * @property {string} official_color - HEX color
 * @property {string} pattern_type - 'solid' | 'striped' | 'dotted'
 */

/**
 * @typedef {Object} ClickResult
 * @property {boolean} success
 * @property {string} action - 'defend' | 'attack' | 'capture'
 * @property {number} [shield] - Current shield value
 * @property {number} [new_owner] - Party ID if captured
 * @property {string} [error] - Error message if failed
 */
```

#### API Signatures

**Game Initialization:**
```javascript
async function initGame() {
  // 1. Create anonymous auth session
  const { data: { user } } = await supabase.auth.signInAnonymously()

  // 2. Load static data (parallel)
  const [parties, provinces, gameState] = await Promise.all([
    supabase.from('parties').select('*').order('ballot_number'),
    supabase.from('provinces').select('*, province_state(*)'),
    supabase.from('game_state').select('*').single()
  ])

  // 3. Render UI
  renderPartySelector(parties.data)
  renderMap(provinces.data)
  renderGameStats(gameState.data)

  // 4. Subscribe to real-time
  subscribeToUpdates()
}
```

**Province Click:**
```javascript
/**
 * Handle province click
 * @param {number} provinceId
 * @returns {Promise<ClickResult>}
 */
async function handleProvinceClick(provinceId) {
  if (!player || !partyId) return { success: false, error: 'Not logged in' }

  // Optimistic UI
  animateProvinceClick(provinceId)

  const { data, error } = await supabase.rpc('click_province', {
    p_player_id: player.id,
    p_province_id: provinceId,
    p_party_id: partyId
  })

  if (error || !data.success) {
    showError(data?.error || error.message)
    return data || { success: false, error: error.message }
  }

  // Success feedback
  if (data.action === 'capture') {
    showToast('win', `ยึด ${getProvinceName(provinceId)} สำเร็จ!`)
    playSound('capture')
  } else {
    playSound('click')
  }

  return data
}
```

**Real-time Subscription:**
```javascript
function subscribeToUpdates() {
  const channel = supabase
    .channel('game-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'province_state'
    }, (payload) => {
      updateProvinceVisual(payload.new)
      checkShieldWarning(payload.new)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_state'
    }, (payload) => {
      updateGameStats(payload.new)
      checkGameEnd(payload.new)
    })
    .subscribe()

  return channel
}
```

---

## 4. Real-time Implementation

### 4.1 Supabase Realtime Architecture

**How it Works:**
```
Player Click (Browser)
  ↓
supabase.rpc('click_province', {...})
  ↓
PostgreSQL Function Executes
  ↓
province_state table UPDATE
  ↓
PostgreSQL NOTIFY trigger fires
  ↓
Supabase Realtime Server (Phoenix)
  ↓
WebSocket broadcast to all subscribers
  ↓
All connected clients receive update
  ↓
Update map colors/shields in real-time
```

**Latency:** Typically <100ms from click to all clients seeing update

### 4.2 Connection Management

```javascript
// Single channel for all game updates
let gameChannel = null

function subscribeToUpdates() {
  if (gameChannel) {
    gameChannel.unsubscribe()
  }

  gameChannel = supabase
    .channel('game', { config: { broadcast: { self: true } } })
    .on('postgres_changes', { event: 'UPDATE', table: 'province_state' }, handleProvinceUpdate)
    .on('postgres_changes', { event: 'UPDATE', table: 'game_state' }, handleGameStateUpdate)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time connected')
      }
    })
}

// Reconnection handling
supabase.realtime.onSubscriptionStateChange((state) => {
  if (state === 'CLOSED' || state === 'CHANNEL_ERROR') {
    setTimeout(subscribeToUpdates, 1000) // Retry after 1s
  }
})
```

### 4.3 Optimistic UI Updates

```javascript
async function handleProvinceClick(provinceId) {
  // 1. Immediate visual feedback
  animateProvince(provinceId, player.party_color)
  incrementLocalShield(provinceId, player.is_owner ? 1 : -1)

  // 2. Send to server
  const { data } = await supabase.rpc('click_province', {...})

  // 3. If failed, revert optimistic update
  if (!data.success) {
    revertProvinceAnimation(provinceId)
    revertShieldChange(provinceId)
  }

  // 4. Real-time update will sync actual state
}
```

---

## 5. Folder Structure (Recommended)

```
/home/dev/projects/ElectionWars/
├── docs/                          # Documentation
│   ├── reports/                   # Technical reports
│   │   └── 202601070700-tech-architecture.md
│   └── kbs/                       # Knowledge base
│       └── api-contracts.md
├── public/                        # Static assets
│   ├── index.html
│   ├── thailand-map.svg
│   ├── sounds/
│   │   ├── click.mp3
│   │   └── capture.mp3
│   └── images/
│       └── party-logos/
├── src/                           # Source code
│   ├── main.js                    # Entry point
│   ├── lib/
│   │   └── supabase.js            # Supabase client
│   ├── modules/                   # Feature modules
│   │   ├── auth.js
│   │   ├── map.js
│   │   ├── party-selector.js
│   │   ├── leaderboard.js
│   │   ├── game-stats.js
│   │   ├── audio.js
│   │   ├── notifications.js
│   │   └── i18n.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── map.css
│   │   ├── components.css
│   │   └── animations.css
│   └── utils/
│       ├── constants.js
│       ├── formatters.js
│       └── validators.js
├── scripts/                       # Build scripts
│   ├── convert-map.js             # TopoJSON to SVG
│   └── seed-data.js
├── supabase/                      # Supabase project
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   ├── seed.sql
│   └── config.toml
├── tests/                         # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .env.local                     # Local environment
├── .env.production                # Production environment
├── .gitignore
├── vite.config.js
├── firebase.json
├── .firebaserc
├── package.json
└── README.md
```

---

## 6. Key Technical Decisions Summary

### 6.1 Why Supabase?
- **Eliminates Backend Development:** No Node.js/Express needed
- **Built-in Real-time:** Replaces Socket.io, Redis, message queues
- **Authentication:** Anonymous sessions built-in
- **Scalability:** Handles scaling automatically (Pro: 500 connections, Team: custom limits)
- **Development Speed:** Focus on game logic, not infrastructure

### 6.2 Why Vanilla JS?
- **Bundle Size:** <200KB gzipped (critical for viral sharing)
- **Performance:** Direct DOM manipulation for map (faster than VDOM)
- **Simplicity:** No framework complexity, easy for contributors
- **Load Time:** Faster initial load = better user retention

### 6.3 Why Firebase Hosting?
- **Free Tier:** Generous (10GB storage, 360MB/day bandwidth)
- **CDN:** Google Cloud CDN with Thai edge nodes
- **CI/CD:** GitHub Actions integration
- **SSL:** Automatic SSL provisioning
- **AdSense Integration:** Native Google ecosystem

### 6.4 Shield System Implementation
- **JSONB for Attack Counts:** Atomic updates, no row locks
- **Database-side Logic:** SECURITY DEFINER functions prevent cheating
- **Real-time Sync:** Supabase Realtime broadcasts changes automatically
- **Rate Limiting:** Database-enforced (100ms per player)

---

## 7. API Contracts (Client ↔ Supabase)

### 7.1 Authentication
```javascript
// Anonymous sign-in
const { data: { user } } = await supabase.auth.signInAnonymously()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### 7.2 Game Join
```javascript
const { data } = await supabase.rpc('join_game', {
  p_auth_id: user.id,
  p_party_id: 1,
  p_nickname: 'PlayerName'
})
// Returns: { success: true, player_id: 'uuid', existing: false }
```

### 7.3 Province Click
```javascript
const { data } = await supabase.rpc('click_province', {
  p_player_id: player.id,
  p_province_id: 13,
  p_party_id: 1
})
// Returns: { success: true, action: 'attack|defend|capture', shield: 12345, ... }
```

### 7.4 Party Change
```javascript
const { data } = await supabase.rpc('change_party', {
  p_player_id: player.id,
  p_new_party_id: 2
})
// Returns: { success: false, error: 'Cooldown active', hours_remaining: 12.5 }
```

### 7.5 Leaderboard
```javascript
const { data } = await supabase.rpc('get_leaderboard')
// Returns: [{ rank: 1, party_id: 1, party_name: '...', provinces_controlled: 25, ... }]
```

### 7.6 Real-time Subscriptions
```javascript
supabase
  .channel('game')
  .on('postgres_changes', { event: 'UPDATE', table: 'province_state' }, (payload) => {
    // payload.new = { province_id, controlling_party_id, shield_current, ... }
  })
  .subscribe()
```

---

## 8. Security Considerations

### 8.1 Row Level Security (RLS)
- All tables have RLS enabled
- Public read access for game data
- Write operations only via SECURITY DEFINER functions
- Players can only see own detailed stats

### 8.2 Input Validation
- Database functions validate all inputs
- Nickname regex: `^[\u0E00-\u0E7Fa-zA-Z0-9_\s]{3,20}$`
- Province ID: 1-77
- Party ID: exists in parties table

### 8.3 Rate Limiting
- Database-enforced: 100ms between clicks per player
- Prevents rapid-fire clicking bots
- Returns error: `{ success: false, error: 'Rate limited' }`

### 8.4 API Key Security
- Frontend uses ANON key (safe to expose)
- ANON key can only access RLS-allowed data
- SERVICE_ROLE key never exposed in client

---

## 9. Performance Optimizations

### 9.1 Frontend
- SVG map optimized (minified paths)
- Code splitting for party selector, leaderboard
- Service Worker for offline caching
- Lazy load sounds

### 9.2 Database
- Indexes on province_state(controlling_party_id), players(total_clicks)
- JSONB operators for efficient attack_counts updates
- Connection pooling (Supabase PgBouncer)

### 9.3 Real-time
- Single channel for all subscriptions
- Debounce UI updates (100ms)
- Automatic reconnection

---

## 10. Deployment Strategy

### 10.1 Development Phase
- Supabase Free Tier
- Firebase Hosting Free Tier
- Cost: ~$15/month (domain only)

### 10.2 Production Phase
- Supabase Pro ($25/mo): 8GB DB, 250GB bandwidth, 500 connections
- Firebase Hosting: Free tier sufficient
- Google AdSense: Revenue generation
- Net cost: $25-35/mo (before ad revenue)

### 10.3 Election Day (Peak)
- Supabase Team ($599/mo): High availability, custom limits
- Firebase Hosting: ~$20-50/mo (increased bandwidth)
- Google AdSense: $300-3,000 revenue
- Net: -$350 to +$2,400 (potential profit!)

---

## Appendix: Shield Calculation Examples

| Province | Population | Shield MAX | Neutral (50%) | Captured (5%) |
|----------|------------|------------|---------------|---------------|
| กรุงเทพฯ | 5,456,000 | 545,600 | 272,800 | 27,280 |
| นครราชสีมา | 2,620,000 | 262,000 | 131,000 | 13,100 |
| เชียงใหม่ | 1,800,000 | 180,000 | 90,000 | 9,000 |
| ชลบุรี | 1,604,000 | 160,400 | 80,200 | 8,020 |
| สมุทรสงคราม | 187,000 | 18,700 | 9,350 | 935 |

---

**Document End**
