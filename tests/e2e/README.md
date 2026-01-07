# E2E Tests for ElectionWars

End-to-end tests for the ElectionWars Thailand 2026 election clicker game using Playwright.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Playwright browsers installed

## Installation

Install Playwright browsers:

```bash
# Install with dependencies (requires sudo on Linux)
npx playwright install --with-deps

# Or install browsers only
npx playwright install
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test tests/e2e/join-game.spec.js
```

### Run tests in headed mode (visible browser)
```bash
npx playwright test --headed
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug tests
```bash
npx playwright test --debug
```

## Test Structure

### Test Files

- `join-game.spec.js` - Tests for joining the game flow
  - Party selection
  - Nickname validation
  - Game screen display
  - Session persistence

- `click-province.spec.js` - Tests for province clicking
  - Map loading
  - Province interaction
  - Visual feedback
  - Sound settings

- `party-change.spec.js` - Tests for changing party
  - Change party dialog
  - Confirmation flow
  - Party update verification

- `realtime-sync.spec.js` - Tests for realtime synchronization
  - Multi-user scenarios
  - Province state sync
  - Leaderboard updates
  - Toast notifications

### Helper Functions

Located in `helpers/game-helpers.js`:

- `joinGame(page, partyIndex, nickname)` - Join game with specified party and nickname
- `waitForMapLoad(page)` - Wait for Thailand map to fully load
- `clickProvince(page, provinceIndex)` - Click on a province by index
- `getPlayerInfo(page)` - Get current player information
- `getSelectedParty(page)` - Get selected party information
- `isSoundEnabled(page)` - Check if sound is enabled
- `toggleSound(page)` - Toggle sound setting
- `clearStorage(page)` - Clear all browser storage

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are generated in the `playwright-report/` directory.

## CI/CD Integration

GitHub Actions workflow is configured in `.github/workflows/playwright.yml` to:
- Run on push to main/develop branches
- Run on pull requests
- Upload test reports as artifacts
- Run tests in headless mode

## Configuration

Playwright configuration is in `playwright.config.js`:

- Base URL: `http://localhost:5173` (Vite dev server)
- Timeout: 30 seconds per test
- Retries: 2 on CI, 0 locally
- Screenshots: On failure
- Video: On retry
- Web server: Auto-starts Vite dev server

## Writing New Tests

1. Create a new spec file in `tests/e2e/`
2. Import test and expect from `@playwright/test`
3. Import helpers from `./helpers/game-helpers.js`
4. Use `test.describe()` to group related tests
5. Use `test.beforeEach()` for setup (clear storage, navigate, join game)
6. Write clear, descriptive test names
7. Use Page Object Model pattern for complex scenarios

Example:

```javascript
import { test, expect } from '@playwright/test'
import { joinGame, clearStorage } from './helpers/game-helpers.js'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
    await page.goto('/')
    await joinGame(page, 0, 'TestPlayer')
  })

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('#element')).toBeVisible()
  })
})
```

## Troubleshooting

### Browsers not installed
Run: `npx playwright install`

### Port 5173 already in use
Stop other Vite dev servers or change port in `vite.config.js`

### Tests timing out
- Increase timeout in `playwright.config.js`
- Check if Supabase backend is accessible
- Verify network connectivity

### Flaky tests
- Add explicit waits with `waitForSelector()` or `waitForTimeout()`
- Use `toBeVisible()` instead of checking existence
- Ensure proper cleanup in `beforeEach()`

## Best Practices

1. **Clear storage before each test** - Ensures clean state
2. **Use data-testid attributes** - Makes selectors more stable
3. **Wait for elements properly** - Use Playwright's auto-waiting
4. **Keep tests independent** - Don't rely on test order
5. **Use descriptive names** - Test names should explain what they verify
6. **Mock external dependencies** - Use fixtures for consistent behavior
7. **Test realistic user flows** - Combine actions as users would
8. **Handle async operations** - Use proper awaits and timeouts

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI Integration](https://playwright.dev/docs/ci)
- [Debugging](https://playwright.dev/docs/debug)
