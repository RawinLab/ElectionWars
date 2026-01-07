# TodoList: UX Features - Notifications, Language, Sound (Module 6.1)

## Overview
- Module: 6-1-ux-notifications
- User Stories: 4
- Total Tasks: 18
- Generated: 2026-01-07

---

## User Story: US-033 Toast Notification System
> As a player, I want to see notifications when important game events occur

### Acceptance Criteria
- [ ] Shows toast when province is captured
- [ ] Shows toast when your party wins a province
- [ ] Shows warning when province shield is low
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Can manually close toasts
- [ ] Multiple toasts stack vertically
- [ ] Smooth slide-in/slide-out animations

### Tasks
- [ ] T185 P1 US-033 Create ToastManager class [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/components/Toast.js]
- [ ] T186 P2 US-033 Implement show() method with type and message [agent: multi-platform-apps:frontend-developer] [deps: T185] [files: src/components/Toast.js]
- [ ] T187 P2 US-033 Add auto-dismiss timer (3s default) [agent: multi-platform-apps:frontend-developer] [deps: T186] [files: src/components/Toast.js]
- [ ] T188 P2 US-033 Add manual close button [agent: multi-platform-apps:frontend-developer] [deps: T186] [files: src/components/Toast.js]
- [ ] T189 P2 US-033 Create convenience methods (provinceFlip, partyWin, shieldWarning) [agent: multi-platform-apps:frontend-developer] [deps: T186] [files: src/components/Toast.js]
- [ ] T190 P2 US-033 Integrate toasts with realtime province updates [agent: multi-platform-apps:backend-architect] [deps: T189, T160] [files: src/main.js]
- [ ] T191 P3 US-033 Add CSS for toast animations and styling [agent: multi-platform-apps:frontend-developer] [deps: T186] [files: src/styles/components.css]
- [ ] T192 P3 US-033 Test toast notifications display correctly [agent: full-stack-orchestration:test-automator] [deps: T189] [files: tests/e2e/toast.spec.js]

### Story Progress: 0/8

---

## User Story: US-034 Bilingual Support (Thai/English)
> As a player, I want to switch between Thai and English language

### Acceptance Criteria
- [ ] All UI text supports Thai and English
- [ ] Language toggle button in header
- [ ] Selected language persists in localStorage
- [ ] Default language based on browser preference
- [ ] All text updates immediately on language change

### Tasks
- [ ] T193 P1 US-034 Create i18n.js with translation dictionaries [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/lib/i18n.js]
- [ ] T194 P1 US-034 Add Thai translations for all UI text [agent: multi-platform-apps:frontend-developer] [deps: T193] [files: src/i18n/th.json]
- [ ] T195 P1 US-034 Add English translations for all UI text [agent: multi-platform-apps:frontend-developer] [deps: T193] [files: src/i18n/en.json]
- [ ] T196 P2 US-034 Implement I18n class with setLanguage() [agent: multi-platform-apps:frontend-developer] [deps: T193] [files: src/lib/i18n.js]
- [ ] T197 P2 US-034 Create language toggle button [agent: multi-platform-apps:frontend-developer] [deps: T196] [files: src/components/LanguageToggle.js]
- [ ] T198 P2 US-034 Persist language preference in localStorage [agent: multi-platform-apps:frontend-developer] [deps: T196] [files: src/lib/i18n.js]
- [ ] T199 P3 US-034 Test language switching updates all text [agent: full-stack-orchestration:test-automator] [deps: T197] [files: tests/e2e/i18n.spec.js]

### Story Progress: 0/7

---

## User Story: US-035 Sound Effects Toggle
> As a player, I want to enable/disable click sound effects

### Acceptance Criteria
- [ ] Sound toggle button in UI
- [ ] Click sound plays when sound is enabled
- [ ] Sound preference persists in localStorage
- [ ] Volume set to reasonable level (30%)
- [ ] No errors if sound file is missing

### Tasks
- [ ] T200 P2 US-035 Add click.mp3 sound file [agent: manual] [deps: none] [files: public/sounds/click.mp3]
- [ ] T201 P2 US-035 Load sound in Map component [agent: multi-platform-apps:frontend-developer] [deps: T200, T136] [files: src/components/Map.js]
- [ ] T202 P2 US-035 Create SoundToggle button component [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/components/SoundToggle.js]
- [ ] T203 P2 US-035 Persist sound preference in localStorage [agent: multi-platform-apps:frontend-developer] [deps: T202] [files: src/components/SoundToggle.js]
- [ ] T204 P3 US-035 Test sound plays when enabled [agent: full-stack-orchestration:test-automator] [deps: T201] [files: tests/e2e/sound.spec.js]

### Story Progress: 0/5

---

## User Story: US-036 Settings Panel
> As a player, I want a centralized settings panel for language and sound

### Acceptance Criteria
- [ ] Settings icon/button in header
- [ ] Modal or side panel for settings
- [ ] Language selection (Thai/English)
- [ ] Sound toggle (On/Off)
- [ ] Close button to dismiss settings
- [ ] Settings apply immediately

### Tasks
- [ ] T205 P2 US-036 Create SettingsPanel component [agent: multi-platform-apps:frontend-developer] [deps: none] [files: src/components/SettingsPanel.js]
- [ ] T206 P2 US-036 Integrate LanguageToggle into settings [agent: multi-platform-apps:frontend-developer] [deps: T205, T197] [files: src/components/SettingsPanel.js]
- [ ] T207 P2 US-036 Integrate SoundToggle into settings [agent: multi-platform-apps:frontend-developer] [deps: T205, T202] [files: src/components/SettingsPanel.js]
- [ ] T208 P3 US-036 Add CSS for settings panel modal [agent: multi-platform-apps:frontend-developer] [deps: T205] [files: src/styles/components.css]

### Story Progress: 0/4

---

## Execution Batches (Auto-Generated from Dependencies)

### Batch 0 - No Dependencies
| Task | Story | Priority | Agent | Files |
|------|-------|----------|-------|-------|
| T185 | US-033 | P1 | frontend-developer | src/components/Toast.js |
| T193 | US-034 | P1 | frontend-developer | src/lib/i18n.js |
| T200 | US-035 | P2 | manual | public/sounds/click.mp3 |
| T202 | US-035 | P2 | frontend-developer | src/components/SoundToggle.js |
| T205 | US-036 | P2 | frontend-developer | src/components/SettingsPanel.js |

### Batch 1 - Depends on Batch 0
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T186 | US-033 | P2 | frontend-developer | T185 | src/components/Toast.js |
| T191 | US-033 | P3 | frontend-developer | T186 | src/styles/components.css |
| T194 | US-034 | P1 | frontend-developer | T193 | src/i18n/th.json |
| T195 | US-034 | P1 | frontend-developer | T193 | src/i18n/en.json |
| T196 | US-034 | P2 | frontend-developer | T193 | src/lib/i18n.js |
| T201 | US-035 | P2 | frontend-developer | T200, T136 | src/components/Map.js |
| T203 | US-035 | P2 | frontend-developer | T202 | src/components/SoundToggle.js |
| T208 | US-036 | P3 | frontend-developer | T205 | src/styles/components.css |

### Batch 2 - Depends on Batch 1
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T187 | US-033 | P2 | frontend-developer | T186 | src/components/Toast.js |
| T188 | US-033 | P2 | frontend-developer | T186 | src/components/Toast.js |
| T189 | US-033 | P2 | frontend-developer | T186 | src/components/Toast.js |
| T197 | US-034 | P2 | frontend-developer | T196 | src/components/LanguageToggle.js |
| T198 | US-034 | P2 | frontend-developer | T196 | src/lib/i18n.js |
| T204 | US-035 | P3 | test-automator | T201 | tests/e2e/sound.spec.js |

### Batch 3 - Depends on Batch 2
| Task | Story | Priority | Agent | Deps | Files |
|------|-------|----------|-------|------|-------|
| T190 | US-033 | P2 | backend-architect | T189, T160 | src/main.js |
| T192 | US-033 | P3 | test-automator | T189 | tests/e2e/toast.spec.js |
| T199 | US-034 | P3 | test-automator | T197 | tests/e2e/i18n.spec.js |
| T206 | US-036 | P2 | frontend-developer | T205, T197 | src/components/SettingsPanel.js |
| T207 | US-036 | P2 | frontend-developer | T205, T202 | src/components/SettingsPanel.js |

---

## Progress Summary
- Total Tasks: 24
- Completed: 0
- In Progress: 0
- Pending: 24

**Status: Ready to Start**

**Key Features:**
- Toast notifications for game events (province capture, party win, shield warning)
- Full bilingual support (Thai/English) with language toggle
- Sound effects with on/off toggle
- Centralized settings panel for user preferences
- All preferences persist in localStorage

Last Updated: 2026-01-07
