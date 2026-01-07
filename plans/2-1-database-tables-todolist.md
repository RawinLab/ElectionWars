# TodoList: Database Core Tables (Module 2.1)

## Overview
- Module: 2-1-database-tables
- User Stories: 5
- Total Tasks: 15
- Generated: 2026-01-07

---

## User Story: US-004 Parties Table
> As the system, I need a parties table to store 57 Thai political parties with official colors and patterns

### Acceptance Criteria
- [ ] Table supports 57 parties with unique ballot numbers
- [ ] Official colors stored in HEX format (#RRGGBB)
- [ ] Pattern types supported (solid, striped, dotted, diagonal)
- [ ] Indexes created for performance

### Tasks
- [ ] T023 P1 US-004 Create parties table with all fields [agent: multi-platform-apps:backend-architect] [deps: none] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T024 P2 US-004 Create index on ballot_number [agent: multi-platform-apps:backend-architect] [deps: T023] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T025 P3 US-004 Test INSERT party records [agent: full-stack-orchestration:test-automator] [deps: T023] [files: tests/integration/database.test.js]

### Story Progress: 0/3

---

## User Story: US-005 Provinces Table
> As the system, I need a provinces table to store 77 Thai provinces with population data for shield calculation

### Acceptance Criteria
- [ ] Table supports all 77 provinces (IDs 1-77)
- [ ] Population field for shield calculation (shield_max = population / 10)
- [ ] Region field for geographical grouping
- [ ] SVG path field for map rendering
- [ ] Indexes created for queries by region

### Tasks
- [ ] T026 P1 US-005 Create provinces table with all fields [agent: multi-platform-apps:backend-architect] [deps: none] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T027 P2 US-005 Create index on region [agent: multi-platform-apps:backend-architect] [deps: T026] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T028 P3 US-005 Test INSERT province records [agent: full-stack-orchestration:test-automator] [deps: T026] [files: tests/integration/database.test.js]

### Story Progress: 0/3

---

## User Story: US-006 Province State Table (Realtime)
> As a player, I need to see real-time province control changes during gameplay

### Acceptance Criteria
- [ ] Table tracks current shield values and controlling party
- [ ] Shield system fields: shield_current, shield_max, attack_counts (JSONB)
- [ ] Realtime enabled for instant updates
- [ ] Foreign key references to provinces and parties
- [ ] Indexes for performance (controlling_party_id, shield_current)

### Tasks
- [ ] T029 P1 US-006 Create province_state table with shield system [agent: multi-platform-apps:backend-architect] [deps: T023, T026] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T030 P2 US-006 Create index on controlling_party_id [agent: multi-platform-apps:backend-architect] [deps: T029] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T031 P2 US-006 Create index on shield_current [agent: multi-platform-apps:backend-architect] [deps: T029] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T032 P1 US-006 Enable Realtime for province_state table [agent: multi-platform-apps:backend-architect] [deps: T029] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T033 P3 US-006 Test Realtime subscription receives updates [agent: full-stack-orchestration:test-automator] [deps: T032] [files: tests/integration/realtime.test.js]

### Story Progress: 0/5

---

## User Story: US-007 Players Table
> As a player, I need my profile stored with party affiliation and click statistics

### Acceptance Criteria
- [ ] Table stores player profiles with UUID primary key
- [ ] Links to Supabase auth.users via auth_id
- [ ] Tracks party affiliation with 24hr change cooldown
- [ ] Stores total clicks and last active timestamp
- [ ] Indexes for performance (party_id, total_clicks DESC, auth_id)

### Tasks
- [ ] T034 P1 US-007 Create players table with all fields [agent: multi-platform-apps:backend-architect] [deps: T023] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T035 P2 US-007 Create index on party_id [agent: multi-platform-apps:backend-architect] [deps: T034] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T036 P2 US-007 Create index on total_clicks DESC [agent: multi-platform-apps:backend-architect] [deps: T034] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T037 P2 US-007 Create index on auth_id [agent: multi-platform-apps:backend-architect] [deps: T034] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T038 P3 US-007 Test player INSERT and foreign key constraints [agent: full-stack-orchestration:test-automator] [deps: T034] [files: tests/integration/database.test.js]

### Story Progress: 0/5

---

## User Story: US-008 Game State Table (Singleton)
> As the system, I need a singleton game state table to track global statistics

### Acceptance Criteria
- [ ] Singleton table (only one row with id=1)
- [ ] Tracks total clicks and total players
- [ ] Game status (active/ended) and end time
- [ ] Realtime enabled for live global stats
- [ ] CHECK constraint enforces singleton pattern

### Tasks
- [ ] T039 P1 US-008 Create game_state singleton table [agent: multi-platform-apps:backend-architect] [deps: none] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T040 P1 US-008 Enable Realtime for game_state table [agent: multi-platform-apps:backend-architect] [deps: T039] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T041 P2 US-008 Initialize game_state with default row [agent: multi-platform-apps:backend-architect] [deps: T039] [files: supabase/migrations/20260107000001_create_tables.sql]
- [ ] T042 P3 US-008 Test singleton constraint (only 1 row allowed) [agent: full-stack-orchestration:test-automator] [deps: T039] [files: tests/integration/database.test.js]

### Story Progress: 0/4

---

## Execution Batches (Auto-Generated from Dependencies)

> These batches are used by `/execute` for parallel scheduling.

### Batch 0 - No Dependencies (Start Immediately)
| Task | Story | Priority | Agent | Files |
|------|-------|----------|-------|-------|
| T023 | US-004 | P1 | backend-architect | 20260107000001_create_tables.sql |
| T026 | US-005 | P1 | backend-architect | 20260107000001_create_tables.sql |
| T039 | US-008 | P1 | backend-architect | 20260107000001_create_tables.sql |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T024 | US-004 | P2 | backend-architect | T023 | 20260107000001_create_tables.sql |
| T025 | US-004 | P3 | test-automator | T023 | tests/integration/database.test.js |
| T027 | US-005 | P2 | backend-architect | T026 | 20260107000001_create_tables.sql |
| T028 | US-005 | P3 | test-automator | T026 | tests/integration/database.test.js |
| T029 | US-006 | P1 | backend-architect | T023, T026 | 20260107000001_create_tables.sql |
| T034 | US-007 | P1 | backend-architect | T023 | 20260107000001_create_tables.sql |
| T040 | US-008 | P1 | backend-architect | T039 | 20260107000001_create_tables.sql |
| T041 | US-008 | P2 | backend-architect | T039 | 20260107000001_create_tables.sql |
| T042 | US-008 | P3 | test-automator | T039 | tests/integration/database.test.js |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T030 | US-006 | P2 | backend-architect | T029 | 20260107000001_create_tables.sql |
| T031 | US-006 | P2 | backend-architect | T029 | 20260107000001_create_tables.sql |
| T032 | US-006 | P1 | backend-architect | T029 | 20260107000001_create_tables.sql |
| T035 | US-007 | P2 | backend-architect | T034 | 20260107000001_create_tables.sql |
| T036 | US-007 | P2 | backend-architect | T034 | 20260107000001_create_tables.sql |
| T037 | US-007 | P2 | backend-architect | T034 | 20260107000001_create_tables.sql |
| T038 | US-007 | P3 | test-automator | T034 | tests/integration/database.test.js |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T033 | US-006 | P3 | test-automator | T032 | tests/integration/realtime.test.js |

---

## Progress Summary
- Total Tasks: 20
- Completed: 0
- In Progress: 0
- Pending: 20

**Status: Ready to Start**

Dependencies: Module 1.1 (Project Setup) must be completed first. All tasks will create or modify the migration file `supabase/migrations/20260107000001_create_tables.sql`.

Last Updated: 2026-01-07
