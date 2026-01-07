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
- [ ] RLS enabled on all tables (players, province_state, parties, provinces, game_state)
- [ ] Public read access to parties, provinces, province_state, game_state
- [ ] Players can only access their own data
- [ ] Functions use SECURITY DEFINER to bypass RLS for writes
- [ ] Anonymous users can read but not write directly

### Tasks
- [ ] T077 P1 US-014 Enable RLS on all 5 tables [agent: multi-platform-apps:backend-architect] [deps: T023, T026, T029, T034, T039] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T078 P2 US-014 Create policy "Anyone can read parties" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T079 P2 US-014 Create policy "Anyone can read provinces" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T080 P2 US-014 Create policy "Anyone can read province_state" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T081 P2 US-014 Create policy "Anyone can read game_state" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T082 P2 US-014 Create policy "Players can read own data" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T083 P2 US-014 Create policy "Players can update own data" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T084 P2 US-014 Create policy "Anyone can read player stats" [agent: multi-platform-apps:backend-architect] [deps: T077] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T085 P3 US-014 Test anonymous user can read public tables [agent: full-stack-orchestration:test-automator] [deps: T078, T079, T080, T081] [files: tests/integration/rls.test.js]
- [ ] T086 P3 US-014 Test anonymous user cannot write province_state directly [agent: full-stack-orchestration:test-automator] [deps: T080] [files: tests/integration/rls.test.js]
- [ ] T087 P3 US-014 Test click_province function bypasses RLS [agent: full-stack-orchestration:test-automator] [deps: T043] [files: tests/integration/rls.test.js]

### Story Progress: 0/11

---

## User Story: US-015 Seed 57 Thai Political Parties
> As the system, I need all 57 Thai political parties seeded with official colors and ballot numbers

### Acceptance Criteria
- [ ] All 57 parties from 2026 election inserted
- [ ] Official colors in HEX format (#RRGGBB)
- [ ] Ballot numbers match Election Commission data
- [ ] Pattern types set (solid, striped, dotted, diagonal)
- [ ] Leader names included where known

### Tasks
- [ ] T088 P1 US-015 Insert 57 parties seed data [agent: multi-platform-apps:backend-architect] [deps: T023] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T089 P2 US-015 Verify all 57 parties exist with correct data [agent: full-stack-orchestration:test-automator] [deps: T088] [files: tests/integration/seed.test.js]

### Story Progress: 0/2

---

## User Story: US-016 Seed 77 Thai Provinces with Population
> As the system, I need all 77 Thai provinces seeded with population data for shield calculation

### Acceptance Criteria
- [ ] All 77 provinces inserted with correct IDs (1-77)
- [ ] Population data accurate for shield_max calculation
- [ ] Region classification (Northern, Northeastern, Central, Southern, Eastern, Western)
- [ ] Thai and English names included
- [ ] Data matches Tech Spec Appendix D

### Tasks
- [ ] T090 P1 US-016 Insert 77 provinces seed data with population [agent: multi-platform-apps:backend-architect] [deps: T026] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T091 P2 US-016 Verify all 77 provinces exist with population [agent: full-stack-orchestration:test-automator] [deps: T090] [files: tests/integration/seed.test.js]

### Story Progress: 0/2

---

## User Story: US-017 Initialize Game State and Province State
> As the system, I need to initialize province_state with 50% shields and game_state with default values

### Acceptance Criteria
- [ ] All 77 provinces initialized in province_state table
- [ ] shield_max = population / 10
- [ ] shield_current = shield_max * 0.5 (50%)
- [ ] attack_counts = {} (empty JSONB)
- [ ] controlling_party_id = NULL (neutral)
- [ ] game_state singleton row created with end date 2026-02-08 23:59:59+07

### Tasks
- [ ] T092 P1 US-017 Initialize province_state from provinces table [agent: multi-platform-apps:backend-architect] [deps: T090] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T093 P1 US-017 Calculate shield_max from population / 10 [agent: multi-platform-apps:backend-architect] [deps: T092] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T094 P1 US-017 Set shield_current to 50% of shield_max [agent: multi-platform-apps:backend-architect] [deps: T092] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T095 P1 US-017 Initialize game_state singleton with end date [agent: multi-platform-apps:backend-architect] [deps: T039] [files: supabase/migrations/20260107000003_rls_seed.sql]
- [ ] T096 P2 US-017 Verify all 77 provinces have correct shield values [agent: full-stack-orchestration:test-automator] [deps: T094] [files: tests/integration/seed.test.js]
- [ ] T097 P2 US-017 Verify shield_max = population / 10 for all provinces [agent: full-stack-orchestration:test-automator] [deps: T093] [files: tests/integration/seed.test.js]
- [ ] T098 P2 US-017 Verify all provinces start with 50% shield [agent: full-stack-orchestration:test-automator] [deps: T094] [files: tests/integration/seed.test.js]
- [ ] T099 P2 US-017 Verify game_state has correct end date [agent: full-stack-orchestration:test-automator] [deps: T095] [files: tests/integration/seed.test.js]

### Story Progress: 0/8

---

## Execution Batches (Auto-Generated from Dependencies)

> These batches are used by `/execute` for parallel scheduling.

### Batch 0 - Depends on Module 2.1, 2.2 (T023, T026, T029, T034, T039, T043)
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T077 | US-014 | P1 | backend-architect | T023, T026, T029, T034, T039 | 20260107000003_rls_seed.sql |
| T088 | US-015 | P1 | backend-architect | T023 | 20260107000003_rls_seed.sql |
| T090 | US-016 | P1 | backend-architect | T026 | 20260107000003_rls_seed.sql |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T078 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T079 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T080 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T081 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T082 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T083 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T084 | US-014 | P2 | backend-architect | T077 | 20260107000003_rls_seed.sql |
| T089 | US-015 | P2 | test-automator | T088 | tests/integration/seed.test.js |
| T091 | US-016 | P2 | test-automator | T090 | tests/integration/seed.test.js |
| T092 | US-017 | P1 | backend-architect | T090 | 20260107000003_rls_seed.sql |
| T095 | US-017 | P1 | backend-architect | T039 | 20260107000003_rls_seed.sql |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T085 | US-014 | P3 | test-automator | T078, T079, T080, T081 | tests/integration/rls.test.js |
| T086 | US-014 | P3 | test-automator | T080 | tests/integration/rls.test.js |
| T087 | US-014 | P3 | test-automator | T043 | tests/integration/rls.test.js |
| T093 | US-017 | P1 | backend-architect | T092 | 20260107000003_rls_seed.sql |
| T094 | US-017 | P1 | backend-architect | T092 | 20260107000003_rls_seed.sql |
| T099 | US-017 | P2 | test-automator | T095 | tests/integration/seed.test.js |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T096 | US-017 | P2 | test-automator | T094 | tests/integration/seed.test.js |
| T097 | US-017 | P2 | test-automator | T093 | tests/integration/seed.test.js |
| T098 | US-017 | P2 | test-automator | T094 | tests/integration/seed.test.js |

---

## Progress Summary
- Total Tasks: 23
- Completed: 0
- In Progress: 0
- Pending: 23

**Status: Ready to Start**

Dependencies: Module 2.1 (Database Tables) and 2.2 (Database Functions) must be completed first.

**Key Data:**
- 57 Thai political parties (full seed data in Tech Spec)
- 77 Thai provinces with population (full seed data in Tech Spec Appendix D)
- Province shields initialized at 50% of shield_max (population / 10)
- Game end date: 2026-02-08 23:59:59+07 (Bangkok time)

Last Updated: 2026-01-07
