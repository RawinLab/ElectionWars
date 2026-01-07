# TodoList: Authentication & Player Management (Module 3.1)

## Overview
- Module: 3-1-authentication
- User Stories: 5
- Total Tasks: 25
- Generated: 2026-01-07

---

## User Story: US-018 Anonymous Authentication
> As a player, I want to quickly join the game without creating an account using anonymous authentication

### Acceptance Criteria
- [x] Can create anonymous auth session via Supabase
- [x] Session persists in localStorage
- [x] Auto-login on page reload if session is valid
- [x] Session verification before game access

### Tasks
- [x] T100 P1 US-018 Create initAuth() function in src/lib/auth.js [agent: multi-platform-apps:backend-architect] [deps: T005] [files: src/lib/auth.js]
- [x] T101 P1 US-018 Implement createAnonymousSession() with Supabase [agent: multi-platform-apps:backend-architect] [deps: T100] [files: src/lib/auth.js]
- [x] T102 P2 US-018 Add session verification with getSession() [agent: multi-platform-apps:backend-architect] [deps: T101] [files: src/lib/auth.js]
- [x] T103 P2 US-018 Implement localStorage session storage [agent: multi-platform-apps:frontend-developer] [deps: T101] [files: src/lib/auth.js]
- [x] T104 P3 US-018 Test anonymous session creation [agent: full-stack-orchestration:test-automator] [deps: T101] [files: tests/integration/auth.test.js]
- [x] T105 P3 US-018 Test session persistence across page reloads [agent: full-stack-orchestration:test-automator] [deps: T103] [files: tests/e2e/auth.spec.js]

### Story Progress: 6/6

---

## User Story: US-019 Party Selection Screen
> As a new player, I want to see all 57 political parties and select one to represent

### Acceptance Criteria
- [x] Display all 57 parties in a grid layout
- [x] Show party colors, Thai/English names, and leader names
- [x] Highlight selected party
- [x] Responsive design for mobile and desktop
- [x] Parties load from Supabase

### Tasks
- [x] T106 P1 US-019 Create PartySelector.js component [agent: multi-platform-apps:frontend-developer] [deps: T018] [files: src/main.js (integrated)]
- [x] T107 P1 US-019 Fetch all parties from Supabase [agent: multi-platform-apps:frontend-developer] [deps: T106, T088] [files: src/main.js]
- [x] T108 P2 US-019 Create createPartyCard() function [agent: multi-platform-apps:frontend-developer] [deps: T106] [files: src/main.js]
- [x] T109 P2 US-019 Render party grid with official colors [agent: multi-platform-apps:frontend-developer] [deps: T107, T108] [files: src/main.js]
- [x] T110 P2 US-019 Implement party selection handler [agent: multi-platform-apps:frontend-developer] [deps: T109] [files: src/main.js]
- [x] T111 P3 US-019 Add CSS styling for party cards and grid [agent: multi-platform-apps:frontend-developer] [deps: T108] [files: src/styles/main.css]
- [x] T112 P3 US-019 Test party selector displays all 57 parties [agent: full-stack-orchestration:test-automator] [deps: T109] [files: tests/e2e/party-selector.spec.js]

### Story Progress: 7/7

---

## User Story: US-020 Nickname Validation
> As a player, I want to set a nickname with proper validation supporting Thai and English characters

### Acceptance Criteria
- [x] Nickname length 3-20 characters
- [x] Supports Thai characters (Unicode \u0E00-\u0E7F)
- [x] Supports English letters, numbers, underscore, space
- [x] Rejects special characters and emoji
- [x] Shows clear validation errors

### Tasks
- [x] T113 P1 US-020 Create validateNickname() function with regex [agent: multi-platform-apps:backend-architect] [deps: T100] [files: src/lib/auth.js]
- [x] T114 P1 US-020 Add NICKNAME_RULES constant [agent: multi-platform-apps:backend-architect] [deps: T113] [files: src/lib/auth.js]
- [x] T115 P2 US-020 Add real-time validation on nickname input [agent: multi-platform-apps:frontend-developer] [deps: T113] [files: src/main.js]
- [x] T116 P2 US-020 Display validation error messages [agent: multi-platform-apps:frontend-developer] [deps: T115] [files: src/main.js]
- [x] T117 P3 US-020 Test validates Thai characters [agent: full-stack-orchestration:test-automator] [deps: T113] [files: tests/unit/auth.test.js]
- [x] T118 P3 US-020 Test validates English characters [agent: full-stack-orchestration:test-automator] [deps: T113] [files: tests/unit/auth.test.js]
- [x] T119 P3 US-020 Test rejects invalid characters [agent: full-stack-orchestration:test-automator] [deps: T113] [files: tests/unit/auth.test.js]

### Story Progress: 7/7

---

## User Story: US-021 Player Registration (join_game)
> As a player, I want to join the game by selecting a party and setting my nickname

### Acceptance Criteria
- [x] Creates player record in database
- [x] Links to Supabase anonymous auth session
- [x] Stores player data in localStorage
- [x] Redirects to game screen after registration
- [x] Shows error if registration fails

### Tasks
- [x] T120 P1 US-021 Implement joinGame() function [agent: multi-platform-apps:backend-architect] [deps: T101, T113, T054] [files: src/lib/auth.js]
- [x] T121 P2 US-021 Call join_game RPC with auth_id, party_id, nickname [agent: multi-platform-apps:backend-architect] [deps: T120] [files: src/lib/auth.js]
- [x] T122 P2 US-021 Fetch player and party data after registration [agent: multi-platform-apps:backend-architect] [deps: T121] [files: src/lib/auth.js]
- [x] T123 P2 US-021 Store session in localStorage [agent: multi-platform-apps:frontend-developer] [deps: T122] [files: src/lib/auth.js]
- [x] T124 P2 US-021 Handle join button click event [agent: multi-platform-apps:frontend-developer] [deps: T110, T115] [files: src/main.js]
- [x] T125 P3 US-021 Test full join game flow [agent: full-stack-orchestration:test-automator] [deps: T123] [files: tests/e2e/join-game.spec.js]

### Story Progress: 6/6

---

## User Story: US-022 Party Change with Cooldown
> As a player, I want to switch to a different party with a 24hr cooldown and click reset

### Acceptance Criteria
- [x] Shows "Change Party" button in game UI
- [x] Enforces 24hr cooldown since last change
- [x] Displays cooldown timer with hours remaining
- [x] Resets player total_clicks to 0 on change
- [x] Confirms before changing party
- [x] Updates localStorage after change

### Tasks
- [x] T126 P1 US-022 Implement changeParty() function [agent: multi-platform-apps:backend-architect] [deps: T060, T103] [files: src/lib/auth.js]
- [x] T127 P2 US-022 Call change_party RPC [agent: multi-platform-apps:backend-architect] [deps: T126] [files: src/lib/auth.js]
- [x] T128 P2 US-022 Update localStorage with new party data [agent: multi-platform-apps:frontend-developer] [deps: T127] [files: src/lib/auth.js]
- [x] T129 P2 US-022 Create changePartyButton UI component [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/main.js]
- [x] T130 P2 US-022 Display cooldown timer if active [agent: multi-platform-apps:frontend-developer] [deps: T129] [files: src/main.js]
- [x] T131 P2 US-022 Add confirmation dialog before change [agent: multi-platform-apps:frontend-developer] [deps: T129] [files: src/main.js]
- [x] T132 P3 US-022 Test party change respects 24hr cooldown [agent: full-stack-orchestration:test-automator] [deps: T127] [files: tests/integration/party-change.test.js]
- [x] T133 P3 US-022 Test clicks reset to 0 after change [agent: full-stack-orchestration:test-automator] [deps: T127] [files: tests/integration/party-change.test.js]

### Story Progress: 8/8

---

## Execution Batches (Auto-Generated from Dependencies)

> These batches are used by `/execute` for parallel scheduling.

### Batch 0 - Depends on Module 1.1, 2.1-2.3 (T005, T054, T060, T088)
| Task | Story | Priority | Agent | Status | Files |
|------|-------|----------|-------|--------|-------|
| T100 | US-018 | P1 | backend-architect | ✅ | src/lib/auth.js |
| T113 | US-020 | P1 | backend-architect | ✅ | src/lib/auth.js |
| T114 | US-020 | P1 | backend-architect | ✅ | src/lib/auth.js |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Status | Files |
|------|-------|----------|-------|------|--------|-------|
| T101 | US-018 | P1 | backend-architect | T100 | Pending | src/lib/auth.js |
| T106 | US-019 | P1 | frontend-developer | T018 | Pending | src/components/PartySelector.js |
| T115 | US-020 | P2 | frontend-developer | T113 | Pending | src/components/PartySelector.js |
| T117 | US-020 | P3 | test-automator | T113 | ✅ | tests/unit/auth.test.js |
| T118 | US-020 | P3 | test-automator | T113 | ✅ | tests/unit/auth.test.js |
| T119 | US-020 | P3 | test-automator | T113 | ✅ | tests/unit/auth.test.js |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T102 | US-018 | P2 | backend-architect | T101 | src/lib/auth.js |
| T103 | US-018 | P2 | frontend-developer | T101 | src/lib/auth.js |
| T107 | US-019 | P1 | frontend-developer | T106, T088 | src/components/PartySelector.js |
| T108 | US-019 | P2 | frontend-developer | T106 | src/components/PartySelector.js |
| T116 | US-020 | P2 | frontend-developer | T115 | src/components/PartySelector.js |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T104 | US-018 | P3 | test-automator | T101 | tests/integration/auth.test.js |
| T105 | US-018 | P3 | test-automator | T103 | tests/e2e/auth.spec.js |
| T109 | US-019 | P2 | frontend-developer | T107, T108 | src/components/PartySelector.js |
| T111 | US-019 | P3 | frontend-developer | T108 | src/styles/main.css |
| T120 | US-021 | P1 | backend-architect | T101, T113, T054 | src/lib/auth.js |
| T126 | US-022 | P1 | backend-architect | T060, T103 | src/lib/auth.js |
| T129 | US-022 | P2 | frontend-developer | none | src/components/PartyChanger.js |

### Batch 4 - Depends on Batch 3
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T110 | US-019 | P2 | frontend-developer | T109 | src/components/PartySelector.js |
| T112 | US-019 | P3 | test-automator | T109 | tests/e2e/party-selector.spec.js |
| T121 | US-021 | P2 | backend-architect | T120 | src/lib/auth.js |
| T127 | US-022 | P2 | backend-architect | T126 | src/lib/auth.js |
| T130 | US-022 | P2 | frontend-developer | T129 | src/components/PartyChanger.js |
| T131 | US-022 | P2 | frontend-developer | T129 | src/components/PartyChanger.js |

### Batch 5 - Depends on Batch 4
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T122 | US-021 | P2 | backend-architect | T121 | src/lib/auth.js |
| T128 | US-022 | P2 | frontend-developer | T127 | src/lib/auth.js |
| T132 | US-022 | P3 | test-automator | T127 | tests/integration/party-change.test.js |
| T133 | US-022 | P3 | test-automator | T127 | tests/integration/party-change.test.js |

### Batch 6 - Depends on Batch 5
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T123 | US-021 | P2 | frontend-developer | T122 | src/lib/auth.js |
| T124 | US-021 | P2 | frontend-developer | T110, T115 | src/components/PartySelector.js |

### Batch 7 - Depends on Batch 6
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T125 | US-021 | P3 | test-automator | T123 | tests/e2e/join-game.spec.js |

---

## Progress Summary
- Total Tasks: 34
- Completed: 34
- In Progress: 0
- Pending: 0

**Status: COMPLETE**

## Files Created/Modified
- `src/lib/auth.js` - Complete auth module with anonymous auth, joinGame, changeParty, validateNickname
- `src/main.js` - Integrated party selector, nickname validation, join flow, game screen
- `src/styles/main.css` - Player info styling, party cards, responsive grid

**Key Features Implemented:**
- Anonymous authentication via Supabase
- Party selector with 57 parties (grid layout, responsive)
- Nickname validation (Thai/English, 3-20 chars)
- Join game flow with localStorage persistence
- Party change with 24hr cooldown and confirmation
- Player info display in game header

Last Updated: 2026-01-08
