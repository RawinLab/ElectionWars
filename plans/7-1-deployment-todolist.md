# TodoList: Testing & Firebase Deployment (Module 7.1)

## Overview
- Module: 7-1-deployment
- User Stories: 5
- Total Tasks: 23
- Generated: 2026-01-07

---

## User Story: US-037 Unit Tests with Vitest
> As a developer, I need comprehensive unit tests for all components and utilities

### Acceptance Criteria
- [ ] All utility functions have unit tests
- [ ] Test coverage > 80% for critical code
- [ ] Tests run in CI/CD pipeline
- [ ] Mocks for Supabase client
- [ ] Fast test execution (< 10s)

### Tasks
- [x] T209 P1 US-037 Create vitest.config.js configuration [agent: full-stack-orchestration:test-automator] [deps: none] [files: vitest.config.js]
- [x] T210 P1 US-037 Create tests/setup.js with mocks [agent: full-stack-orchestration:test-automator] [deps: T209] [files: tests/setup.js]
- [x] T211 P2 US-037 Write unit tests for auth.js (validateNickname) [agent: full-stack-orchestration:test-automator] [deps: T210] [files: tests/unit/auth.test.js]
- [ ] T212 P2 US-037 Write unit tests for i18n.js [agent: full-stack-orchestration:test-automator] [deps: T210, T196] [files: tests/unit/i18n.test.js]
- [ ] T213 P2 US-037 Write unit tests for Toast.js [agent: full-stack-orchestration:test-automator] [deps: T210, T186] [files: tests/unit/toast.test.js]
- [ ] T214 P2 US-037 Write unit tests for Timer.js [agent: full-stack-orchestration:test-automator] [deps: T210, T174] [files: tests/unit/timer.test.js]
- [ ] T215 P3 US-037 Run coverage report and verify > 80% [agent: full-stack-orchestration:test-automator] [deps: T211, T212, T213, T214] [files: coverage/]

### Story Progress: 3/7

---

## User Story: US-038 Integration Tests for Supabase
> As a developer, I need integration tests for database functions and realtime

### Acceptance Criteria
- [ ] Test click_province function with real database
- [ ] Test join_game function
- [ ] Test get_leaderboard function
- [ ] Test realtime subscriptions
- [ ] Tests use Supabase local environment or test instance

### Tasks
- [ ] T216 P1 US-038 Create Supabase test client configuration [agent: full-stack-orchestration:test-automator] [deps: T005] [files: tests/integration/setup.js]
- [ ] T217 P2 US-038 Write integration test for click_province RPC [agent: full-stack-orchestration:test-automator] [deps: T216, T043] [files: tests/integration/click-province.test.js]
- [ ] T218 P2 US-038 Write integration test for join_game RPC [agent: full-stack-orchestration:test-automator] [deps: T216, T054] [files: tests/integration/join-game.test.js]
- [ ] T219 P2 US-038 Write integration test for get_leaderboard RPC [agent: full-stack-orchestration:test-automator] [deps: T216, T067] [files: tests/integration/leaderboard.test.js]
- [ ] T220 P2 US-038 Write integration test for realtime subscriptions [agent: full-stack-orchestration:test-automator] [deps: T216, T160] [files: tests/integration/realtime.test.js]

### Story Progress: 0/5

---

## User Story: US-039 End-to-End Tests with Playwright
> As a developer, I need E2E tests for critical user flows

### Acceptance Criteria
- [ ] Test full join game flow (select party → enter nickname → join)
- [ ] Test province clicking with visual feedback
- [ ] Test party change with cooldown
- [ ] Test realtime sync across multiple browsers
- [ ] Tests run in headless mode in CI/CD

### Tasks
- [ ] T221 P1 US-039 Create Playwright configuration [agent: full-stack-orchestration:test-automator] [deps: none] [files: playwright.config.js]
- [ ] T222 P2 US-039 Write E2E test for join game flow [agent: full-stack-orchestration:test-automator] [deps: T221, T125] [files: tests/e2e/join-game.spec.js]
- [ ] T223 P2 US-039 Write E2E test for province clicking [agent: full-stack-orchestration:test-automator] [deps: T221, T158] [files: tests/e2e/click-province.spec.js]
- [ ] T224 P2 US-039 Write E2E test for party change [agent: full-stack-orchestration:test-automator] [deps: T221, T133] [files: tests/e2e/party-change.spec.js]
- [ ] T225 P3 US-039 Write E2E test for realtime sync (2 browsers) [agent: full-stack-orchestration:test-automator] [deps: T221, T165] [files: tests/e2e/realtime-sync.spec.js]

### Story Progress: 0/5

---

## User Story: US-040 Firebase Hosting Deployment
> As a developer, I need to deploy the app to Firebase Hosting

### Acceptance Criteria
- [ ] Vite build produces optimized production bundle
- [ ] Environment variables configured correctly
- [ ] Firebase hosting deployed successfully
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled
- [ ] Cache headers set for static assets

### Tasks
- [x] T226 P1 US-040 Configure firebase.json with hosting rules [agent: full-stack-orchestration:deployment-engineer] [deps: none] [files: firebase.json]
- [ ] T227 P1 US-040 Set up production environment variables [agent: full-stack-orchestration:deployment-engineer] [deps: T003] [files: .env.production]
- [ ] T228 P2 US-040 Run vite build to create production bundle [agent: full-stack-orchestration:deployment-engineer] [deps: T227] [files: dist/]
- [ ] T229 P2 US-040 Deploy to Firebase with firebase deploy [agent: full-stack-orchestration:deployment-engineer] [deps: T228] [files: N/A]
- [ ] T230 P3 US-040 Verify deployment is accessible via HTTPS [agent: full-stack-orchestration:deployment-engineer] [deps: T229] [files: N/A]
- [ ] T231 P3 US-040 Configure custom domain (if applicable) [agent: full-stack-orchestration:deployment-engineer] [deps: T230] [files: firebase.json]

### Story Progress: 1/6

---

## User Story: US-041 CI/CD Pipeline with GitHub Actions
> As a developer, I need automated testing and deployment via GitHub Actions

### Acceptance Criteria
- [ ] CI runs on every push to main
- [ ] Unit tests run automatically
- [ ] E2E tests run automatically
- [ ] Successful builds deploy to Firebase
- [ ] Build status badge in README
- [ ] Fail fast on test failures

### Tasks
- [ ] T232 P1 US-041 Create GitHub Actions workflow file [agent: full-stack-orchestration:deployment-engineer] [deps: none] [files: .github/workflows/deploy.yml]
- [ ] T233 P2 US-041 Add unit test job to workflow [agent: full-stack-orchestration:deployment-engineer] [deps: T232, T215] [files: .github/workflows/deploy.yml]
- [ ] T234 P2 US-041 Add E2E test job to workflow [agent: full-stack-orchestration:deployment-engineer] [deps: T232, T225] [files: .github/workflows/deploy.yml]
- [ ] T235 P2 US-041 Add Firebase deploy job [agent: full-stack-orchestration:deployment-engineer] [deps: T232, T229] [files: .github/workflows/deploy.yml]
- [ ] T236 P3 US-041 Add build status badge to README [agent: full-stack-orchestration:deployment-engineer] [deps: T232] [files: README.md]

### Story Progress: 0/5

---

## Execution Batches (Auto-Generated from Dependencies)

### Batch 0 - No Dependencies
| Task | Story | Priority | Agent | Status | Files |
|------|-------|----------|-------|--------|-------|
| T209 | US-037 | P1 | test-automator | ✅ | vitest.config.js |
| T221 | US-039 | P1 | test-automator | Pending | playwright.config.js |
| T226 | US-040 | P1 | deployment-engineer | ✅ | firebase.json |
| T232 | US-041 | P1 | deployment-engineer | Pending | .github/workflows/deploy.yml |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Status | Files |
|------|-------|----------|-------|------|--------|-------|
| T210 | US-037 | P1 | test-automator | T209 | ✅ | tests/setup.js |
| T216 | US-038 | P1 | test-automator | T005 | Pending | tests/integration/setup.js |
| T227 | US-040 | P1 | deployment-engineer | T003 | Pending | .env.production |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T211 | US-037 | P2 | test-automator | T210 | ✅ | tests/unit/auth.test.js |
| T212 | US-037 | P2 | test-automator | T210, T196 | tests/unit/i18n.test.js |
| T213 | US-037 | P2 | test-automator | T210, T186 | tests/unit/toast.test.js |
| T214 | US-037 | P2 | test-automator | T210, T174 | tests/unit/timer.test.js |
| T217 | US-038 | P2 | test-automator | T216, T043 | tests/integration/click-province.test.js |
| T218 | US-038 | P2 | test-automator | T216, T054 | tests/integration/join-game.test.js |
| T219 | US-038 | P2 | test-automator | T216, T067 | tests/integration/leaderboard.test.js |
| T220 | US-038 | P2 | test-automator | T216, T160 | tests/integration/realtime.test.js |
| T222 | US-039 | P2 | test-automator | T221, T125 | tests/e2e/join-game.spec.js |
| T223 | US-039 | P2 | test-automator | T221, T158 | tests/e2e/click-province.spec.js |
| T224 | US-039 | P2 | test-automator | T221, T133 | tests/e2e/party-change.spec.js |
| T228 | US-040 | P2 | deployment-engineer | T227 | dist/ |
| T236 | US-041 | P3 | deployment-engineer | T232 | README.md |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T215 | US-037 | P3 | test-automator | T211, T212, T213, T214 | coverage/ |
| T225 | US-039 | P3 | test-automator | T221, T165 | tests/e2e/realtime-sync.spec.js |
| T229 | US-040 | P2 | deployment-engineer | T228 | N/A |
| T233 | US-041 | P2 | deployment-engineer | T232, T215 | .github/workflows/deploy.yml |

### Batch 4 - Depends on Batch 3
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T230 | US-040 | P3 | deployment-engineer | T229 | N/A |
| T234 | US-041 | P2 | deployment-engineer | T232, T225 | .github/workflows/deploy.yml |

### Batch 5 - Depends on Batch 4
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T231 | US-040 | P3 | deployment-engineer | T230 | firebase.json |
| T235 | US-041 | P2 | deployment-engineer | T232, T229 | .github/workflows/deploy.yml |

---

## Progress Summary
- Total Tasks: 28
- Completed: 4
- In Progress: 0
- Pending: 24

**Status: Partially Complete**

**Already Implemented:**
- ✅ Vitest configuration
- ✅ Test setup with mocks
- ✅ Unit tests for auth module
- ✅ Firebase hosting configuration

**Next Steps:**
- Complete unit tests for remaining modules
- Add integration tests for database functions
- Implement E2E tests with Playwright
- Set up CI/CD pipeline with GitHub Actions
- Deploy to Firebase Hosting

Last Updated: 2026-01-07
