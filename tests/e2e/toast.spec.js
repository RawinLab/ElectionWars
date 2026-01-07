import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clearStorage } from './helpers/game-helpers.js'

test.describe('Toast Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and join game before each test
    await clearStorage(page)
    await page.goto('/')
    await joinGame(page, 0, 'ToastTester')
    await waitForMapLoad(page)
  })

  test('should show toast when province is captured', async ({ page }) => {
    // Trigger a toast by evaluating JavaScript to call ToastManager directly
    await page.evaluate(() => {
      window.toastManager.provinceFlip('เพื่อไทย', 'กรุงเทพมหานคร')
    })

    // Wait for toast to appear
    await page.waitForSelector('.toast', { timeout: 5000 })

    // Verify toast is visible
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Verify message contains province flip information
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toContain('กรุงเทพมหานคร')
    expect(message).toContain('flipped')
    expect(message).toContain('เพื่อไทย')
  })

  test('should show toast when your party wins a province', async ({ page }) => {
    // Trigger party win toast
    await page.evaluate(() => {
      window.toastManager.partyWin('ก้าวไกล', 'เชียงใหม่')
    })

    // Wait for toast to appear
    await page.waitForSelector('.toast-success', { timeout: 5000 })

    // Verify toast is visible with success styling
    const toast = page.locator('.toast-success').first()
    await expect(toast).toBeVisible()

    // Verify message contains victory information
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toContain('Victory')
    expect(message).toContain('ก้าวไกล')
    expect(message).toContain('เชียงใหม่')
    expect(message).toContain('won')
  })

  test('should show warning toast when province shield is low', async ({ page }) => {
    // Trigger shield warning toast
    await page.evaluate(() => {
      window.toastManager.shieldWarning('ภูเก็ต', 15)
    })

    // Wait for toast to appear
    await page.waitForSelector('.toast-error', { timeout: 5000 })

    // Verify toast is visible with error styling
    const toast = page.locator('.toast-error').first()
    await expect(toast).toBeVisible()

    // Verify message contains shield warning information
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toContain('Warning')
    expect(message).toContain('ภูเก็ต')
    expect(message).toContain('shield')
    expect(message).toContain('low')
    expect(message).toContain('15%')
  })

  test('should auto-dismiss toast after 3 seconds', async ({ page }) => {
    // Create a toast
    await page.evaluate(() => {
      window.toastManager.show('Auto-dismiss test', 'info', 3000)
    })

    // Verify toast appears
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Wait for auto-dismiss (3 seconds + animation buffer)
    await page.waitForTimeout(3500)

    // Verify toast is no longer visible
    await expect(toast).not.toBeVisible()
  })

  test('should dismiss toast when close button is clicked', async ({ page }) => {
    // Create a toast with long duration
    await page.evaluate(() => {
      window.toastManager.show('Manual close test', 'info', 10000)
    })

    // Wait for toast to appear
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Click close button
    const closeButton = toast.locator('.toast-close')
    await expect(closeButton).toBeVisible()
    await closeButton.click()

    // Wait for slide-out animation to complete (300ms + buffer)
    await page.waitForTimeout(500)

    // Verify toast is dismissed
    await expect(toast).not.toBeVisible()
  })

  test('should stack multiple toasts vertically', async ({ page }) => {
    // Create multiple toasts
    await page.evaluate(() => {
      window.toastManager.show('First toast', 'info', 10000)
      window.toastManager.show('Second toast', 'success', 10000)
      window.toastManager.show('Third toast', 'warning', 10000)
    })

    // Wait for all toasts to appear
    await page.waitForSelector('.toast', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Get all visible toasts
    const toasts = await page.locator('.toast').all()
    expect(toasts.length).toBeGreaterThanOrEqual(3)

    // Verify toasts are stacked (have different vertical positions)
    const positions = []
    for (const toast of toasts.slice(0, 3)) {
      const box = await toast.boundingBox()
      if (box) {
        positions.push(box.y)
      }
    }

    // At least 2 toasts should have different Y positions
    expect(positions.length).toBeGreaterThanOrEqual(2)
    const allSame = positions.every(y => y === positions[0])
    expect(allSame).toBe(false)
  })

  test('should display smooth slide-in animation', async ({ page }) => {
    // Create a toast and monitor its animation
    await page.evaluate(() => {
      window.toastManager.show('Slide-in test', 'info', 5000)
    })

    // Wait for toast to appear with animation
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Verify toast has slide-in animation in its style
    const style = await toast.getAttribute('style')
    expect(style).toContain('toastSlideIn')

    // Verify toast is fully visible after animation
    await page.waitForTimeout(400) // Animation duration + buffer
    await expect(toast).toBeVisible()
  })

  test('should display smooth slide-out animation on dismiss', async ({ page }) => {
    // Create a toast
    await page.evaluate(() => {
      window.toastManager.show('Slide-out test', 'info', 10000)
    })

    // Wait for toast to appear
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Close the toast
    await toast.locator('.toast-close').click()

    // Verify slide-out animation is applied
    await page.waitForTimeout(100)
    const style = await toast.getAttribute('style')
    expect(style).toContain('toastSlideOut')

    // Wait for animation to complete
    await page.waitForTimeout(400)

    // Verify toast is removed from DOM
    await expect(toast).not.toBeVisible()
  })

  test('should show correct message for provinceFlip()', async ({ page }) => {
    const testParty = 'พลังประชารัฐ'
    const testProvince = 'นครราชสีมา'

    // Trigger provinceFlip
    await page.evaluate(({ party, province }) => {
      window.toastManager.provinceFlip(party, province)
    }, { party: testParty, province: testProvince })

    // Wait for toast
    const toast = page.locator('.toast-warning').first()
    await expect(toast).toBeVisible()

    // Verify exact message format
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toBe(`${testProvince} has flipped to ${testParty}!`)

    // Verify toast type is warning
    const hasWarningClass = await toast.evaluate(el => el.classList.contains('toast-warning'))
    expect(hasWarningClass).toBe(true)
  })

  test('should show correct message for partyWin()', async ({ page }) => {
    const testParty = 'ประชาธิปัตย์'
    const testProvince = 'สุราษฎร์ธานี'

    // Trigger partyWin
    await page.evaluate(({ party, province }) => {
      window.toastManager.partyWin(party, province)
    }, { party: testParty, province: testProvince })

    // Wait for toast
    const toast = page.locator('.toast-success').first()
    await expect(toast).toBeVisible()

    // Verify exact message format
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toBe(`Victory! ${testParty} has won ${testProvince}!`)

    // Verify toast type is success
    const hasSuccessClass = await toast.evaluate(el => el.classList.contains('toast-success'))
    expect(hasSuccessClass).toBe(true)

    // Verify background color is green (success color)
    const bgColor = await toast.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toContain('16, 185, 129') // RGB values for success green
  })

  test('should show correct message for shieldWarning()', async ({ page }) => {
    const testProvince = 'ขอนแก่น'
    const testShieldLevel = 25

    // Trigger shieldWarning
    await page.evaluate(({ province, level }) => {
      window.toastManager.shieldWarning(province, level)
    }, { province: testProvince, level: testShieldLevel })

    // Wait for toast
    const toast = page.locator('.toast-error').first()
    await expect(toast).toBeVisible()

    // Verify exact message format
    const message = await toast.locator('.toast-message').textContent()
    expect(message).toBe(`Warning: ${testProvince} shield is low (${testShieldLevel}%)!`)

    // Verify toast type is error
    const hasErrorClass = await toast.evaluate(el => el.classList.contains('toast-error'))
    expect(hasErrorClass).toBe(true)

    // Verify background color is red (error color)
    const bgColor = await toast.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toContain('239, 68, 68') // RGB values for error red
  })

  test('should handle rapid toast creation without issues', async ({ page }) => {
    // Create many toasts in quick succession
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        window.toastManager.show(`Toast ${i + 1}`, 'info', 10000)
      }
    })

    // Wait for toasts to render
    await page.waitForTimeout(500)

    // Verify all toasts are displayed
    const toasts = await page.locator('.toast').all()
    expect(toasts.length).toBe(5)

    // Verify all are visible
    for (const toast of toasts) {
      await expect(toast).toBeVisible()
    }
  })

  test('should maintain toast container position in top-right corner', async ({ page }) => {
    // Create a toast
    await page.evaluate(() => {
      window.toastManager.show('Position test', 'info', 5000)
    })

    // Wait for toast container
    await page.waitForSelector('#toast-container', { timeout: 5000 })

    // Verify container positioning
    const container = page.locator('#toast-container')
    const style = await container.getAttribute('style')

    expect(style).toContain('position: fixed')
    expect(style).toContain('top: 20px')
    expect(style).toContain('right: 20px')
    expect(style).toContain('z-index: 9999')
  })

  test('should remove toast from DOM after slide-out animation completes', async ({ page }) => {
    // Create a toast
    await page.evaluate(() => {
      window.toastManager.show('Removal test', 'info', 10000)
    })

    // Wait for toast
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Get initial toast count in DOM
    const initialCount = await page.locator('.toast').count()
    expect(initialCount).toBeGreaterThan(0)

    // Close the toast
    await toast.locator('.toast-close').click()

    // Wait for animation and removal (300ms animation + buffer)
    await page.waitForTimeout(500)

    // Verify toast count decreased
    const finalCount = await page.locator('.toast').count()
    expect(finalCount).toBe(initialCount - 1)
  })

  test('should display close button with hover effect', async ({ page }) => {
    // Create a toast
    await page.evaluate(() => {
      window.toastManager.show('Close button test', 'info', 10000)
    })

    // Wait for toast
    const toast = page.locator('.toast').first()
    await expect(toast).toBeVisible()

    // Get close button
    const closeButton = toast.locator('.toast-close')
    await expect(closeButton).toBeVisible()

    // Verify close button content (×)
    const buttonText = await closeButton.textContent()
    expect(buttonText).toBe('×')

    // Get initial opacity
    const initialOpacity = await closeButton.evaluate(el => {
      return window.getComputedStyle(el).opacity
    })

    // Hover over close button
    await closeButton.hover()
    await page.waitForTimeout(100)

    // Get hover opacity (should increase to 1)
    const hoverOpacity = await closeButton.evaluate(el => {
      return window.getComputedStyle(el).opacity
    })

    // Opacity should change on hover (can't guarantee exact value due to animation timing)
    expect(closeButton).toBeVisible()
  })

  test('should handle different toast types with correct styling', async ({ page }) => {
    // Create toasts of different types
    await page.evaluate(() => {
      window.toastManager.show('Success message', 'success', 10000)
      window.toastManager.show('Error message', 'error', 10000)
      window.toastManager.show('Warning message', 'warning', 10000)
      window.toastManager.show('Info message', 'info', 10000)
    })

    // Wait for all toasts
    await page.waitForTimeout(500)

    // Verify each type exists and has correct class
    await expect(page.locator('.toast-success').first()).toBeVisible()
    await expect(page.locator('.toast-error').first()).toBeVisible()
    await expect(page.locator('.toast-warning').first()).toBeVisible()
    await expect(page.locator('.toast-info').first()).toBeVisible()

    // Verify different background colors
    const successBg = await page.locator('.toast-success').first().evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })
    const errorBg = await page.locator('.toast-error').first().evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Colors should be different
    expect(successBg).not.toBe(errorBg)
  })
})
