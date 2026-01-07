# TodoList: Database Functions - Shield System (Module 2.2)

## Overview
- Module: 2-2-database-functions
- User Stories: 5
- Total Tasks: 34
- Generated: 2026-01-07

---

## User Story: US-009 Click Province Function (Shield System)
> As a player, I want to click provinces to defend my party's territory or attack opponents with a shield-based mechanic

### Acceptance Criteria
- [x] Defend: Clicking own party's province adds +1 shield (max = shield_max)
- [x] Attack: Clicking opponent's province reduces -1 shield
- [x] Capture: When shield reaches 0, highest attacker takes control with 5% shield
- [x] Rate limiting: 100ms cooldown between clicks per player
- [x] Returns action type (defend/attack/capture) and current state

### Tasks
- [x] T043 P1 US-009 Create click_province() function with rate limiting [agent: multi-platform-apps:backend-architect] [deps: T029] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T044 P1 US-009 Implement defend logic (same party, add shield) [agent: multi-platform-apps:backend-architect] [deps: T043] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T045 P1 US-009 Implement attack logic (different party, reduce shield) [agent: multi-platform-apps:backend-architect] [deps: T043] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T046 P1 US-009 Implement capture logic (shield=0, highest attacker wins) [agent: multi-platform-apps:backend-architect] [deps: T043] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T047 P2 US-009 Update player stats (total_clicks, last_click_at) [agent: multi-platform-apps:backend-architect] [deps: T043] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T048 P2 US-009 Update game_state total_clicks counter [agent: multi-platform-apps:backend-architect] [deps: T043] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T049 P3 US-009 Test defend action adds +1 shield [agent: full-stack-orchestration:test-automator] [deps: T044] [files: tests/integration/click.test.js]
- [x] T050 P3 US-009 Test attack action reduces -1 shield [agent: full-stack-orchestration:test-automator] [deps: T045] [files: tests/integration/click.test.js]
- [x] T051 P3 US-009 Test capture when shield reaches 0 [agent: full-stack-orchestration:test-automator] [deps: T046] [files: tests/integration/click.test.js]
- [x] T052 P3 US-009 Test rate limiting (100ms cooldown) [agent: full-stack-orchestration:test-automator] [deps: T043] [files: tests/integration/click.test.js]
- [x] T053 P3 US-009 Test highest attacker wins on capture [agent: full-stack-orchestration:test-automator] [deps: T046] [files: tests/integration/click.test.js]

### Story Progress: 11/11

---

## User Story: US-010 Join Game Function
> As a new player, I want to register for the game by selecting a party and setting my nickname

### Acceptance Criteria
- [x] Creates new player record with UUID, auth_id, party_id, nickname
- [x] Returns existing player if auth_id already exists
- [x] Validates party_id references valid party
- [x] Initializes player stats (total_clicks=0)

### Tasks
- [x] T054 P1 US-010 Create join_game() function [agent: multi-platform-apps:backend-architect] [deps: T034] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T055 P2 US-010 Check if player exists by auth_id [agent: multi-platform-apps:backend-architect] [deps: T054] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T056 P2 US-010 Create new player if not exists [agent: multi-platform-apps:backend-architect] [deps: T054] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T057 P2 US-010 Increment game_state total_players counter [agent: multi-platform-apps:backend-architect] [deps: T054] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T058 P3 US-010 Test creates new player correctly [agent: full-stack-orchestration:test-automator] [deps: T056] [files: tests/integration/auth.test.js]
- [x] T059 P3 US-010 Test returns existing player [agent: full-stack-orchestration:test-automator] [deps: T055] [files: tests/integration/auth.test.js]

### Story Progress: 6/6

---

## User Story: US-011 Change Party Function
> As a player, I want to switch to a different party with a 24hr cooldown and click reset

### Acceptance Criteria
- [x] Enforces 24hr cooldown since last party change
- [x] Resets player's total_clicks to 0
- [x] Updates party_id and party_changed_at timestamp
- [x] Returns error if cooldown is active (with hours remaining)
- [x] Returns error if trying to change to same party

### Tasks
- [x] T060 P1 US-011 Create change_party() function [agent: multi-platform-apps:backend-architect] [deps: T034] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T061 P2 US-011 Check if same party (return error) [agent: multi-platform-apps:backend-architect] [deps: T060] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T062 P2 US-011 Check 24hr cooldown (return error with hours remaining) [agent: multi-platform-apps:backend-architect] [deps: T060] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T063 P2 US-011 Update party_id, reset total_clicks, set party_changed_at [agent: multi-platform-apps:backend-architect] [deps: T060] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T064 P3 US-011 Test 24hr cooldown enforced [agent: full-stack-orchestration:test-automator] [deps: T062] [files: tests/integration/auth.test.js]
- [x] T065 P3 US-011 Test clicks reset to 0 [agent: full-stack-orchestration:test-automator] [deps: T063] [files: tests/integration/auth.test.js]
- [x] T066 P3 US-011 Test same party error [agent: full-stack-orchestration:test-automator] [deps: T061] [files: tests/integration/auth.test.js]

### Story Progress: 7/7

---

## User Story: US-012 Get Leaderboard Function
> As a player, I want to see party rankings sorted by provinces controlled

### Acceptance Criteria
- [x] Returns all parties with rank, party info, provinces controlled, total clicks
- [x] Sorted by provinces_controlled DESC, then by total_clicks DESC
- [x] Includes party name (Thai) and official color for UI display
- [x] Calculates provinces controlled from province_state table

### Tasks
- [x] T067 P1 US-012 Create get_leaderboard() function [agent: multi-platform-apps:backend-architect] [deps: T029, T023] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T068 P2 US-012 Join parties with province_state to count controlled provinces [agent: multi-platform-apps:backend-architect] [deps: T067] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T069 P2 US-012 Calculate total clicks per party from players table [agent: multi-platform-apps:backend-architect] [deps: T067] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T070 P2 US-012 Sort by provinces_controlled DESC, total_clicks DESC [agent: multi-platform-apps:backend-architect] [deps: T067] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T071 P3 US-012 Test returns correct ranking [agent: full-stack-orchestration:test-automator] [deps: T070] [files: tests/integration/leaderboard.test.js]

### Story Progress: 5/5

---

## User Story: US-013 Initialize Province Shields Function
> As the system admin, I need to initialize all provinces with 50% shield at game start

### Acceptance Criteria
- [x] Sets shield_max = population / 10 for all provinces
- [x] Sets shield_current = shield_max * 0.5 (50%)
- [x] Resets attack_counts to empty object {}
- [x] Sets controlling_party_id to NULL (neutral)
- [x] Idempotent (can be run multiple times safely)

### Tasks
- [x] T072 P1 US-013 Create init_province_shields() function [agent: multi-platform-apps:backend-architect] [deps: T029, T026] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T073 P2 US-013 Calculate shield_max from population / 10 [agent: multi-platform-apps:backend-architect] [deps: T072] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T074 P2 US-013 Set shield_current to 50% of shield_max [agent: multi-platform-apps:backend-architect] [deps: T072] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T075 P2 US-013 Reset attack_counts and controlling_party_id [agent: multi-platform-apps:backend-architect] [deps: T072] [files: supabase/migrations/20260107000002_create_functions.sql]
- [x] T076 P3 US-013 Test initialization sets correct values [agent: full-stack-orchestration:test-automator] [deps: T075] [files: tests/integration/database.test.js]

### Story Progress: 5/5

---

## Progress Summary
- Total Tasks: 34
- Completed: 34
- In Progress: 0
- Pending: 0

**Status: COMPLETE**

## Files Created
- `supabase/migrations/20260107000002_create_functions.sql` - All 5 database functions with SECURITY DEFINER
- `tests/integration/click.test.js` - Tests for click_province() shield mechanics
- `tests/integration/auth.test.js` - Tests for join_game() and change_party()
- `tests/integration/leaderboard.test.js` - Tests for get_leaderboard()

**Key Features Implemented:**
- Shield-based province control system (defend/attack/capture)
- Rate limiting (100ms) to prevent spam
- 24hr party change cooldown with click reset
- Real-time leaderboard rankings
- Game initialization with 50% shields

Last Updated: 2026-01-08
