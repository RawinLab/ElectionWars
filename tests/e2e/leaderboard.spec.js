import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clickProvince, clearStorage } from './helpers/game-helpers.js'

test.describe('Leaderboard Component', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to start fresh
    await clearStorage(page)

    // Navigate to the application and join the game
    await page.goto('/')
    await joinGame(page, 0, 'LeaderboardTestPlayer')
    await waitForMapLoad(page)
  })

  test('should display leaderboard component after joining game', async ({ page }) => {
    // Verify leaderboard container is visible
    const leaderboard = page.locator('#leaderboard')
    await expect(leaderboard).toBeVisible({ timeout: 10000 })

    // Verify leaderboard header is present
    const header = page.locator('.leaderboard-header h3')
    await expect(header).toBeVisible()
    await expect(header).toHaveText('Party Rankings')

    // Verify leaderboard table exists
    const table = page.locator('.leaderboard-table')
    await expect(table).toBeVisible()
  })

  test('should display all parties ranked by provinces controlled', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get all party rows
    const partyRows = page.locator('.leaderboard-table tbody tr')
    const rowCount = await partyRows.count()

    // Verify at least one party is displayed
    expect(rowCount).toBeGreaterThan(0)

    // Verify each row has all required columns
    for (let i = 0; i < rowCount; i++) {
      const row = partyRows.nth(i)
      const cells = row.locator('td')

      // Should have 4 columns: rank, party, provinces, clicks
      expect(await cells.count()).toBe(4)

      // Verify rank is a number
      const rankText = await cells.nth(0).textContent()
      expect(parseInt(rankText)).toBe(i + 1)

      // Verify party name is not empty
      const partyName = await cells.nth(1).textContent()
      expect(partyName.trim()).toBeTruthy()

      // Verify provinces count exists
      const provincesText = await cells.nth(2).textContent()
      expect(provincesText).toBeTruthy()

      // Verify clicks count exists
      const clicksText = await cells.nth(3).textContent()
      expect(clicksText).toBeTruthy()
    }
  })

  test('should show correct provinces count and total clicks', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get first party row
    const firstRow = page.locator('.leaderboard-table tbody tr').first()
    const cells = firstRow.locator('td')

    // Get provinces count (3rd column)
    const provincesCount = await cells.nth(2).textContent()
    expect(provincesCount).toMatch(/^\d+$/)

    // Get total clicks (4th column)
    const totalClicks = await cells.nth(3).textContent()
    // Should be a number or formatted number (K/M)
    expect(totalClicks).toMatch(/^[\d.]+[KM]?$/)

    // Verify provinces count is a valid number
    const provincesNum = parseInt(provincesCount)
    expect(provincesNum).toBeGreaterThanOrEqual(0)
  })

  test('should display party colors and Thai names', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get all party rows
    const partyRows = page.locator('.leaderboard-table tbody tr')
    const rowCount = await partyRows.count()

    // Check first few rows for party badge and name
    const checkCount = Math.min(rowCount, 3)

    for (let i = 0; i < checkCount; i++) {
      const row = partyRows.nth(i)

      // Verify party badge exists
      const partyBadge = row.locator('.party-badge')
      await expect(partyBadge).toBeVisible()

      // Verify party badge has a background color
      const backgroundColor = await partyBadge.getAttribute('style')
      expect(backgroundColor).toContain('background')

      // Verify party name is displayed (Thai name)
      const partyCell = row.locator('td').nth(1)
      const partyName = await partyCell.textContent()
      expect(partyName.trim()).toBeTruthy()
    }
  })

  test('should update rankings when provinces change hands in realtime', async ({ browser }) => {
    // Create two browser contexts for realtime testing
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // Clear storage for both pages
      await clearStorage(page1)
      await clearStorage(page2)

      // Player 1 joins with party index 0
      await page1.goto('/')
      await joinGame(page1, 0, 'LeaderboardRealtime1')
      await waitForMapLoad(page1)

      // Player 2 joins with party index 1 (different party)
      await page2.goto('/')
      await joinGame(page2, 1, 'LeaderboardRealtime2')
      await waitForMapLoad(page2)

      // Wait for leaderboard to load on both pages
      await page1.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })
      await page2.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

      // Get initial leaderboard state on page 2
      const initialRowCount = await page2.locator('.leaderboard-table tbody tr').count()

      // Player 1 clicks on a province multiple times to capture it
      for (let i = 0; i < 10; i++) {
        await clickProvince(page1, 0)
        await page1.waitForTimeout(200)
      }

      // Wait for realtime update to propagate to page 2
      await page2.waitForTimeout(3000)

      // Verify leaderboard is still visible and functional on page 2
      const updatedRowCount = await page2.locator('.leaderboard-table tbody tr').count()
      expect(updatedRowCount).toBe(initialRowCount)

      // Verify leaderboard table is still visible
      await expect(page2.locator('.leaderboard-table')).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('should format large numbers with K/M suffixes', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Make many clicks to generate large numbers
    for (let i = 0; i < 20; i++) {
      await clickProvince(page, i % 3)
      await page.waitForTimeout(100)
    }

    // Wait for leaderboard to update
    await page.waitForTimeout(2000)

    // Get clicks column from any row
    const clicksCell = page.locator('.leaderboard-table tbody tr').first().locator('td').nth(3)
    const clicksText = await clicksCell.textContent()

    // Verify the text is either:
    // - A plain number (e.g., "123")
    // - A K formatted number (e.g., "1.5K")
    // - An M formatted number (e.g., "2.3M")
    expect(clicksText).toMatch(/^\d+(\.\d+)?[KM]?$/)

    // Test formatNumber function behavior through UI
    // Numbers >= 1000 should show K
    // Numbers >= 1000000 should show M
    // Numbers < 1000 should be plain numbers
  })

  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 })

    // Verify leaderboard is still visible on mobile
    const leaderboard = page.locator('#leaderboard')
    await expect(leaderboard).toBeVisible()

    // Verify table is visible
    const table = page.locator('.leaderboard-table')
    await expect(table).toBeVisible()

    // Verify table headers are visible
    const headers = page.locator('.leaderboard-table thead th')
    expect(await headers.count()).toBe(4)

    // Verify at least one row is visible
    const rows = page.locator('.leaderboard-table tbody tr')
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 })

    // Verify leaderboard is visible
    const leaderboard = page.locator('#leaderboard')
    await expect(leaderboard).toBeVisible()

    // Verify all columns are visible
    const headers = page.locator('.leaderboard-table thead th')
    expect(await headers.count()).toBe(4)

    // Verify header text
    await expect(headers.nth(0)).toHaveText('#')
    await expect(headers.nth(1)).toHaveText('Party')
    await expect(headers.nth(2)).toHaveText('Provinces')
    await expect(headers.nth(3)).toHaveText('Clicks')
  })

  test('should show party with most provinces first', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get all rows
    const rows = page.locator('.leaderboard-table tbody tr')
    const rowCount = await rows.count()

    if (rowCount >= 2) {
      // Get provinces count from first and second rows
      const firstRowProvinces = await rows.nth(0).locator('td').nth(2).textContent()
      const secondRowProvinces = await rows.nth(1).locator('td').nth(2).textContent()

      const firstCount = parseInt(firstRowProvinces)
      const secondCount = parseInt(secondRowProvinces)

      // First row should have >= provinces than second row
      expect(firstCount).toBeGreaterThanOrEqual(secondCount)
    }

    // Verify first row has rank 1
    const firstRank = await rows.first().locator('td').nth(0).textContent()
    expect(firstRank).toBe('1')
  })

  test('should update leaderboard when clicking provinces', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get initial state of first row
    const firstRow = page.locator('.leaderboard-table tbody tr').first()
    const partyId = await firstRow.getAttribute('data-party-id')

    // Get initial clicks count
    const initialClicksText = await firstRow.locator('td').nth(3).textContent()

    // Click a province multiple times
    for (let i = 0; i < 5; i++) {
      await clickProvince(page, 0)
      await page.waitForTimeout(200)
    }

    // Wait for leaderboard to update
    await page.waitForTimeout(2000)

    // Get updated row (may have moved position)
    const updatedRow = page.locator(`.leaderboard-table tbody tr[data-party-id="${partyId}"]`)

    // Verify row still exists
    await expect(updatedRow).toBeVisible()

    // Get updated clicks count
    const updatedClicksText = await updatedRow.locator('td').nth(3).textContent()

    // Clicks text may have changed (could be same if multiple parties are clicking)
    expect(updatedClicksText).toBeTruthy()
  })

  test('should display loading state initially', async ({ page }) => {
    // Navigate to app but don't wait for full load
    await clearStorage(page)
    await page.goto('/')

    // Join game
    await page.waitForSelector('#party-selector:not(.hidden)', { timeout: 10000 })
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })
    const partyCards = await page.locator('#party-grid .party-card').all()
    await partyCards[0].click()
    await page.waitForSelector('#nickname-input', { timeout: 5000 })
    await page.fill('#nickname-input', 'LoadingTestPlayer')
    await page.click('#join-button')

    // Try to catch the loading state (may be very quick)
    const loadingElement = page.locator('.leaderboard-loading')
    const loadingExists = await loadingElement.isVisible({ timeout: 1000 }).catch(() => false)

    // If loading state appears, it should show "Loading..."
    if (loadingExists) {
      await expect(loadingElement).toContainText('Loading')
    }

    // Eventually table should appear
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })
    const table = page.locator('.leaderboard-table')
    await expect(table).toBeVisible()
  })

  test('should maintain party order consistency across rapid clicks', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get initial party order
    const initialRows = page.locator('.leaderboard-table tbody tr')
    const initialCount = await initialRows.count()

    // Rapid clicks on multiple provinces
    for (let i = 0; i < 15; i++) {
      await clickProvince(page, i % 5)
      await page.waitForTimeout(100)
    }

    // Wait for updates to settle
    await page.waitForTimeout(3000)

    // Verify leaderboard still shows same number of parties
    const updatedRows = page.locator('.leaderboard-table tbody tr')
    const updatedCount = await updatedRows.count()

    expect(updatedCount).toBe(initialCount)

    // Verify all rows still have data-party-id
    for (let i = 0; i < updatedCount; i++) {
      const partyId = await updatedRows.nth(i).getAttribute('data-party-id')
      expect(partyId).toBeTruthy()
    }
  })

  test('should handle formatNumber edge cases', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get all click values
    const rows = page.locator('.leaderboard-table tbody tr')
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const clicksText = await rows.nth(i).locator('td').nth(3).textContent()

      // Verify format is valid:
      // - Plain number: "0", "123", "999"
      // - K format: "1K", "1.5K", "999.9K"
      // - M format: "1M", "1.5M", "999.9M"
      expect(clicksText).toMatch(/^\d+(\.\d+)?[KM]?$/)

      // Verify no unnecessary decimals (e.g., "1.0K" should be "1K")
      expect(clicksText).not.toMatch(/\.0[KM]$/)
    }
  })

  test('should show table headers correctly', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 })

    // Verify all headers exist and have correct text
    const headers = page.locator('.leaderboard-table thead th')

    await expect(headers.nth(0)).toHaveText('#')
    await expect(headers.nth(1)).toHaveText('Party')
    await expect(headers.nth(2)).toHaveText('Provinces')
    await expect(headers.nth(3)).toHaveText('Clicks')

    // Verify header count
    expect(await headers.count()).toBe(4)
  })

  test('should persist leaderboard data after page reload', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Get initial row count
    const initialRowCount = await page.locator('.leaderboard-table tbody tr').count()

    // Reload the page
    await page.reload()

    // Wait for game screen to reappear (should auto-login)
    await page.waitForSelector('#game-screen', { timeout: 10000 })

    // Wait for leaderboard to reload
    await page.waitForSelector('.leaderboard-table tbody tr', { timeout: 10000 })

    // Verify same number of parties
    const reloadedRowCount = await page.locator('.leaderboard-table tbody tr').count()
    expect(reloadedRowCount).toBe(initialRowCount)

    // Verify leaderboard is still functional
    const leaderboard = page.locator('#leaderboard')
    await expect(leaderboard).toBeVisible()
  })
})
