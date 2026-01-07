# TodoList: RLS Policies & Seed Data (Module 2.3)

## Overview
- Module: 2-3-database-rls-seed
- User Stories: 4
- Total Tasks: 23
- Generated: 2026-01-07

---

## User Story: US-014 Row Level Security Policies
> As the system, I need RLS policies to secure data access while allowing necessary read/write operations

### Acceptance Criteria
- [x] RLS enabled on all tables (players, province_state, parties, provinces, game_state)
- [x] Public read access to parties, provinces, province_state, game_state
- [x] Players can only access their own data
- [x] Functions use SECURITY DEFINER to bypass RLS for writes
- [x] Anonymous users can read but not write directly

### Tasks
- [x] T077 P1 US-014 Enable RLS on all 5 tables [agent: multi-platform-apps:backend-architect] [deps: T023, T026, T029, T034, T039] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T078 P2 US-014 Create policy "Anyone can read parties" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T079 P2 US-014 Create policy "Anyone can read provinces" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T080 P2 US-014 Create policy "Anyone can read province_state" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T081 P2 US-014 Create policy "Anyone can read game_state" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T082 P2 US-014 Create policy "Players can read own data" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T083 P2 US-014 Create policy "Players can update own data" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T084 P2 US-014 Create policy "Anyone can read player stats" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T085 P3 US-014 Test anonymous user can read public tables [agent: full-stack-orchestration:test-automator] [deps: T078, T079, T080, T081] [files: tests/integration/rls.test.js]
- [x] T086 P3 US-014 Test anonymous user cannot write province_state directly [agent: full-stack-orchestration:test-automator] [deps: T080] [files: tests/integration/rls.test.js]
- [x] T087 P3 US-014 Test click_province function bypasses RLS [agent: full-stack-orchestration:test-automator] [deps: T043] [files: tests/integration/rls.test.js]

### Story Progress: 11/11

---

## User Story: US-015 Seed 57 Thai Political Parties
> As the system, I need all 57 Thai political parties seeded with official colors and ballot numbers

### Acceptance Criteria
- [x] All 57 parties from 2026 election inserted
- [x] Official colors in HEX format (#RRGGBB)
- [x] Ballot numbers match Election Commission data
- [x] Pattern types set (solid, striped, dotted, diagonal)
- [x] Leader names included where known

### Tasks
- [x] T088 P1 US-015 Insert 57 parties seed data [agent: multi-platform-apps:backend-architect] [deps: T023] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T089 P2 US-015 Verify all 57 parties exist with correct data [agent: full-stack-orchestration:test-automator] [deps: T088] [files: tests/integration/seed.test.js]

### Story Progress: 2/2

---

## User Story: US-016 Seed 77 Thai Provinces with Population
> As the system, I need all 77 Thai provinces seeded with population data for shield calculation

### Acceptance Criteria
- [x] All 77 provinces inserted with correct IDs (1-77)
- [x] Population data accurate for shield_max calculation
- [x] Region classification (Northern, Northeastern, Central, Southern, Eastern, Western)
- [x] Thai and English names included
- [x] Data matches Tech Spec Appendix D

### Tasks
- [x] T090 P1 US-016 Insert 77 provinces seed data with population [agent: multi-platform-apps:backend-architect] [deps: T026] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T091 P2 US-016 Verify all 77 provinces exist with population [agent: full-stack-orchestration:test-automator] [deps: T090] [files: tests/integration/seed.test.js]

### Story Progress: 2/2

---

## User Story: US-017 Initialize Game State and Province State
> As the system, I need to initialize province_state with 50% shields and game_state with default values

### Acceptance Criteria
- [x] All 77 provinces initialized in province_state table
- [x] shield_max = population / 10
- [x] shield_current = shield_max * 0.5 (50%)
- [x] attack_counts = {} (empty JSONB)
- [x] controlling_party_id = NULL (neutral)
- [x] game_state singleton row created with end date 2026-02-08 23:59:59+07

### Tasks
- [x] T092 P1 US-017 Initialize province_state from provinces table [agent: multi-platform-apps:backend-architect] [deps: T090] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T093 P1 US-017 Calculate shield_max from population / 10 [agent: multi-platform-apps:backend-architect] [deps: T092] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T094 P1 US-017 Set shield_current to 50% of shield_max [agent: multi-platform-apps:backend-architect] [deps: T092] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T095 P1 US-017 Initialize game_state singleton with end date [agent: multi-platform-apps:backend-architect] [deps: T039] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [x] T096 P2 US-017 Verify all 77 provinces have correct shield values [agent: full-stack-orchestration:test-automator] [deps: T094] [files: tests/integration/seed.test.js]
- [x] T097 P2 US-017 Verify shield_max = population / 10 for all provinces [agent: full-stack-orchestration:test-automator] [deps: T093] [files: tests/integration/seed.test.js]
- [x] T098 P2 US-017 Verify all provinces start with 50% shield [agent: full-stack-orchestration:test-automator] [deps: T094] [files: tests/integration/seed.test.js]
- [x] T099 P2 US-017 Verify game_state has correct end date [agent: full-stack-orchestration:test-automator] [deps: T095] [files: tests/integration/seed.test.js]

### Story Progress: 8/8

---

---

## Progress Summary
- Total Tasks: 23
- Completed: 23
- In Progress: 0
- Pending: 0

**Status: COMPLETE**

## Files Created
- `supabase/migrations/20260107000003_rls_seed.sql` - RLS policies, 57 parties, 77 provinces, province_state initialization
- `tests/integration/rls.test.js` - Tests for RLS policies (read/write access)
- `tests/integration/seed.test.js` - Tests for seed data verification

**Key Features Implemented:**
- RLS enabled on all 5 tables with public read access
- 57 Thai political parties with colors and patterns (solid/striped/dotted/diagonal)
- 77 Thai provinces with population data from Tech Spec Appendix D
- Province shields initialized at 50% (population / 10)
- Game state singleton with end date: 2026-02-08 23:59:59+07 (Bangkok time)
- Helper view `province_full_state` for easy querying

Last Updated: 2026-01-08
