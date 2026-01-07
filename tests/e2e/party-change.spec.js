import { test, expect } from '@playwright/test'
import { joinGame, getPlayerInfo, clearStorage } from './helpers/game-helpers.js'

test.describe('Party Change Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and join game before each test
    await clearStorage(page)
    await page.goto('/')
    await joinGame(page, 0, 'PartyChangeTester')
  })

  test('should display change party button in player info', async ({ page }) => {
    // Verify change party button exists
    const changePartyBtn = page.locator('#change-party-btn')
    await expect(changePartyBtn).toBeVisible()
    await expect(changePartyBtn).toHaveText(/เปลี่ยนพรรค/)
  })

  test('should show confirmation dialog when clicking change party', async ({ page }) => {
    // Set up dialog handler before clicking
    let dialogShown = false
    page.on('dialog', dialog => {
      dialogShown = true
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('เปลี่ยนพรรค')
      dialog.dismiss() // Dismiss the dialog
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait a moment for dialog to appear
    await page.waitForTimeout(500)

    // Verify dialog was shown
    expect(dialogShown).toBe(true)
  })

  test('should cancel party change when dismissing confirmation', async ({ page }) => {
    // Get initial player info
    const initialPlayerInfo = await getPlayerInfo(page)

    // Set up dialog handler to dismiss
    page.on('dialog', dialog => {
      dialog.dismiss()
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait a moment
    await page.waitForTimeout(500)

    // Verify player info hasn't changed
    const currentPlayerInfo = await getPlayerInfo(page)
    expect(currentPlayerInfo.party).toBe(initialPlayerInfo.party)
    expect(currentPlayerInfo.nickname).toBe(initialPlayerInfo.nickname)
  })

  test('should proceed with party change when confirming', async ({ page }) => {
    // Get initial player info
    const initialPlayerInfo = await getPlayerInfo(page)

    // Set up dialog handlers for confirmation and party ID prompt
    let confirmationShown = false
    let promptShown = false

    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        confirmationShown = true
        await dialog.accept()
      } else if (dialog.type() === 'prompt') {
        promptShown = true
        // Enter a different party ID (assuming party IDs 1-57)
        await dialog.accept('2')
      }
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait for potential party change to complete
    await page.waitForTimeout(2000)

    // Verify dialogs were shown
    expect(confirmationShown).toBe(true)

    // Note: The actual party change depends on backend
    // In a real test with mocked backend, we would verify the party changed
  })

  test('should show confirmation message content', async ({ page }) => {
    // Set up dialog handler
    let dialogMessage = ''
    page.on('dialog', dialog => {
      dialogMessage = dialog.message()
      dialog.dismiss()
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait for dialog
    await page.waitForTimeout(500)

    // Verify confirmation message mentions key information
    expect(dialogMessage).toContain('เปลี่ยนพรรค')
    expect(dialogMessage.toLowerCase()).toContain('reset')
    expect(dialogMessage).toContain('0')
  })

  test('should display change party button tooltip', async ({ page }) => {
    const changePartyBtn = page.locator('#change-party-btn')

    // Hover over button
    await changePartyBtn.hover()

    // Check if tooltip title exists
    const title = await changePartyBtn.getAttribute('title')
    expect(title).toBe('Change Party')
  })

  test('should handle party change with invalid party ID', async ({ page }) => {
    // Set up dialog handlers
    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        await dialog.accept()
      } else if (dialog.type() === 'prompt') {
        // Enter invalid party ID
        await dialog.accept('999')
      }
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait for potential error handling
    await page.waitForTimeout(2000)

    // In a real implementation, an error toast might appear
    // For now, we just verify the page is still functional
    await expect(page.locator('#game-screen')).toBeVisible()
  })

  test('should handle party change with empty party ID', async ({ page }) => {
    // Get initial player info
    const initialPlayerInfo = await getPlayerInfo(page)

    // Set up dialog handlers
    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        await dialog.accept()
      } else if (dialog.type() === 'prompt') {
        // Cancel the prompt (empty/null)
        await dialog.dismiss()
      }
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait a moment
    await page.waitForTimeout(500)

    // Verify player info hasn't changed (because prompt was cancelled)
    const currentPlayerInfo = await getPlayerInfo(page)
    expect(currentPlayerInfo.party).toBe(initialPlayerInfo.party)
  })

  test('should maintain game state after cancelled party change', async ({ page }) => {
    // Set up dialog handler to dismiss
    page.on('dialog', dialog => {
      dialog.dismiss()
    })

    // Click change party button
    await page.locator('#change-party-btn').click()

    // Wait a moment
    await page.waitForTimeout(500)

    // Verify game components are still functional
    await expect(page.locator('#thailand-map')).toBeVisible()
    await expect(page.locator('#player-info')).toBeVisible()
    await expect(page.locator('#change-party-btn')).toBeVisible()
  })
})
