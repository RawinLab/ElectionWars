# Plan: Project Setup & Infrastructure (Module 1.1)

## Module Information
- **Module:** 1.1
- **Name:** Project Setup & Infrastructure
- **Dependencies:** None (Starting Point)
- **Priority:** CRITICAL - Must complete first
- **Estimated:** 1-2 days

---

## Features

### 1.1.1 Supabase Project Setup
- Create Supabase project at supabase.com
- Configure anonymous authentication
- Get project URL and anon key
- Test connection from browser

### 1.1.2 Firebase Project Setup
- Create Firebase project at console.firebase.google.com
- Initialize Firebase Hosting
- Configure custom domain (optional)
- Set up GitHub Actions for CI/CD (optional)

### 1.1.3 Frontend Project (Vite)
- Initialize Vite project with vanilla JS/TypeScript
- Install dependencies (@supabase/supabase-js, firebase-tools)
- Configure environment variables (.env.local)
- Set up project structure

---

## Technical Design

### Folder Structure
```
ElectionWars/
├── public/
│   ├── sounds/
│   │   └── click.mp3
│   └── thailand-map.svg
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
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

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GAME_END_DATE=2026-02-08T23:59:59+07:00
```

### Package.json Dependencies
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

### Supabase Client (src/lib/supabase.js)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Implementation Steps

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create new project (region: Singapore for Thailand)
3. Wait for project to provision
4. Copy URL and anon key from Settings > API

### Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Hosting
4. Install firebase-tools globally: `npm install -g firebase-tools`
5. Login: `firebase login`
6. Initialize: `firebase init hosting`

### Step 3: Initialize Vite Project
```bash
npm create vite@latest election-wars -- --template vanilla
cd election-wars
npm install @supabase/supabase-js
npm install -D firebase-tools
```

### Step 4: Configure Environment
1. Create `.env.local` with Supabase credentials
2. Create `.env.example` (without secrets) for documentation
3. Add `.env.local` to `.gitignore`

### Step 5: Verify Connections
```javascript
// Test Supabase connection
const { data, error } = await supabase.from('_test').select('*')
console.log('Supabase connected:', !error)

// Test Firebase hosting
firebase serve --only hosting
```

---

## Test Cases

### Unit Tests
- [ ] Supabase client initializes without error
- [ ] Environment variables are loaded correctly
- [ ] Utility functions work as expected

### Integration Tests
- [ ] Can connect to Supabase from browser
- [ ] Firebase hosting serves index.html
- [ ] Environment variables are not exposed in build

---

## Acceptance Criteria
- [ ] Supabase project created and accessible
- [ ] Firebase Hosting configured
- [ ] Vite project builds successfully
- [ ] Can connect to Supabase from frontend
- [ ] Environment variables configured correctly
- [ ] Folder structure created as specified
