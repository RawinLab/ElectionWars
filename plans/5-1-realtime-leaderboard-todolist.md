# TodoList: Real-time Sync & Leaderboard (Module 5.1)

## Overview
- Module: 5-1-realtime-leaderboard
- User Stories: 5
- Total Tasks: 20
- Generated: 2026-01-07

---

## User Story: US-028 Supabase Realtime Integration
> As a player, I want to see province changes in real-time as other players click

### Acceptance Criteria
- [ ] Subscribe to province_state table updates
- [ ] Subscribe to game_state table updates
- [ ] Handle connection status (connected/disconnected)
- [ ] Auto-reconnect on connection loss
- [ ] Emit events for province and game state changes

### Tasks
- [ ] T159 P1 US-028 Create RealtimeManager class [agent: multi-platform-apps:backend-architect] [deps: T005] [files: src/lib/realtime.js]
- [ ] T160 P1 US-028 Implement subscribe() for province_state channel [agent: multi-platform-apps:backend-architect] [deps: T159, T032] [files: src/lib/realtime.js]
- [ ] T161 P1 US-028 Implement subscribe() for game_state channel [agent: multi-platform-apps:backend-architect] [deps: T159, T040] [files: src/lib/realtime.js]
- [ ] T162 P2 US-028 Add connection status tracking [agent: multi-platform-apps:backend-architect] [deps: T160] [files: src/lib/realtime.js]
- [ ] T163 P2 US-028 Implement auto-reconnect logic [agent: multi-platform-apps:backend-architect] [deps: T162] [files: src/lib/realtime.js]
- [ ] T164 P2 US-028 Create event emitter for callbacks [agent: multi-platform-apps:backend-architect] [deps: T159] [files: src/lib/realtime.js]
- [ ] T165 P3 US-028 Test realtime updates trigger callbacks [agent: full-stack-orchestration:test-automator] [deps: T164] [files: tests/integration/realtime.test.js]

### Story Progress: 0/7

---

## User Story: US-029 Party Leaderboard
> As a player, I want to see which parties are winning by provinces controlled

### Acceptance Criteria
- [ ] Shows all parties ranked by provinces controlled
- [ ] Displays provinces controlled count and total clicks
- [ ] Updates in real-time as provinces change hands
- [ ] Shows party colors and Thai names
- [ ] Responsive design for mobile and desktop

### Tasks
- [ ] T166 P1 US-029 Create Leaderboard class component [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/components/Leaderboard.js]
- [ ] T167 P1 US-029 Implement fetch() using get_leaderboard RPC [agent: multi-platform-apps:backend-architect] [deps: T166, T067] [files: src/components/Leaderboard.js]
- [ ] T168 P2 US-029 Create render() with party rankings table [agent: multi-platform-apps:frontend-developer] [deps: T167] [files: src/components/Leaderboard.js]
- [ ] T169 P2 US-029 Add formatNumber() helper for K/M formatting [agent: multi-platform-apps:frontend-developer] [deps: T166] [files: src/components/Leaderboard.js]
- [ ] T170 P2 US-029 Connect to realtime updates for auto-refresh [agent: multi-platform-apps:backend-architect] [deps: T168, T161] [files: src/components/Leaderboard.js]
- [ ] T171 P2 US-029 Add CSS styling for leaderboard table [agent: multi-platform-apps:frontend-developer] [deps: T168] [files: src/styles/components.css]
- [ ] T172 P3 US-029 Test leaderboard displays correct rankings [agent: full-stack-orchestration:test-automator] [deps: T168] [files: tests/e2e/leaderboard.spec.js]

### Story Progress: 0/7

---

## User Story: US-030 Game Countdown Timer
> As a player, I want to see how much time is left until the game ends (Feb 8, 2026)

### Acceptance Criteria
- [ ] Displays countdown in days, hours, minutes, seconds
- [ ] Updates every second
- [ ] Shows "Game Ended" when time expires
- [ ] Uses Bangkok timezone (UTC+7)
- [ ] Responsive design

### Tasks
- [ ] T173 P1 US-030 Create GameTimer class component [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/components/Timer.js]
- [ ] T174 P2 US-030 Implement countdown calculation logic [agent: multi-platform-apps:frontend-developer] [deps: T173] [files: src/components/Timer.js]
- [ ] T175 P2 US-030 Update timer display every second [agent: multi-platform-apps:frontend-developer] [deps: T174] [files: src/components/Timer.js]
- [ ] T176 P2 US-030 Show "Game Ended" when expired [agent: multi-platform-apps:frontend-developer] [deps: T174] [files: src/components/Timer.js]
- [ ] T177 P3 US-030 Add CSS styling for timer display [agent: multi-platform-apps:frontend-developer] [deps: T173] [files: src/styles/components.css]

### Story Progress: 0/5

---

## User Story: US-031 Global Game Statistics
> As a player, I want to see total clicks and total players in the game

### Acceptance Criteria
- [ ] Displays total clicks counter
- [ ] Displays total players counter
- [ ] Updates in real-time from game_state table
- [ ] Formatted with K/M suffixes for large numbers
- [ ] Animated counter increments

### Tasks
- [ ] T178 P2 US-031 Create GlobalStats component [agent: multi-platform-apps:frontend-developer] [deps: T095] [files: src/components/GlobalStats.js]
- [ ] T179 P2 US-031 Fetch game_state data [agent: multi-platform-apps:backend-architect] [deps: T178] [files: src/components/GlobalStats.js]
- [ ] T180 P2 US-031 Subscribe to game_state realtime updates [agent: multi-platform-apps:backend-architect] [deps: T179, T161] [files: src/components/GlobalStats.js]
- [ ] T181 P3 US-031 Add animated counter effect [agent: multi-platform-apps:frontend-developer] [deps: T180] [files: src/components/GlobalStats.js]

### Story Progress: 0/4

---

## User Story: US-032 Connection Status Indicator
> As a player, I want to know if I'm connected to the real-time server

### Acceptance Criteria
- [ ] Shows green dot when connected
- [ ] Shows red dot when disconnected
- [ ] Shows "Reconnecting..." message during reconnection
- [ ] Auto-hides when connection is stable
- [ ] Positioned in corner of screen

### Tasks
- [ ] T182 P2 US-032 Create ConnectionStatus component [agent: multi-platform-apps:frontend-developer] [deps: T162] [files: src/components/ConnectionStatus.js]
- [ ] T183 P2 US-032 Listen to connection status from RealtimeManager [agent: multi-platform-apps:backend-architect] [deps: T182, T162] [files: src/components/ConnectionStatus.js]
- [ ] T184 P3 US-032 Add CSS for connection indicator [agent: multi-platform-apps:frontend-developer] [deps: T182] [files: src/styles/components.css]

### Story Progress: 0/3

---

## Execution Batches (Auto-Generated from Dependencies)

### Batch 0 - Depends on Module 1.1, 2.2, 2.3 (T005, T032, T040, T067, T095)
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T159 | US-028 | P1 | backend-architect | T005 | src/lib/realtime.js |
| T166 | US-029 | P1 | frontend-developer | none | src/components/Leaderboard.js |
| T173 | US-030 | P1 | frontend-developer | none | src/components/Timer.js |
| T178 | US-031 | P2 | frontend-developer | T095 | src/components/GlobalStats.js |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T160 | US-028 | P1 | backend-architect | T159, T032 | src/lib/realtime.js |
| T161 | US-028 | P1 | backend-architect | T159, T040 | src/lib/realtime.js |
| T164 | US-028 | P2 | backend-architect | T159 | src/lib/realtime.js |
| T167 | US-029 | P1 | backend-architect | T166, T067 | src/components/Leaderboard.js |
| T169 | US-029 | P2 | frontend-developer | T166 | src/components/Leaderboard.js |
| T174 | US-030 | P2 | frontend-developer | T173 | src/components/Timer.js |
| T177 | US-030 | P3 | frontend-developer | T173 | src/styles/components.css |
| T179 | US-031 | P2 | backend-architect | T178 | src/components/GlobalStats.js |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T162 | US-028 | P2 | backend-architect | T160 | src/lib/realtime.js |
| T165 | US-028 | P3 | test-automator | T164 | tests/integration/realtime.test.js |
| T168 | US-029 | P2 | frontend-developer | T167 | src/components/Leaderboard.js |
| T175 | US-030 | P2 | frontend-developer | T174 | src/components/Timer.js |
| T176 | US-030 | P2 | frontend-developer | T174 | src/components/Timer.js |
| T180 | US-031 | P2 | backend-architect | T179, T161 | src/components/GlobalStats.js |
| T182 | US-032 | P2 | frontend-developer | T162 | src/components/ConnectionStatus.js |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T163 | US-028 | P2 | backend-architect | T162 | src/lib/realtime.js |
| T170 | US-029 | P2 | backend-architect | T168, T161 | src/components/Leaderboard.js |
| T171 | US-029 | P2 | frontend-developer | T168 | src/styles/components.css |
| T172 | US-029 | P3 | test-automator | T168 | tests/e2e/leaderboard.spec.js |
| T181 | US-031 | P3 | frontend-developer | T180 | src/components/GlobalStats.js |
| T183 | US-032 | P2 | backend-architect | T182, T162 | src/components/ConnectionStatus.js |

### Batch 4 - Depends on Batch 3
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T184 | US-032 | P3 | frontend-developer | T182 | src/styles/components.css |

---

## Progress Summary
- Total Tasks: 26
- Completed: 0
- In Progress: 0
- Pending: 26

**Status: Ready to Start**

**Key Features:**
- Real-time province and game state synchronization
- Auto-updating party leaderboard
- Game countdown timer (ends Feb 8, 2026 23:59 ICT)
- Live global statistics (total clicks, total players)
- Connection status with auto-reconnect

Last Updated: 2026-01-07
