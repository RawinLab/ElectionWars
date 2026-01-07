# Plan: Testing & Deployment (Module 7.1)

## Module Information
- **Module:** 7.1
- **Name:** Testing & Firebase Deployment
- **Dependencies:** All previous modules
- **Priority:** HIGH
- **Estimated:** 2-3 days

---

## Features

### 7.1.1 Unit Tests (Vitest)
Test individual components and functions

### 7.1.2 Database Tests (pgTAP)
Test database functions

### 7.1.3 E2E Tests (Playwright)
Full user flow testing

### 7.1.4 Firebase Deployment
Deploy to Firebase Hosting

### 7.1.5 CI/CD Pipeline
GitHub Actions automation

---

## Technical Design

### Test Structure
```
tests/
├── unit/
│   ├── auth.test.js
│   ├── i18n.test.js
│   ├── toast.test.js
│   └── timer.test.js
├── integration/
│   ├── supabase.test.js
│   └── realtime.test.js
├── e2e/
│   ├── join-game.spec.js
│   ├── click-province.spec.js
│   └── realtime-sync.spec.js
└── database/
    └── click_province.test.sql
```

### Vitest Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/main.js']
    }
  }
});
```

### Sample Unit Tests
```javascript
// tests/unit/auth.test.js
import { describe, it, expect, vi } from 'vitest';
import { validateNickname } from '../../src/lib/auth.js';

describe('validateNickname', () => {
  it('rejects empty nickname', () => {
    expect(validateNickname('')).toEqual({
      valid: false,
      error: expect.stringContaining('3 characters')
    });
  });

  it('rejects nickname < 3 chars', () => {
    expect(validateNickname('ab')).toEqual({
      valid: false,
      error: expect.stringContaining('3 characters')
    });
  });

  it('rejects nickname > 20 chars', () => {
    expect(validateNickname('a'.repeat(21))).toEqual({
      valid: false,
      error: expect.stringContaining('20 characters')
    });
  });

  it('accepts Thai characters', () => {
    expect(validateNickname('ทดสอบ')).toEqual({ valid: true });
  });

  it('accepts English characters', () => {
    expect(validateNickname('TestUser')).toEqual({ valid: true });
  });

  it('accepts numbers and underscore', () => {
    expect(validateNickname('User_123')).toEqual({ valid: true });
  });

  it('rejects special characters', () => {
    expect(validateNickname('User@#$')).toEqual({
      valid: false,
      error: expect.any(String)
    });
  });
});
```

### Sample E2E Tests (Playwright)
```javascript
// tests/e2e/join-game.spec.js
import { test, expect } from '@playwright/test';

test.describe('Join Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display party selector on first visit', async ({ page }) => {
    await expect(page.locator('#party-selector')).toBeVisible();
  });

  test('should show all major parties', async ({ page }) => {
    const parties = page.locator('.party-card');
    await expect(parties).toHaveCount(57);
  });

  test('should select party and show nickname input', async ({ page }) => {
    await page.click('.party-card[data-party-id="1"]');
    await expect(page.locator('#nickname-input')).toBeVisible();
  });

  test('should reject invalid nickname', async ({ page }) => {
    await page.click('.party-card[data-party-id="1"]');
    await page.fill('#nickname-input', 'ab');
    await page.click('#join-button');
    await expect(page.locator('#nickname-error')).toBeVisible();
  });

  test('should join game with valid nickname', async ({ page }) => {
    await page.click('.party-card[data-party-id="1"]');
    await page.fill('#nickname-input', 'TestPlayer');
    await page.click('#join-button');

    // Should show game screen
    await expect(page.locator('#game-screen')).toBeVisible();
    await expect(page.locator('#thailand-map')).toBeVisible();
  });
});

// tests/e2e/click-province.spec.js
test.describe('Click Province', () => {
  test.beforeEach(async ({ page }) => {
    // Join game first
    await page.goto('/');
    await page.click('.party-card[data-party-id="1"]');
    await page.fill('#nickname-input', 'TestPlayer');
    await page.click('#join-button');
    await page.waitForSelector('#thailand-map');
  });

  test('should show click animation on province click', async ({ page }) => {
    const province = page.locator('[data-province-id="1"]');
    await province.click();

    // Check for animation class
    await expect(province).toHaveClass(/clicked/);
  });

  test('should show floating +1 on click', async ({ page }) => {
    const province = page.locator('[data-province-id="1"]');
    await province.click();

    await expect(page.locator('.click-number')).toBeVisible();
  });
});

// tests/e2e/realtime-sync.spec.js
test.describe('Realtime Sync', () => {
  test('should sync province changes between browsers', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both join different parties
    await page1.goto('/');
    await page1.click('.party-card[data-party-id="1"]');
    await page1.fill('#nickname-input', 'Player1');
    await page1.click('#join-button');

    await page2.goto('/');
    await page2.click('.party-card[data-party-id="2"]');
    await page2.fill('#nickname-input', 'Player2');
    await page2.click('#join-button');

    // Click province on page1
    await page1.click('[data-province-id="60"]'); // Small province

    // Wait for sync on page2
    await page2.waitForTimeout(1000);

    // Verify color change on page2
    const province = page2.locator('[data-province-id="60"]');
    // Province state should be updated
    await expect(province).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
```

### Database Tests (pgTAP)
```sql
-- supabase/tests/click_province.test.sql
BEGIN;
SELECT plan(5);

-- Setup test data
INSERT INTO players (id, party_id, nickname, auth_id)
VALUES ('11111111-1111-1111-1111-111111111111', 1, 'TestPlayer', '22222222-2222-2222-2222-222222222222');

-- Test 1: Defend adds shield
SELECT is(
  (click_province('11111111-1111-1111-1111-111111111111', 1, 1))->>'action',
  'defend',
  'Clicking own province should defend'
);

-- Test 2: Attack reduces shield
UPDATE province_state SET controlling_party_id = 2 WHERE province_id = 1;
SELECT is(
  (click_province('11111111-1111-1111-1111-111111111111', 1, 1))->>'action',
  'attack',
  'Clicking enemy province should attack'
);

-- Test 3: Rate limiting
SELECT is(
  (click_province('11111111-1111-1111-1111-111111111111', 1, 1))->>'success',
  'false',
  'Rapid clicks should be rate limited'
);

-- Test 4: Shield increases on defend
UPDATE province_state SET controlling_party_id = 1, shield_current = 100 WHERE province_id = 1;
SELECT ok(
  (SELECT shield_current FROM province_state WHERE province_id = 1) <= 101,
  'Shield should increase after defend'
);

-- Cleanup
DELETE FROM players WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT * FROM finish();
ROLLBACK;
```

### Firebase Configuration
```json
// firebase.json
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
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(svg|png|jpg|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=604800"
          }
        ]
      }
    ]
  }
}
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

---

## Implementation Steps

### Step 1: Set Up Test Environment
1. Install vitest, @playwright/test
2. Create vitest.config.js
3. Create playwright.config.js
4. Create test directories

### Step 2: Write Unit Tests
1. Test auth functions
2. Test i18n module
3. Test utility functions
4. Target 80%+ coverage

### Step 3: Write E2E Tests
1. Test join game flow
2. Test click province
3. Test realtime sync

### Step 4: Configure Firebase
1. Create Firebase project
2. Install firebase-tools
3. Run `firebase init hosting`
4. Configure firebase.json

### Step 5: Set Up CI/CD
1. Create GitHub secrets
2. Create deploy.yml workflow
3. Test deployment pipeline

### Step 6: Deploy to Production
1. Build production bundle
2. Deploy to Firebase
3. Verify production site
4. Set up custom domain (optional)

---

## Test Cases

### Pre-deployment Checklist
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No console errors in browser
- [ ] Mobile responsive verified
- [ ] Performance acceptable (<2s load)

### Post-deployment Checklist
- [ ] Production URL accessible
- [ ] Supabase connection working
- [ ] Realtime updates working
- [ ] Click tracking working
- [ ] No CORS errors

---

## Acceptance Criteria
- [ ] 80%+ unit test coverage
- [ ] E2E tests for critical flows
- [ ] Firebase deployment successful
- [ ] CI/CD pipeline working
- [ ] Production site accessible
- [ ] All features working in production
