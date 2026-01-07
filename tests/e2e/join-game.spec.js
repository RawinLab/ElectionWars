import { test, expect } from '@playwright/test'
import { joinGame, getPlayerInfo, getSelectedParty, clearStorage } from './helpers/game-helpers.js'

test.describe('Join Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to start fresh
    await clearStorage(page)

    // Navigate to the application
    await page.goto('/')
  })

  test('should display party selector on initial load', async ({ page }) => {
    // Verify party selector is visible
    await expect(page.locator('#party-selector')).toBeVisible()
    await expect(page.locator('#game-screen')).not.toBeVisible()

    // Verify party grid is loaded with party cards
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })
    const partyCards = await page.locator('#party-grid .party-card').count()
    expect(partyCards).toBeGreaterThan(0)
  })

  test('should show nickname input after selecting a party', async ({ page }) => {
    // Wait for party cards to load
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

    // Click on the first party card
    const firstPartyCard = page.locator('#party-grid .party-card').first()
    await firstPartyCard.click()

    // Verify nickname input section appears
    await expect(page.locator('#selected-party')).toBeVisible()
    await expect(page.locator('#nickname-input')).toBeVisible()
    await expect(page.locator('#join-button')).toBeVisible()

    // Verify party preview is shown
    await expect(page.locator('#party-preview .selected-party-name h3')).toBeVisible()
  })

  test('should validate nickname input', async ({ page }) => {
    // Wait for party cards to load
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

    // Select a party
    await page.locator('#party-grid .party-card').first().click()
    await page.waitForSelector('#nickname-input', { timeout: 5000 })

    // Test empty nickname (should be invalid)
    await page.fill('#nickname-input', '')
    const joinButton = page.locator('#join-button')
    await expect(joinButton).toBeDisabled()

    // Test too short nickname
    await page.fill('#nickname-input', 'ab')
    await expect(page.locator('#nickname-error')).toBeVisible()
    await expect(joinButton).toBeDisabled()

    // Test valid nickname
    await page.fill('#nickname-input', 'ValidPlayer')
    await expect(page.locator('#nickname-error')).not.toBeVisible()
    await expect(joinButton).not.toBeDisabled()

    // Test too long nickname
    await page.fill('#nickname-input', 'ThisIsAVeryLongNicknameThatExceedsLimit')
    await expect(page.locator('#nickname-error')).toBeVisible()
    await expect(joinButton).toBeDisabled()
  })

  test('should join game and show game screen with correct player info', async ({ page }) => {
    const testNickname = 'E2ETestPlayer'

    // Join the game
    await joinGame(page, 0, testNickname)

    // Verify game screen is shown
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('#party-selector')).not.toBeVisible()

    // Verify player info displays correct nickname
    const playerInfo = await getPlayerInfo(page)
    expect(playerInfo.nickname).toBe(testNickname)
    expect(playerInfo.party).toBeTruthy()

    // Verify game components are loaded
    await expect(page.locator('#thailand-map')).toBeVisible()
    await expect(page.locator('#player-info')).toBeVisible()
  })

  test('should display selected party information correctly', async ({ page }) => {
    // Wait for party cards to load
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

    // Get party name from the first card
    const firstPartyCard = page.locator('#party-grid .party-card').first()
    const partyNameThai = await firstPartyCard.locator('.party-info h3').textContent()
    const partyNameEnglish = await firstPartyCard.locator('.party-info p').textContent()

    // Click on the party
    await firstPartyCard.click()

    // Verify party preview shows the same party
    const selectedParty = await getSelectedParty(page)
    expect(selectedParty.nameThai).toBe(partyNameThai?.trim())
    expect(selectedParty.nameEnglish).toBe(partyNameEnglish?.trim())
  })

  test('should persist session after joining game', async ({ page }) => {
    const testNickname = 'SessionTestPlayer'

    // Join the game
    await joinGame(page, 0, testNickname)

    // Verify game screen is shown
    await expect(page.locator('#game-screen')).toBeVisible()

    // Reload the page
    await page.reload()

    // Verify user is still logged in (game screen should appear directly)
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#party-selector')).not.toBeVisible()

    // Verify player info is still correct
    const playerInfo = await getPlayerInfo(page)
    expect(playerInfo.nickname).toBe(testNickname)
  })

  test('should highlight selected party card', async ({ page }) => {
    // Wait for party cards to load
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

    // Get all party cards
    const partyCards = page.locator('#party-grid .party-card')
    const firstCard = partyCards.first()

    // Click on the first party
    await firstCard.click()

    // Verify the card has the 'selected' class
    await expect(firstCard).toHaveClass(/selected/)

    // Verify other cards are not selected
    const secondCard = partyCards.nth(1)
    await expect(secondCard).not.toHaveClass(/selected/)
  })
})
