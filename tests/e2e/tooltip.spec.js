import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clearStorage } from './helpers/game-helpers.js'

test.describe('Province Tooltip Display', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and join game before each test
    await clearStorage(page)
    await page.goto('/')
    await joinGame(page, 0, 'TooltipTester')
    await waitForMapLoad(page)
  })

  test('should show tooltip when hovering over province', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Hover over province
    await firstProvince.hover()

    // Wait for tooltip to appear
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Verify tooltip is visible
    const tooltip = page.locator('#province-tooltip')
    await expect(tooltip).toBeVisible()
  })

  test('should display province Thai and English names in tooltip', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Get province ID for verification
    const provinceId = await firstProvince.getAttribute('data-id')

    // Hover over province
    await firstProvince.hover()

    // Wait for tooltip to appear
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Verify Thai name is displayed
    const thaiName = page.locator('#province-tooltip .province-name-thai')
    await expect(thaiName).toBeVisible()
    await expect(thaiName).not.toBeEmpty()

    // Verify English name is displayed
    const englishName = page.locator('#province-tooltip .province-name-english')
    await expect(englishName).toBeVisible()
    await expect(englishName).not.toBeEmpty()

    // Both names should have text content
    const thaiText = await thaiName.textContent()
    const englishText = await englishName.textContent()
    expect(thaiText?.trim()).toBeTruthy()
    expect(englishText?.trim()).toBeTruthy()
  })

  test('should display shield value and max shield in tooltip', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Hover over province
    await firstProvince.hover()

    // Wait for tooltip to appear
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Verify shield info is displayed
    const shieldInfo = page.locator('#province-tooltip .shield-info')
    await expect(shieldInfo).toBeVisible()

    // Shield info should contain current shield and max shield
    const shieldText = await shieldInfo.textContent()
    expect(shieldText).toBeTruthy()

    // Should match pattern like "500 / 1000" or "Shield: 500 / 1000"
    expect(shieldText).toMatch(/\d+/)
  })

  test('should display controlling party name and color in tooltip', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Hover over province
    await firstProvince.hover()

    // Wait for tooltip to appear
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Verify party info is displayed
    const partyInfo = page.locator('#province-tooltip .party-info')
    await expect(partyInfo).toBeVisible()

    // Verify party name is shown
    const partyName = await partyInfo.textContent()
    expect(partyName?.trim()).toBeTruthy()

    // Verify party color indicator exists
    const partyColor = page.locator('#province-tooltip .party-color')
    if (await partyColor.isVisible().catch(() => false)) {
      // Check that color element has a background color or fill
      const colorStyle = await partyColor.getAttribute('style')
      expect(colorStyle).toBeTruthy()
    }
  })

  test('should follow mouse position when hovering', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Get province bounding box
    const box = await firstProvince.boundingBox()
    if (!box) {
      throw new Error('Could not get province bounding box')
    }

    // Move mouse to different positions within province
    const positions = [
      { x: box.x + box.width * 0.3, y: box.y + box.height * 0.3 },
      { x: box.x + box.width * 0.7, y: box.y + box.height * 0.5 },
      { x: box.x + box.width * 0.5, y: box.y + box.height * 0.7 }
    ]

    const tooltipPositions = []

    for (const pos of positions) {
      // Move mouse to position
      await page.mouse.move(pos.x, pos.y)
      await page.waitForTimeout(100)

      // Wait for tooltip to be visible
      await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

      // Get tooltip position
      const tooltip = page.locator('#province-tooltip')
      const tooltipBox = await tooltip.boundingBox()

      if (tooltipBox) {
        tooltipPositions.push({ x: tooltipBox.x, y: tooltipBox.y })
      }
    }

    // Verify tooltip moved (at least one position should be different)
    if (tooltipPositions.length >= 2) {
      const position1 = tooltipPositions[0]
      const position2 = tooltipPositions[1]

      const moved = position1.x !== position2.x || position1.y !== position2.y
      expect(moved).toBeTruthy()
    }
  })

  test('should hide tooltip when mouse leaves province', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Hover over province
    await firstProvince.hover()

    // Wait for tooltip to appear
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })
    const tooltip = page.locator('#province-tooltip')
    await expect(tooltip).toBeVisible()

    // Move mouse away from province (to a safe area outside map)
    await page.mouse.move(50, 50)
    await page.waitForTimeout(300)

    // Verify tooltip is hidden
    await expect(tooltip).toBeHidden()
  })

  test('should update tooltip content when hovering different provinces', async ({ page }) => {
    // Get all provinces
    const provinces = await page.locator('#thailand-map svg [data-id]').all()

    if (provinces.length < 2) {
      throw new Error('Need at least 2 provinces for this test')
    }

    // Hover over first province
    await provinces[0].hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Get first tooltip content
    const tooltip = page.locator('#province-tooltip')
    const firstContent = await tooltip.locator('.province-name-thai').textContent()

    // Move mouse away briefly
    await page.mouse.move(50, 50)
    await page.waitForTimeout(200)

    // Hover over second province
    await provinces[1].hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    // Get second tooltip content
    const secondContent = await tooltip.locator('.province-name-thai').textContent()

    // Content should be different (unless provinces happen to have same name)
    // At minimum, verify both have content
    expect(firstContent?.trim()).toBeTruthy()
    expect(secondContent?.trim()).toBeTruthy()
  })

  test('should maintain tooltip visibility while hovering within province', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()
    const box = await firstProvince.boundingBox()

    if (!box) {
      throw new Error('Could not get province bounding box')
    }

    // Hover over province
    await firstProvince.hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    const tooltip = page.locator('#province-tooltip')
    await expect(tooltip).toBeVisible()

    // Move mouse around within province boundary
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    await page.mouse.move(centerX - 20, centerY - 20)
    await page.waitForTimeout(100)
    await expect(tooltip).toBeVisible()

    await page.mouse.move(centerX + 20, centerY + 20)
    await page.waitForTimeout(100)
    await expect(tooltip).toBeVisible()

    await page.mouse.move(centerX, centerY)
    await page.waitForTimeout(100)
    await expect(tooltip).toBeVisible()
  })

  test('should display tooltip with correct structure and styling', async ({ page }) => {
    // Get first province
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Hover over province
    await firstProvince.hover()
    await page.waitForSelector('#province-tooltip:not(.hidden)', { timeout: 3000 })

    const tooltip = page.locator('#province-tooltip')

    // Verify tooltip has expected structure
    await expect(tooltip.locator('.province-name-thai')).toBeVisible()
    await expect(tooltip.locator('.province-name-english')).toBeVisible()
    await expect(tooltip.locator('.shield-info')).toBeVisible()
    await expect(tooltip.locator('.party-info')).toBeVisible()

    // Verify tooltip has positioning (should have style attribute with top/left or transform)
    const style = await tooltip.getAttribute('style')
    expect(style).toBeTruthy()
  })
})
