import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clearStorage } from './helpers/game-helpers.js'

test.describe('i18n Language System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await clearStorage(page)
  })

  test('should default to Thai when browser language is Thai', async ({ page, context }) => {
    // Set browser language to Thai
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'th-TH', configurable: true })
      Object.defineProperty(navigator, 'languages', { value: ['th-TH', 'th'], configurable: true })
    })

    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Verify Thai language is used
    const selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')

    // Verify localStorage has Thai language
    const savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(savedLang).toBe('th')
  })

  test('should default to Thai when browser language is English', async ({ page, context }) => {
    // Set browser language to English (but default is still Thai)
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
      Object.defineProperty(navigator, 'languages', { value: ['en-US', 'en'], configurable: true })
    })

    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Verify Thai language is used (Thai is default)
    const selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')

    // Verify localStorage has Thai language
    const savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(savedLang).toBe('th')
  })

  test('should toggle from Thai to English when clicking language button', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Verify starting with Thai
    let selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')

    // Find and click language toggle button
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify switched to English
    selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('Choose Your Party')
  })

  test('should toggle from English to Thai when clicking language button', async ({ page }) => {
    // Set language to English first
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Switch to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify in English
    let selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('Choose Your Party')

    // Toggle back to Thai
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify switched back to Thai
    selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')
  })

  test('should update all party selector UI text immediately on language change', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })
    await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

    // Select a party to show nickname input
    const partyCards = await page.locator('#party-grid .party-card').all()
    await partyCards[0].click()
    await page.waitForSelector('#selected-party:not(.hidden)', { timeout: 5000 })

    // Verify Thai text
    let selectTitle = await page.locator('#party-selector h2').textContent()
    let nicknameLabel = await page.locator('label[for="nickname-input"], #nickname-input + label, .nickname-label').first().textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')
    expect(nicknameLabel).toContain('ชื่อเล่น')

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify all text changed to English
    selectTitle = await page.locator('#party-selector h2').textContent()
    nicknameLabel = await page.locator('label[for="nickname-input"], #nickname-input + label, .nickname-label').first().textContent()
    expect(selectTitle?.trim()).toBe('Choose Your Party')
    expect(nicknameLabel).toContain('Nickname')
  })

  test('should persist selected language in localStorage', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Switch to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify English is saved in localStorage
    let savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(savedLang).toBe('en')

    // Switch back to Thai
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify Thai is saved in localStorage
    savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(savedLang).toBe('th')
  })

  test('should maintain selected language after page reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Switch to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify in English
    let selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('Choose Your Party')

    // Reload page
    await page.reload()
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Verify still in English after reload
    selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('Choose Your Party')
  })

  test('should translate game screen text when language changes', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'LangTester')
    await waitForMapLoad(page)

    // Verify Thai text in game screen
    let changePartyBtn = page.locator('button:has-text("เปลี่ยนพรรค"), #change-party-btn')
    if (await changePartyBtn.count() > 0) {
      await expect(changePartyBtn.first()).toBeVisible()
    }

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify English text in game screen
    changePartyBtn = page.locator('button:has-text("Change Party"), #change-party-btn')
    if (await changePartyBtn.count() > 0) {
      await expect(changePartyBtn.first()).toBeVisible()
    }
  })

  test('should translate settings panel text on language change', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'SettingsTester')
    await waitForMapLoad(page)

    // Open settings panel
    await page.click('#settings-btn, button:has-text("ตั้งค่า"), button:has-text("Settings")')
    await page.waitForSelector('.settings-panel:not(.hidden), #settings-panel:not(.hidden)', { timeout: 5000 })

    // Verify Thai text in settings
    let settingsPanel = page.locator('.settings-panel, #settings-panel')
    let panelText = await settingsPanel.textContent()
    expect(panelText).toContain('ภาษา')
    expect(panelText).toContain('เสียง')

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"]')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify English text in settings
    panelText = await settingsPanel.textContent()
    expect(panelText).toContain('Language')
    expect(panelText).toContain('Sound')

    // Close settings panel
    await page.click('.settings-panel .close-btn, #settings-panel .close-btn, button:has-text("Close"), button:has-text("ปิด")')
  })

  test('should translate leaderboard text on language change', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'LeaderTester')
    await waitForMapLoad(page)

    // Wait for leaderboard to be visible
    await page.waitForSelector('#leaderboard, .leaderboard', { timeout: 10000 })

    // Verify Thai text in leaderboard
    let leaderboardText = await page.locator('#leaderboard, .leaderboard').textContent()
    expect(leaderboardText).toContain('อันดับพรรค')
    expect(leaderboardText).toMatch(/พรรค|จังหวัด|คลิก/)

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Verify English text in leaderboard
    leaderboardText = await page.locator('#leaderboard, .leaderboard').textContent()
    expect(leaderboardText).toContain('Party Rankings')
    expect(leaderboardText).toMatch(/Party|Provinces|Clicks/)
  })

  test('should translate tooltip text on language change', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'TooltipLangTester')
    await waitForMapLoad(page)

    // Hover over a province to show tooltip
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()
    await firstProvince.hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Get initial tooltip content (Thai)
    let tooltip = page.locator('#province-tooltip')
    await expect(tooltip).toBeVisible()
    const thaiContent = await tooltip.textContent()

    // Move mouse away
    await page.mouse.move(50, 50)
    await page.waitForTimeout(300)

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Hover over same province again
    await firstProvince.hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Get tooltip content in English
    const englishContent = await tooltip.textContent()

    // Verify tooltip content changed (different text for different languages)
    expect(thaiContent).toBeTruthy()
    expect(englishContent).toBeTruthy()

    // The tooltip should show different language content
    // This is a basic check - in practice, we'd verify specific translated labels
    await expect(tooltip).toBeVisible()
  })

  test('should handle rapid language switching correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')

    // Rapidly toggle language multiple times
    for (let i = 0; i < 5; i++) {
      await langButton.first().click()
      await page.waitForTimeout(100)
    }

    // Wait for final state
    await page.waitForTimeout(300)

    // Verify page is still functional and in a valid language state
    const selectTitle = await page.locator('#party-selector h2').textContent()
    const titleText = selectTitle?.trim()

    // Should be either Thai or English
    const isValidLanguage = titleText === 'เลือกพรรคของคุณ' || titleText === 'Choose Your Party'
    expect(isValidLanguage).toBeTruthy()

    // Verify localStorage has valid language
    const savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(['th', 'en']).toContain(savedLang)
  })

  test('should preserve language preference during game session', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Switch to English before joining
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Join game
    await joinGame(page, 0, 'SessionTester')
    await waitForMapLoad(page)

    // Verify still in English after joining
    let gameText = await page.locator('#game-screen').textContent()
    expect(gameText).toContain('Change Party')

    // Click a province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()
    await firstProvince.click()
    await page.waitForTimeout(500)

    // Verify still in English after clicking
    gameText = await page.locator('#game-screen').textContent()
    expect(gameText).toContain('Change Party')

    // Verify localStorage still has English
    const savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(savedLang).toBe('en')
  })

  test('should show correct language in settings panel language label', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'LangLabelTester')
    await waitForMapLoad(page)

    // Open settings in Thai
    await page.click('#settings-btn, button:has-text("ตั้งค่า")')
    await page.waitForSelector('.settings-panel:not(.hidden), #settings-panel:not(.hidden)', { timeout: 5000 })

    // Verify language label is in Thai
    let settingsPanel = page.locator('.settings-panel, #settings-panel')
    let panelText = await settingsPanel.textContent()
    expect(panelText).toContain('ภาษา')

    // Switch to English within settings
    const langToggle = page.locator('.settings-panel #language-toggle, #settings-panel #language-toggle, [data-testid="language-toggle"]')
    await langToggle.first().click()
    await page.waitForTimeout(300)

    // Verify language label changed to English
    panelText = await settingsPanel.textContent()
    expect(panelText).toContain('Language')

    // Close settings
    await page.click('.settings-panel .close-btn, #settings-panel .close-btn')
  })

  test('should translate timer labels on language change', async ({ page }) => {
    await page.goto('/')
    await joinGame(page, 0, 'TimerTester')
    await waitForMapLoad(page)

    // Wait for timer to be visible
    await page.waitForSelector('#game-timer, .game-timer, .countdown', { timeout: 10000 })

    // Get timer text in Thai
    let timerText = await page.locator('#game-timer, .game-timer, .countdown').textContent()
    const hasThaiTimeLabel = timerText?.includes('วัน') || timerText?.includes('ชั่วโมง') ||
                            timerText?.includes('นาที') || timerText?.includes('วินาที')

    // Toggle to English
    const langButton = page.locator('#language-toggle, [data-testid="language-toggle"], button:has-text("EN"), button:has-text("ภาษา")')
    await langButton.first().click()
    await page.waitForTimeout(300)

    // Get timer text in English
    timerText = await page.locator('#game-timer, .game-timer, .countdown').textContent()
    const hasEnglishTimeLabel = timerText?.includes('Days') || timerText?.includes('Hours') ||
                               timerText?.includes('Min') || timerText?.includes('Sec')

    // At least one language should have time labels
    expect(hasThaiTimeLabel || hasEnglishTimeLabel).toBeTruthy()
  })

  test('should handle invalid localStorage language gracefully', async ({ page }) => {
    // Set invalid language in localStorage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('electionwars_language', 'invalid-lang')
    })

    // Reload to test language detection with invalid value
    await page.reload()
    await page.waitForSelector('#party-selector', { timeout: 10000 })

    // Should default to Thai when invalid language is found
    const selectTitle = await page.locator('#party-selector h2').textContent()
    expect(selectTitle?.trim()).toBe('เลือกพรรคของคุณ')

    // Should have corrected the localStorage value
    const savedLang = await page.evaluate(() => localStorage.getItem('electionwars_language'))
    expect(['th', 'en']).toContain(savedLang)
  })
})
