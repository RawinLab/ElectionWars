# Election War - Product Requirements Document (PRD)

**Version:** 1.1
**Date:** January 7, 2026
**Status:** Draft for Development
**Game End Date:** February 8, 2026 (Election Day Thailand)
**Related:** See `Election_War_Clarified.md` for detailed clarifications

---

## 1. Overview

**Game Name:** Election War (อีเลคชั่น วอร์)

**Core Concept:** A real-time, browser-based idle clicker game where players choose a Thai political party (party list) and compete to "win" Thai provinces (จังหวัด) through continuous clicking. Similar to Clickwar but themed around Thailand's 2026 parliamentary election (8 Feb 2026).

**Platform:** Web Browser (HTML5) - Cross-browser compatible, mobile-friendly  
**Play Style:** Unlimited play with real-time competition  
**Game Duration:** From game launch → February 8, 2026 (Election Day) at 23:59 ICT  
**Target Audience:** Thai voters, casual gamers, political enthusiasts aged 13+

---

## 2. Game Mechanics

### 2.1 Party Selection
- **Initial Screen:** Player selects their political party from the registered party list (2026 election, ~57 parties)
- **Focus Parties (Primary Display):** The major parties with official colors:
  - **พรรคเพื่อไทย (Pheu Thai)** - Red (#E31838)
  - **พรรคประชาชน (People's Party)** - Orange (#FF7A00)
  - **พรรคภูมิใจไทย (Bhumjaithai)** - Blue (#004E89)
  - **พรรคประชาธิปัตย์ (Democrat)** - Light Blue (#87CEEB)
  - **พรรคพลังประชารัฐ (Palang Pracharath)** - Dark Green (#1B4D3E)
  - **พรรครวมไทยสร้างชาติ (United Thai Nation)** - Purple (#663399)
  - Plus 10-15 additional visible parties

- **Smaller Parties:** Shown in list but with pattern fills (horizontal lines, diagonal lines, dots) to differentiate from solid-color parties when space overlaps on the map

### 2.2 Main Game Screen
- **Interactive Map:** Thailand divided into **77 provinces (จังหวัด)**
- **Map Display:** Each province shows with:
  - Province name
  - Current color/pattern (indicating which party has won/controlled it)
  - Click counter (optional) showing current votes/clicks for that province

### 2.3 Game Rules

#### 2.3.1 Shield System (Core Mechanic)
Each province has a **Shield** that must be depleted before capture. Shield values are based on real province population data.

```
Shield System Flow:
┌─────────────────────────────────────────────────────┐
│  Province Control Flow                               │
├─────────────────────────────────────────────────────┤
│  1. Neutral province มี shield เริ่มต้น 50% ของ MAX   │
│  2. ทุกพรรค click → ลด shield                        │
│  3. เมื่อ shield = 0 → พรรคที่ click มากสุดได้ยึด      │
│  4. หลังยึด shield เริ่มที่ 5% ของ MAX                │
│  5. พรรคเจ้าของ click → เพิ่ม shield (max = MAX)     │
│  6. พรรคอื่น click → ลด shield                       │
│  7. เมื่อ shield = 0 อีกครั้ง → พรรคที่โจมตีมากสุดยึด   │
└─────────────────────────────────────────────────────┘
```

**Shield Calculation:**
- `Shield MAX = Province Population / 10`
- Neutral province starts at 50% of Shield MAX
- After capture, new shield = 5% of Shield MAX

**Example Shield Values:**
| Province | Population | Shield MAX | Neutral Start | After Capture |
|----------|------------|------------|---------------|---------------|
| Bangkok | 5,456,000 | 545,600 | 272,800 | 27,280 |
| Chiang Mai | 1,800,000 | 180,000 | 90,000 | 9,000 |
| Samut Songkhram | 187,000 | 18,700 | 9,350 | 935 |

#### 2.3.2 Clicking Mechanic
- **Defend (Own Province):** Click → Shield +1 (up to Shield MAX)
- **Attack (Enemy/Neutral):** Click → Shield -1, track attack count
- Each click contributes to province control
- Real-time aggregation of all players' clicks globally

#### 2.3.3 Province Control
- **Neutral → Controlled:** When shield depletes to 0, party with MOST attack clicks captures
- **Flip Ownership:** When controlled province shield = 0, highest attacker takes over
- After capture: All attack counts reset, new shield = 5% of MAX
- Example: เชียงใหม่ has shield 50,000. Pheu Thai attacks 30,000 times, Bhumjaithai 20,000 times. When shield = 0, Pheu Thai captures (higher attack count).

#### 2.3.4 Scoring System
- 1 click = 1 shield point (defend) or 1 attack point
- No daily caps (unlimited play)
- Individual player contribution tracked (leaderboard)
- Global party coverage is the main metric

### 2.4 Win Conditions & Game End

**Victory at Game End (8 Feb 2026, 23:59 ICT):**
- **Top Party:** The party controlling the MOST provinces wins
- **Secondary Metric:** Total global clicks by each party
- **Display:** Final leaderboard showing:
  1. Provinces controlled by each party
  2. Total clicks per party
  3. Top 10 individual players

**Game End Behavior:**
```javascript
// When game ends:
game_status = 'ended'
// 1. Disable all clicks (no more gameplay)
// 2. Show final results overlay
// 3. Display: provinces per party, total clicks, top players
// 4. Map still viewable but not interactive
```

**Final Results Screen:**
- Full-screen overlay with results summary
- Animated celebration for winning party
- Share to social media buttons
- "Game has ended" banner on map

### 2.5 Player Rules

#### 2.5.1 Party Change
Players can switch parties with the following rules:
- **Cooldown:** 24 hours between party changes
- **Penalty:** Total clicks reset to 0 when changing party
- **No Limit:** No restriction on total number of changes (just cooldown)

#### 2.5.2 Nickname Validation
- **Length:** 3-20 characters
- **Allowed:** Thai (ก-ฮ), English (A-Z, a-z), numbers (0-9), underscore, space
- **Pattern:** `^[\u0E00-\u0E7Fa-zA-Z0-9_\s]+$`

### 2.6 UX Features

#### 2.6.1 Click Feedback
Multiple feedback types for satisfying gameplay:
- **Visual Animation:** Province pulses on click (scale 1.02x)
- **Floating Number:** +1 floats up and fades out
- **Sound Effect:** Click sound (with mute button in settings)

```css
/* Province click animation */
.province.clicked { animation: pulse 0.2s ease-out; }
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

#### 2.6.2 Notifications (Toast)
Toast notifications for important events:
| Event | Message Example | Duration |
|-------|-----------------|----------|
| Province Flip | "เชียงใหม่ ถูกยึดโดย พรรคเพื่อไทย!" | 3s |
| Your Party Win | "พรรคของคุณยึด นครปฐม สำเร็จ!" | 3s |
| Shield Warning | "เตือน! สงขลา shield เหลือ 15%" | 3s |

- **Position:** Top-right corner
- **Style:** Non-intrusive, dismissible

#### 2.6.3 Language Support
- **Primary:** Thai (ภาษาไทย)
- **Secondary:** English
- **Province Names:** Thai as primary, English as tooltip
- **System Messages:** Based on browser language preference
- **Toggle:** TH/EN switch button in header
- **Storage:** Language preference saved in localStorage

---

## 3. User Interface (UI)

### 3.1 Layout
**Homepage/Party Select Screen:**
- Large party selector with official party colors
- Optional: Show party leader, number of MPs (real data)
- "Enter Game" button per party

**Main Game Screen:**
- **Left Sidebar (20% width):**
  - Current party name + color badge
  - Live stats: Provinces controlled, Total clicks
  - Real-time leaderboard (top 5 parties by provinces)
  - Logout button

- **Center Map (80% width):**
  - Responsive Thailand map with all 77 provinces
  - Each province is clickable
  - Color changes real-time as clicks roll in
  - Hover tooltip showing:
    - Province name (Thai + English)
    - Current controlling party (or "Neutral")
    - Shield bar (current / max)
    - Your party's attack count (if attacking)

- **Bottom Bar:**
  - Click speed indicator (clicks/second across all players)
  - Game ends in: [Timer counting down to 8 Feb 2026]
  - Refresh rate: Update every 500ms to 1 second

### 3.2 Design System
- **Color Palette:** Use official party colors only
- **Small Parties:** Use pattern overlays (CSS patterns: striped, dotted, diagonal) when color would be too similar
- **Neutral Province:** Light gray (#E0E0E0) or very light beige
- **UI Theme:** Minimalist, inspired by Clickwar (flat design, clean typography)
- **Responsive:** Desktop-first, but mobile-optimized (touch-friendly clickable areas)

---

## 4. Technical Architecture

### 4.1 Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+) + Supabase JS Client
- **Backend:** Supabase (BaaS - Backend as a Service)
  - PostgreSQL Database (hosted)
  - Realtime Subscriptions (Postgres LISTEN/NOTIFY)
  - Edge Functions (serverless, for complex logic)
  - Row Level Security (RLS) for data protection
- **Real-time Communication:** Supabase Realtime (built-in)
- **Authentication:** Supabase Auth (anonymous sessions)
- **Deployment:** Supabase Cloud (managed) + Google Cloud Hosting (Firebase Hosting / Cloud Storage + Cloud CDN)
- **Monetization:** Google AdSense (banner ads at bottom of game screen)

### 4.2 Data Model (High-level)

**players table:**
```sql
{
  id: UUID PRIMARY KEY,
  party_id: INTEGER REFERENCES parties(id),
  nickname: VARCHAR(100),  -- 3-20 chars, Thai/English/numbers
  total_clicks: BIGINT DEFAULT 0,
  party_changed_at: TIMESTAMPTZ,  -- For 24hr cooldown
  created_at: TIMESTAMPTZ DEFAULT now(),
  last_active: TIMESTAMPTZ DEFAULT now()
}
```

**provinces table:**
```sql
{
  id: INTEGER PRIMARY KEY (1-77),
  name_thai: VARCHAR(255),
  name_english: VARCHAR(255),
  region: VARCHAR(50),
  population: INTEGER,  -- For shield calculation
  svg_path: TEXT
}
```

**province_state table (Real-time):**
```sql
{
  province_id: INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id: INTEGER REFERENCES parties(id),
  shield_current: BIGINT,          -- Current shield value
  shield_max: BIGINT,              -- Max shield = population / 10
  attack_counts: JSONB DEFAULT '{}',  -- { "party_id": count } for capture
  total_clicks: BIGINT DEFAULT 0,
  updated_at: TIMESTAMPTZ DEFAULT now()
}
```

**parties table:**
```sql
{
  id: INTEGER PRIMARY KEY,
  name_thai: VARCHAR(255),
  name_english: VARCHAR(255),
  ballot_number: INTEGER,
  official_color: VARCHAR(7),  -- HEX #RRGGBB
  pattern_type: VARCHAR(20),
  leader_name: VARCHAR(255),
  mp_count: INTEGER
}
```

**game_state table (Singleton):**
```sql
{
  id: INTEGER PRIMARY KEY DEFAULT 1,
  total_clicks: BIGINT DEFAULT 0,
  total_players: INTEGER DEFAULT 0,
  status: VARCHAR(20) DEFAULT 'active',
  game_end_time: TIMESTAMPTZ DEFAULT '2026-02-08 23:59:59+07'
}
```

### 4.3 Supabase Integration

**Frontend Direct Connection:**
```javascript
// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Real-time subscription for province changes
supabase.channel('province_updates')
  .on('postgres_changes', { event: 'UPDATE', table: 'province_state' }, callback)
  .subscribe()

// Click action via Database Function (RPC)
await supabase.rpc('click_province', { province_id: 13, party_id: 1 })
```

**Database Functions (RPC):**
- `click_province(player_id, province_id, party_id)` → Handle shield mechanics:
  - Own province: Shield +1 (defend)
  - Enemy/Neutral: Shield -1 (attack), track attack count
  - Returns: action type, shield values, controlling party
- `get_leaderboard()` → Return party rankings
- `join_game(auth_id, party_id, nickname)` → Create player session
- `change_party(player_id, new_party_id)` → Switch party with 24hr cooldown
- `init_province_shields()` → Initialize all provinces with 50% shield

---

## 5. Data Source

### 5.1 Political Parties (2026 Election)
**Source:** Thailand Election Commission (กกต.) - 57 registered parties  
**Key Data:**
- Party name (Thai + English)
- Official party ballot number
- Official party color (from EC documents)
- Party leader name
- MP count (current parliament)

**Major Parties Priority:**
1. Pheu Thai (เพื่อไทย) - Red
2. People's Party (ประชาชน) - Orange
3. Bhumjaithai (ภูมิใจไทย) - Blue
4. Democrat (ประชาธิปัตย์) - Light Blue
5. Palang Pracharath (พลังประชารัฐ) - Green
6. United Thai Nation (รวมไทยสร้างชาติ) - Purple
+ Additional 51 smaller parties

### 5.2 Thai Provinces
**Source:** Thai government administrative divisions  
**Data:** 77 provinces with official names (Thai)  
**Map:** SVG/Canvas polygon coordinates for each province

---

## 6. Revenue Model (Advertising)

### 6.1 Ad Placement Strategy
- **Location:** Fixed banner at bottom of game screen (below map)
- **Size:** 728x90 (Leaderboard) for desktop, 320x50 (Mobile Banner) for mobile
- **Visibility:** Always visible during gameplay, does not obstruct map interaction
- **Ad Type:** Display ads (Google AdSense)

### 6.2 Ad Implementation
```
┌─────────────────────────────────────────────────┐
│                  HEADER / STATS                 │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              THAILAND MAP (77 จังหวัด)           │
│              (Main Game Area)                   │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│              LEADERBOARD SIDEBAR                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │         GOOGLE ADSENSE BANNER               │ │
│ │         (728x90 Desktop / 320x50 Mobile)    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 6.3 Ad Network
- **Primary:** Google AdSense
- **Backup:** Google Ad Manager (if AdSense rejected)
- **Requirements:**
  - Website must be approved by Google AdSense
  - Privacy Policy page required
  - Cookie consent banner (PDPA compliance)

### 6.4 Revenue Estimation
| Metric | Estimate |
|--------|----------|
| **Daily Active Users (DAU)** | 10,000 - 50,000 |
| **Page Views/User** | 3-5 (multiple sessions) |
| **CPM (Cost per 1000 impressions)** | $0.50 - $2.00 (Thailand market) |
| **Daily Revenue** | $15 - $500 |
| **Monthly Revenue** | $450 - $15,000 |
| **Election Day Peak** | 2-5x normal traffic |

*Note: Actual revenue depends on ad fill rate, user engagement, and advertiser demand.*

### 6.5 User Experience Considerations
- Ads should NOT cover gameplay elements
- No pop-up or interstitial ads (annoying for clicker games)
- No auto-play video ads
- Single banner placement only
- Fast ad loading (lazy load after game loads)

---

## 7. Gameplay Features (MVP)

### Phase 1 (MVP - Launch)
- [x] Party selection screen
- [x] Real-time province map (all 77 provinces)
- [x] Click-to-vote mechanic
- [x] Real-time map updates via WebSocket
- [x] Live party leaderboard (provinces controlled)
- [x] Simple player stats (nickname, click count)
- [x] Mobile responsive UI
- [x] Game timer (countdown to 8 Feb 2026)

### Phase 2 (Post-Launch - Optional)
- [ ] Individual player leaderboard (top 100 clickers)
- [ ] Province info cards (current stats, trending parties)
- [ ] Achievements/badges (e.g., "First to 10 provinces")
- [ ] Party alliances (coalition system)
- [ ] Notifications (province flipped, party ranking changed)

### Phase 3 (Future)
- [ ] Integration with real election poll data
- [ ] Embedded election news feed
- [ ] Share results on social media
- [ ] Mobile app version (React Native)
- [ ] Blockchain/NFT badges (optional)

---

## 7. Success Metrics

### KPIs
- **Players:** Target 100K+ active players by election day
- **Engagement:** Average session 10-15 minutes, daily active users (DAU)
- **Viral Coefficient:** Share rate / clicks per social media mention
- **Platform Stability:** 99%+ uptime, <500ms map update latency

### Analytics Tracking
- Total clicks per party
- Province flip history (which party controlled when)
- Player retention (day 1, day 7, election day)
- Geographic origin of clicks (optional GeoIP)

---

## 8. Technical Constraints & Considerations

### 8.1 Real-time Scalability (Supabase)
- **Expected Peak:** 50K+ concurrent users on election day
- **Solution:**
  - Supabase Realtime handles concurrent connections
  - Database Functions (PL/pgSQL) for atomic click operations
  - Upgrade to Supabase Pro/Team plan for higher limits
- **Database:**
  - Use `increment_click` function to batch-update JSONB click counts
  - Avoid individual INSERT per click - use UPDATE with JSONB operations

### 8.2 Latency & UX
- **Target:** Map updates via Supabase Realtime (typically <100ms latency)
- **Click Feedback:**
  - Instant visual feedback locally (optimistic UI)
  - Supabase Realtime broadcasts changes to all clients automatically

### 8.3 Cheating Prevention
- **Rate Limiting:**
  - Implement in Database Function (check last_click_timestamp)
  - Use Supabase Edge Functions for advanced rate limiting
  - Max 10 clicks/second per player
- **Row Level Security (RLS):** Prevent unauthorized data manipulation
- **Bot Detection:** Basic checks via Edge Functions (optional)

### 8.4 Data Persistence
- Supabase automatic daily backups (Pro plan)
- Point-in-time recovery available
- Final snapshot at game end (8 Feb 2026 23:59 ICT)
- Export data via Supabase dashboard or API

---

## 9. Project Timeline (Supabase - Accelerated)

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| Planning | Requirements + Design | 1 week | In Progress |
| Setup | Supabase project + Database schema | 2-3 days | Not Started |
| Frontend | UI + Map + Supabase integration | 2-3 weeks | Not Started |
| Database | Functions + RLS policies | 1 week | Not Started |
| Integration | End-to-end testing | 1 week | Not Started |
| QA/Launch | Testing + launch | 1 week | Not Started |
| **Deadline** | **Game Live** | **~6-7 weeks total** | **Target: Mid-Late Oct 2025** |

*Note: Using Supabase reduces development time significantly - no backend server to build/maintain.*

---

## 10. Budget Estimate (Supabase + Google Cloud)

### 10.1 Infrastructure Costs
| Component | Cost |
|-----------|------|
| Supabase Pro Plan (3 months) | $75/month × 3 = $225 |
| Supabase usage overage (estimated) | $200-500 |
| Google Cloud Hosting (Firebase Hosting) | Free - $25/month |
| Google Cloud CDN (if needed) | $0.02-0.08/GB |
| Domain + SSL | $15-30 |
| **Total Infrastructure** | **~$300-800** |

### 10.2 Development Costs
| Component | Cost |
|-----------|------|
| Frontend development | $5K-8K |
| Database functions + testing | $2K-4K |
| Ads integration + PDPA compliance | $500-1K |
| QA/Testing | $1K-2K |
| **Total Development** | **$8.5K-15K** |

### 10.3 Revenue Projection (Ad Revenue)
| Period | Est. DAU | Monthly Revenue |
|--------|----------|-----------------|
| Month 1 (Launch) | 1,000-5,000 | $15-150 |
| Month 2-3 | 5,000-20,000 | $75-600 |
| Election Month | 20,000-100,000 | $300-3,000 |
| **Total Est. Revenue** | - | **$500-5,000** |

*Break-even possible if game gains significant traction.*

**Supabase Pricing Tiers:**
- Free: 500MB database, 2GB bandwidth, 50K monthly active users
- Pro ($25/mo): 8GB database, 250GB bandwidth, unlimited users
- Team ($599/mo): For high-scale production (if needed on election day)

**Google Cloud Free Tier:**
- Firebase Hosting: 10GB storage, 360MB/day transfer (free)
- Beyond free tier: ~$0.026/GB storage, $0.15/GB transfer

---

## 11. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **High traffic spike on election day** | Service degradation | Upgrade to Supabase Team plan, optimize queries, CDN for static assets |
| **Supabase Realtime limits** | Missed updates | Monitor connection counts, implement reconnection logic |
| **Party color confusion** | Poor UX | Use official colors + patterns, clear legend |
| **Bot attacks** | Unfair advantage | Rate limiting in DB functions, RLS policies |
| **Database function performance** | Slow clicks | Optimize PL/pgSQL functions, use proper indexes |
| **Political sensitivity** | Backlash | Neutral messaging, no bias in UI, disclaimer |
| **Supabase outage** | Game unavailable | Monitor Supabase status, have communication plan |

---

## 12. Legal & Compliance

- **Election-Related Content:** Ensure compliance with Thai Election Commission rules (no voter coercion/interference)
- **Age Verification:** Optional parental consent for <18 players
- **Data Privacy:** PDPA compliance (if storing personal data)
- **Terms of Service:** Clear rules against botting, cheating, harassment
- **Disclaimer:** Game is for entertainment only, not affiliated with actual election

---

## Appendix: Party Color Reference

| # | Party Name (Thai) | Party Name (English) | Official Color | Ballot # 2026 |
|----|---|---|---|---|
| 1 | พรรคเพื่อไทย | Pheu Thai Party | Red #E31838 | 9 |
| 2 | พรรคประชาชน | People's Party | Orange #FF7A00 | 46 |
| 3 | พรรคภูมิใจไทย | Bhumjaithai Party | Blue #004E89 | 37 |
| 4 | พรรคประชาธิปัตย์ | Democrat Party | Light Blue #87CEEB | 27 |
| 5 | พรรคพลังประชารัฐ | Palang Pracharath | Dark Green #1B4D3E | 7 |
| 6 | พรรครวมไทยสร้างชาติ | United Thai Nation | Purple #663399 | 6 |
| 7 | พรรคไทยสร้างไทย | Thai Sang Thai | Burgundy #800020 | 48 |
| 8 | พรรคชาติไทยพัฒนา | Chart Thai Pattana | Teal #008080 | - |
| 9 | พรรคประชาชาติ | Prachachart Party | Navy #000080 | 33 |
| 10+ | *Other 47 parties* | *Use pattern fills* | *Varied* | *See party list* |

*Full party database to be provided separately with official EC data.*

---

**Document End**
**Next Steps:** Review with stakeholder → Lock scope → Begin Backend development
