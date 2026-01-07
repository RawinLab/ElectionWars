# Requirements Analysis: Module 1.1 - Project Setup & Infrastructure

**Module:** 1.1
**Module Name:** Project Setup & Infrastructure
**Analysis Date:** 2026-01-07
**Analyst:** System Analyst Agent
**Priority:** CRITICAL - Foundation Module
**Dependencies:** None (Starting Point)

---

## Executive Summary

Module 1.1 establishes the foundational infrastructure for the Election War game. This module is critical as all subsequent development depends on successful completion. The analysis identifies 3 primary features with 12 acceptance criteria and defines clear technical requirements aligned with the tech stack.

---

## Module Overview

### Business Context
This module sets up the development environment and infrastructure for a real-time, browser-based political game targeting Thailand's 2026 parliamentary election. The game requires:
- Frontend deployment capability (Firebase Hosting)
- Real-time backend services (Supabase)
- Anonymous user authentication
- Environment configuration management

### Strategic Importance
- **Foundation for all features:** No other module can proceed without this setup
- **Development velocity:** Proper setup accelerates all subsequent development
- **Production readiness:** Establishes deployment pipeline from day one
- **Cost management:** Free tier configuration minimizes initial costs

---

## Feature Breakdown

### Feature 1.1.1: Supabase Project Setup

#### User Story
As a **developer**, I want **a configured Supabase backend** so that **I can store game data and enable real-time updates**.

#### Acceptance Criteria
- [ ] Supabase project created at supabase.com with Singapore region
- [ ] Anonymous authentication enabled in Auth settings
- [ ] Project URL and anon key obtained from Settings > API
- [ ] Connection test successful from browser console
- [ ] Environment variables documented in .env.example

#### Business Rules
- **Region Selection:** Must use Singapore region for lowest latency to Thailand
- **Authentication Type:** Anonymous auth only (no email/password required)
- **Security:** anon key is public-safe, service_role key must never be exposed
- **Free Tier Limits:** 500MB database, 2GB bandwidth, 50K monthly active users

#### Technical Requirements
- Supabase account creation
- Project provisioning (5-10 minutes wait time)
- API credentials extraction
- Connection validation

#### Data Requirements
**Credentials to obtain:**
- `VITE_SUPABASE_URL`: https://[project-id].supabase.co
- `VITE_SUPABASE_ANON_KEY`: JWT token for client-side access

#### Edge Cases
- **Project provisioning fails:** Retry or contact Supabase support
- **Wrong region selected:** Cannot change later, must recreate project
- **Credentials leaked:** Rotate anon key in project settings

---

### Feature 1.1.2: Firebase Project Setup

#### User Story
As a **developer**, I want **a Firebase Hosting environment** so that **I can deploy the frontend with global CDN**.

#### Acceptance Criteria
- [ ] Firebase project created at console.firebase.google.com
- [ ] Firebase Hosting initialized with correct public directory
- [ ] Test deployment successful (firebase deploy --only hosting)
- [ ] Custom domain configured (optional, can be deferred)
- [ ] GitHub Actions workflow tested (optional for MVP)

#### Business Rules
- **Hosting Plan:** Start with free tier (10GB storage, 360MB/day transfer)
- **Public Directory:** Must point to "dist" (Vite build output)
- **CI/CD:** GitHub Actions deployment is optional for initial setup
- **Domain:** Can use .web.app subdomain initially, custom domain later

#### Technical Requirements
- Google account (required)
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Firebase authentication: `firebase login`
- Project initialization: `firebase init hosting`

#### Data Requirements
**Configuration files:**
- `firebase.json`: Hosting configuration
- `.firebaserc`: Project reference

#### Edge Cases
- **Firebase CLI not installed:** Install via npm globally
- **Login fails:** Check Google account permissions
- **Deployment fails:** Verify build directory exists and contains index.html

---

### Feature 1.1.3: Frontend Project (Vite)

#### User Story
As a **developer**, I want **a modern Vite-based frontend project** so that **I can build the game UI with fast development experience**.

#### Acceptance Criteria
- [ ] Vite project initialized with vanilla JavaScript template
- [ ] Supabase client library installed (@supabase/supabase-js)
- [ ] Development dependencies installed (vitest, playwright)
- [ ] Environment variables configured in .env.local
- [ ] Project builds successfully (npm run build)
- [ ] Dev server runs without errors (npm run dev)
- [ ] Folder structure matches specification

#### Business Rules
- **Template:** Vanilla JavaScript (no React/Vue framework for simplicity)
- **Build Tool:** Vite for fast HMR and small bundle size
- **Testing:** Jest/Vitest for unit tests, Playwright for E2E
- **Environment:** .env.local for development, .env.production for deployment

#### Technical Requirements
- Node.js 18+ installed
- Package manager: npm or yarn
- Vite configuration for environment variables
- Supabase client initialization

#### Data Requirements
**Environment variables (.env.local):**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GAME_END_DATE=2026-02-08T23:59:59+07:00
```

**Dependencies (package.json):**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "vitest": "^1.x",
    "@playwright/test": "^1.x"
  }
}
```

#### Folder Structure Specification
```
ElectionWars/
├── public/
│   ├── sounds/
│   │   └── click.mp3
│   └── thailand-map.svg
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase client singleton
│   │   └── utils.js         # Utility functions
│   ├── components/
│   │   ├── Map.js           # Thailand map component
│   │   ├── PartySelector.js # Party selection UI
│   │   ├── Leaderboard.js   # Party rankings
│   │   ├── Timer.js         # Countdown timer
│   │   └── Toast.js         # Notification toasts
│   ├── styles/
│   │   ├── main.css         # Global styles
│   │   ├── map.css          # Map styles
│   │   └── components.css   # Component styles
│   ├── i18n/
│   │   ├── th.json          # Thai translations
│   │   └── en.json          # English translations
│   └── main.js              # Entry point
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions (if needed)
│   └── seed.sql             # Seed data
├── tests/
│   ├── unit/
│   └── e2e/
├── index.html
├── package.json
├── vite.config.js
├── firebase.json
└── .env.local
```

#### Edge Cases
- **Vite version conflicts:** Use exact versions specified
- **Import path issues:** Configure vite.config.js aliases if needed
- **Environment variables not loading:** Prefix with VITE_ and restart dev server
- **Build fails:** Check for TypeScript errors if using .ts files

---

## Dependencies

### External Dependencies
None - This is the starting module.

### Internal Dependencies (Blocks)
This module blocks:
- Module 2.1: Database Tables Plan
- Module 2.2: Database Functions Plan
- Module 3.1: Authentication Plan
- All other modules

### Dependency Risks
- **Supabase outage during setup:** Minimal risk, retry later
- **Firebase quota limits:** Free tier sufficient for setup phase
- **API credential exposure:** Mitigated by .gitignore and environment variables

---

## Technical Architecture

### Technology Stack (Confirmed)
| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Frontend Framework | Vite | 5.x | Fast HMR, minimal config |
| Backend Service | Supabase Cloud | Latest | Managed PostgreSQL + Realtime |
| Authentication | Supabase Auth | Built-in | Anonymous sessions |
| Hosting | Firebase Hosting | Latest | Free CDN, Thai edge nodes |
| Build Tool | Vite | 5.x | ES modules, fast builds |

### Integration Points
1. **Frontend ↔ Supabase:** Via @supabase/supabase-js client library
2. **Build ↔ Firebase:** Via firebase-tools CLI
3. **CI/CD (future):** GitHub Actions → Firebase Hosting

### Security Considerations
- **API Keys:** anon key is safe to expose, service_role must stay secret
- **CORS:** Supabase allows all origins by default (controlled by RLS)
- **Environment Variables:** Never commit .env.local to git
- **.gitignore:** Must include .env.local, node_modules, dist/

---

## Test Cases

### Unit Tests
**Test:** Supabase client initializes without error
```javascript
import { supabase } from './src/lib/supabase'
expect(supabase).toBeDefined()
expect(supabase.auth).toBeDefined()
```

**Test:** Environment variables are loaded correctly
```javascript
expect(import.meta.env.VITE_SUPABASE_URL).toMatch(/https:\/\/.+\.supabase\.co/)
expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeTruthy()
```

**Test:** Utility functions work as expected
```javascript
import { formatDate } from './src/lib/utils'
expect(formatDate(new Date('2026-02-08'))).toBe('8 ก.พ. 2569')
```

### Integration Tests
**Test:** Can connect to Supabase from browser
```javascript
const { data, error } = await supabase.from('_test').select('*')
expect(error).toBeNull()
```

**Test:** Firebase hosting serves index.html
```bash
firebase serve --only hosting
curl http://localhost:5000/ | grep "<title>Election War"
```

**Test:** Environment variables are not exposed in build
```bash
npm run build
grep -r "SUPABASE_ANON_KEY" dist/ && exit 1 || exit 0  # Should not find
```

---

## Implementation Steps

### Step 1: Create Supabase Project (30 minutes)
1. Navigate to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Organization: Create new or use existing
   - Name: election-war-prod
   - Database Password: Generate strong password (save securely)
   - Region: **Singapore (Southeast Asia)** - closest to Thailand
4. Click "Create new project"
5. Wait 5-10 minutes for provisioning
6. Navigate to Settings > API
7. Copy:
   - Project URL: https://[project-id].supabase.co
   - anon public key: eyJhbGci...
8. Test connection in browser console:
```javascript
const { createClient } = supabase
const client = createClient('URL', 'KEY')
const { data } = await client.from('_test').select('*')
console.log('Connected:', data)
```

### Step 2: Create Firebase Project (20 minutes)
1. Navigate to https://console.firebase.google.com
2. Click "Add project"
3. Project name: election-war-prod
4. Enable Google Analytics: Optional (can skip for faster setup)
5. Wait for project creation
6. Click "Hosting" in left menu
7. Click "Get started"
8. Install Firebase CLI locally:
```bash
npm install -g firebase-tools
```
9. Login to Firebase:
```bash
firebase login
```
10. Initialize hosting (run later in Step 3)

### Step 3: Initialize Vite Project (30 minutes)
1. Create project directory:
```bash
cd /home/dev/projects/ElectionWars
```

2. Initialize Vite project:
```bash
npm create vite@latest . -- --template vanilla
```

3. Install dependencies:
```bash
npm install @supabase/supabase-js
npm install -D firebase-tools vitest @playwright/test
```

4. Create folder structure:
```bash
mkdir -p src/{lib,components,styles,i18n}
mkdir -p public/sounds
mkdir -p supabase/{migrations,functions}
mkdir -p tests/{unit,e2e}
```

5. Create Supabase client (src/lib/supabase.js):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

6. Create vite.config.js:
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Step 4: Configure Environment (15 minutes)
1. Create .env.local:
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GAME_END_DATE=2026-02-08T23:59:59+07:00
```

2. Create .env.example (for documentation):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GAME_END_DATE=2026-02-08T23:59:59+07:00
```

3. Update .gitignore:
```
node_modules/
dist/
.env.local
.env*.local
.firebase/
*.log
```

### Step 5: Initialize Firebase Hosting (15 minutes)
1. Initialize Firebase in project:
```bash
firebase init hosting
```

2. Configuration prompts:
   - Select Firebase project: election-war-prod
   - Public directory: **dist** (important!)
   - Configure as SPA: **Yes**
   - Set up automatic builds with GitHub: **No** (for now)

3. Verify firebase.json:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 6: Verify Connections (20 minutes)
1. Test Supabase connection:
```bash
npm run dev
# Open http://localhost:5173
# Open browser console
```

```javascript
// In browser console
const { data, error } = await supabase.from('_test').select('*')
console.log('Supabase connected:', !error)
```

2. Test build:
```bash
npm run build
```

3. Test Firebase hosting locally:
```bash
firebase serve --only hosting
# Open http://localhost:5000
```

4. Test Firebase deployment (optional):
```bash
firebase deploy --only hosting
# Visit deployed URL
```

---

## Success Metrics

### Functional Metrics
- [ ] Supabase project accessible via dashboard
- [ ] Firebase project visible in console
- [ ] Vite dev server runs on localhost:5173
- [ ] Build completes without errors
- [ ] All environment variables loaded correctly

### Performance Metrics
- Dev server startup: < 5 seconds
- Build time: < 30 seconds
- Deployed page load: < 2 seconds

### Quality Metrics
- Zero build warnings
- Zero console errors on page load
- Environment variables not exposed in build output

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase free tier limits exceeded | High | Low | Monitor usage, upgrade to Pro if needed |
| Firebase quota exceeded during development | Medium | Low | Use dev server, deploy only for testing |
| Environment variables committed to git | High | Medium | Strong .gitignore, pre-commit hooks |
| Wrong Supabase region selected | High | Low | Verify Singapore region before creation |
| Build tool version conflicts | Medium | Medium | Use exact versions in package.json |

---

## Open Questions for Clarification

1. **Custom Domain:** Do we need a custom domain immediately, or can we use Firebase .web.app subdomain initially?
   - **Recommendation:** Use .web.app for MVP, add custom domain later

2. **CI/CD:** Should we set up GitHub Actions in this module, or defer to deployment module?
   - **Recommendation:** Defer to Module 7.1 (Deployment Plan)

3. **SSL Certificate:** Firebase provides automatic SSL, do we need additional configuration?
   - **Answer:** No, Firebase handles SSL automatically

4. **Monitoring:** Should we set up Sentry/logging in this module?
   - **Recommendation:** Basic setup now, detailed monitoring in later modules

---

## Next Steps

After completing Module 1.1, proceed to:

1. **Module 2.1:** Database Tables Plan
   - Create provinces, parties, players, province_state tables
   - Define schema based on PRD specifications

2. **Module 2.2:** Database Functions Plan
   - Implement click_province, join_game, get_leaderboard functions
   - Set up shield system mechanics

3. **Module 3.1:** Authentication Plan
   - Configure anonymous auth flow
   - Implement player session management

---

## Estimated Effort

| Task | Estimated Time | Assigned To |
|------|---------------|-------------|
| Supabase project setup | 0.5 hours | Developer |
| Firebase project setup | 0.5 hours | Developer |
| Vite project initialization | 1 hour | Developer |
| Environment configuration | 0.5 hours | Developer |
| Connection verification | 0.5 hours | Developer |
| Documentation | 0.5 hours | Developer |
| **Total** | **3.5 hours** | |

**Calendar Time:** 0.5 days (with waiting for Supabase provisioning)

---

## Approval

**Status:** Ready for Implementation
**Reviewed By:** System Analyst
**Date:** 2026-01-07
**Next Approval Required:** Tech Lead (for technical feasibility review)

---

**Document End**
