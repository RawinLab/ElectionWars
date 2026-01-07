/**
 * Helper functions for E2E tests
 */

/**
 * Join the game with a specified party and nickname
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} partyIndex - Index of party card to select (0-based)
 * @param {string} nickname - Player nickname
 */
export async function joinGame(page, partyIndex = 0, nickname = 'TestPlayer') {
  // Wait for party selector to be visible
  await page.waitForSelector('#party-selector:not(.hidden)', { timeout: 10000 })

  // Wait for party grid to load
  await page.waitForSelector('#party-grid .party-card', { timeout: 10000 })

  // Select a party by clicking on the card
  const partyCards = await page.locator('#party-grid .party-card').all()
  if (partyCards.length === 0) {
    throw new Error('No party cards found')
  }

  await partyCards[partyIndex].click()

  // Wait for nickname input to appear
  await page.waitForSelector('#selected-party:not(.hidden)', { timeout: 5000 })
  await page.waitForSelector('#nickname-input', { timeout: 5000 })

  // Enter nickname
  await page.fill('#nickname-input', nickname)

  // Click join button
  await page.click('#join-button')

  // Wait for game screen to appear
  await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 })
  await page.waitForSelector('#player-info', { timeout: 5000 })
}

/**
 * Wait for map to be fully loaded
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForMapLoad(page) {
  // Wait for the map container to be visible
  await page.waitForSelector('#thailand-map', { timeout: 10000 })

  // Wait for SVG to be loaded (map implementation specific)
  await page.waitForSelector('#thailand-map svg', { timeout: 10000 })

  // Wait for at least one province element
  await page.waitForSelector('#thailand-map svg [data-id]', { timeout: 10000 })
}

/**
 * Get player info from the header
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{nickname: string, party: string}>}
 */
export async function getPlayerInfo(page) {
  const nickname = await page.locator('#player-info .player-name').textContent()
  const party = await page.locator('#player-info .player-party').textContent()

  return {
    nickname: nickname?.trim() || '',
    party: party?.trim() || ''
  }
}

/**
 * Click on a province by index
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} provinceIndex - Index of province to click (0-based)
 */
export async function clickProvince(page, provinceIndex = 0) {
  const provinces = await page.locator('#thailand-map svg [data-id]').all()

  if (provinces.length === 0) {
    throw new Error('No provinces found on map')
  }

  if (provinceIndex >= provinces.length) {
    throw new Error(`Province index ${provinceIndex} out of range (max: ${provinces.length - 1})`)
  }

  await provinces[provinceIndex].click()
}

/**
 * Get the currently selected party from the party selector
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<{nameThai: string, nameEnglish: string}>}
 */
export async function getSelectedParty(page) {
  const nameThai = await page.locator('#party-preview .selected-party-name h3').textContent()
  const nameEnglish = await page.locator('#party-preview .selected-party-name p').textContent()

  return {
    nameThai: nameThai?.trim() || '',
    nameEnglish: nameEnglish?.trim() || ''
  }
}

/**
 * Check if sound is enabled
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isSoundEnabled(page) {
  // Check localStorage for sound setting
  const soundEnabled = await page.evaluate(() => {
    const settings = localStorage.getItem('election-wars-settings')
    if (!settings) return true // Default is enabled
    return JSON.parse(settings).soundEnabled !== false
  })

  return soundEnabled
}

/**
 * Toggle sound setting
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function toggleSound(page) {
  // Open settings panel
  await page.click('#settings-btn')

  // Wait for settings panel to open
  await page.waitForSelector('.settings-panel:not(.hidden)', { timeout: 5000 })

  // Click sound toggle
  await page.click('#sound-toggle')

  // Close settings panel
  await page.click('.settings-panel .close-btn')
}

/**
 * Clear all browser storage (localStorage, sessionStorage, cookies)
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
}
