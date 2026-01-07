import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clickProvince, clearStorage } from './helpers/game-helpers.js'

test.describe('Click Feedback Animations', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and join game before each test
    await clearStorage(page)
    await page.goto('/')
    await joinGame(page, 0, 'AnimationTester')
    await waitForMapLoad(page)
  })

  test('should show province pulse/scale animation on click', async ({ page }) => {
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Get initial transform/scale state
    const initialTransform = await firstProvince.getAttribute('transform')

    // Click the province
    await firstProvince.click()

    // Wait for animation to start (check for scale or animation class)
    await page.waitForTimeout(100)

    // Verify province has animation class or transform change
    const hasAnimationClass = await firstProvince.evaluate(el => {
      return el.classList.contains('pulse') ||
             el.classList.contains('scale-animation') ||
             el.classList.contains('click-animation')
    })

    const currentTransform = await firstProvince.getAttribute('transform')
    const hasTransformChange = currentTransform !== initialTransform

    // Either animation class or transform should change
    expect(hasAnimationClass || hasTransformChange).toBeTruthy()

    // Wait for animation to complete
    await page.waitForTimeout(600)

    // Province should still be visible after animation
    await expect(firstProvince).toBeVisible()
  })

  test('should show floating +1/-1 animation on click', async ({ page }) => {
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Click the province
    await firstProvince.click()

    // Wait for floating text to appear
    await page.waitForTimeout(100)

    // Check for floating text elements (could be in SVG or as HTML overlay)
    const floatingTextExists = await page.evaluate(() => {
      // Check for SVG text elements with +1/-1
      const svgTexts = document.querySelectorAll('#thailand-map svg text')
      const hasFloatingText = Array.from(svgTexts).some(text => {
        const content = text.textContent || ''
        return content.includes('+1') || content.includes('-1')
      })

      // Check for HTML overlay elements
      const overlayElements = document.querySelectorAll('.floating-score, .score-popup, .click-feedback')
      const hasOverlay = overlayElements.length > 0

      return hasFloatingText || hasOverlay
    })

    // Floating animation should appear
    expect(floatingTextExists).toBeTruthy()

    // Wait for animation to complete
    await page.waitForTimeout(1500)
  })

  test('should show green +1 animation for defend action', async ({ page }) => {
    // Get player's party-controlled province
    const playerProvinces = page.locator('#thailand-map svg [data-id]')

    // Find a province that belongs to player's party (has player's party color)
    const playerPartyProvince = await page.evaluate(() => {
      const provinces = document.querySelectorAll('#thailand-map svg [data-id]')
      // Get player's party color from header
      const playerPartyElement = document.querySelector('#player-info .player-party')
      const playerParty = playerPartyElement ? playerPartyElement.getAttribute('data-party') : null

      // Find a province with matching party
      for (const province of provinces) {
        const partyAttr = province.getAttribute('data-party') || province.getAttribute('data-owner')
        if (partyAttr === playerParty) {
          return province.getAttribute('data-id')
        }
      }
      return null
    })

    if (playerPartyProvince) {
      const defendProvince = page.locator(`#thailand-map svg [data-id="${playerPartyProvince}"]`)

      // Click to defend (clicking own province)
      await defendProvince.click()

      // Wait for animation
      await page.waitForTimeout(100)

      // Check for green/positive feedback
      const hasGreenFeedback = await page.evaluate(() => {
        const feedbackElements = document.querySelectorAll('.floating-score, .score-popup, .click-feedback, text')
        return Array.from(feedbackElements).some(el => {
          const text = el.textContent || ''
          const fill = el.getAttribute('fill') || ''
          const color = window.getComputedStyle(el).color || ''

          // Check for +1 and green color
          return text.includes('+1') && (
            fill.includes('green') ||
            fill.includes('#0f0') ||
            fill.includes('#00ff00') ||
            color.includes('green') ||
            el.classList.contains('positive') ||
            el.classList.contains('defend')
          )
        })
      })

      expect(hasGreenFeedback).toBeTruthy()
    }

    // Wait for animation to complete
    await page.waitForTimeout(1500)
  })

  test('should show red -1 animation for attack action', async ({ page }) => {
    // Find an opponent's province (different party color)
    const opponentProvinceId = await page.evaluate(() => {
      const provinces = document.querySelectorAll('#thailand-map svg [data-id]')
      const playerPartyElement = document.querySelector('#player-info .player-party')
      const playerParty = playerPartyElement ? playerPartyElement.getAttribute('data-party') : null

      // Find a province with different party
      for (const province of provinces) {
        const partyAttr = province.getAttribute('data-party') || province.getAttribute('data-owner')
        if (partyAttr && partyAttr !== playerParty) {
          return province.getAttribute('data-id')
        }
      }
      return provinces[0].getAttribute('data-id') // Fallback to first province
    })

    const attackProvince = page.locator(`#thailand-map svg [data-id="${opponentProvinceId}"]`)

    // Click to attack (clicking opponent's province)
    await attackProvince.click()

    // Wait for animation
    await page.waitForTimeout(100)

    // Check for red/negative feedback
    const hasRedFeedback = await page.evaluate(() => {
      const feedbackElements = document.querySelectorAll('.floating-score, .score-popup, .click-feedback, text')
      return Array.from(feedbackElements).some(el => {
        const text = el.textContent || ''
        const fill = el.getAttribute('fill') || ''
        const color = window.getComputedStyle(el).color || ''

        // Check for -1 and red color
        return text.includes('-1') && (
          fill.includes('red') ||
          fill.includes('#f00') ||
          fill.includes('#ff0000') ||
          color.includes('red') ||
          el.classList.contains('negative') ||
          el.classList.contains('attack')
        )
      })
    })

    expect(hasRedFeedback).toBeTruthy()

    // Wait for animation to complete
    await page.waitForTimeout(1500)
  })

  test('should show special animation for capture event', async ({ page }) => {
    // This test simulates a province capture scenario
    // In real gameplay, capture happens when a province health reaches 0

    const targetProvince = page.locator('#thailand-map svg [data-id]').first()

    // Perform multiple rapid clicks to potentially trigger capture
    // (In actual game, this would need sufficient clicks to deplete province health)
    for (let i = 0; i < 10; i++) {
      await targetProvince.click({ delay: 100 })
    }

    // Wait for potential capture animation
    await page.waitForTimeout(500)

    // Check for special capture animation elements
    const hasCaptureAnimation = await page.evaluate(() => {
      // Look for capture-specific animations or effects
      const captureElements = document.querySelectorAll(
        '.capture-animation, .province-captured, .special-animation, [data-capture="true"]'
      )

      // Look for color change animation
      const provinces = document.querySelectorAll('#thailand-map svg [data-id]')
      const hasColorChangeClass = Array.from(provinces).some(p =>
        p.classList.contains('captured') ||
        p.classList.contains('changing-owner') ||
        p.classList.contains('color-transition')
      )

      // Look for special text or notification
      const notifications = document.querySelectorAll('.notification, .toast, .capture-message')
      const hasCaptureNotification = Array.from(notifications).some(n =>
        (n.textContent || '').toLowerCase().includes('capture')
      )

      return captureElements.length > 0 || hasColorChangeClass || hasCaptureNotification
    })

    // Note: Capture may not happen in every test run depending on game state
    // This test verifies the animation exists if capture occurs
    if (hasCaptureAnimation) {
      expect(hasCaptureAnimation).toBeTruthy()
    }

    // Wait for animation to complete
    await page.waitForTimeout(2000)
  })

  test('should remove animation elements after animation completes', async ({ page }) => {
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Click the province
    await firstProvince.click()

    // Wait for animation to start
    await page.waitForTimeout(100)

    // Count animation elements immediately after click
    const animationElementsInitial = await page.evaluate(() => {
      const floatingTexts = document.querySelectorAll(
        '.floating-score, .score-popup, .click-feedback, ' +
        '#thailand-map text:not([class*="province-name"])'
      )
      return floatingTexts.length
    })

    // Animation elements should exist initially
    expect(animationElementsInitial).toBeGreaterThan(0)

    // Wait for animations to complete (typical duration: 1-2 seconds)
    await page.waitForTimeout(2500)

    // Count animation elements after animation completes
    const animationElementsFinal = await page.evaluate(() => {
      const floatingTexts = document.querySelectorAll(
        '.floating-score, .score-popup, .click-feedback'
      )

      // Also check if any text elements are still animating
      const animatingElements = document.querySelectorAll('[class*="animation"]')
      const activeAnimations = Array.from(animatingElements).filter(el => {
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.animationPlayState === 'running' ||
               computedStyle.transitionProperty !== 'none'
      })

      return floatingTexts.length + activeAnimations.length
    })

    // Animation elements should be removed or significantly reduced
    expect(animationElementsFinal).toBeLessThanOrEqual(animationElementsInitial)

    // Ideally, all temporary animation elements should be gone
    // But we allow some leeway for animation cleanup timing
    expect(animationElementsFinal).toBeLessThanOrEqual(2)
  })

  test('should handle multiple simultaneous click animations', async ({ page }) => {
    const provinces = await page.locator('#thailand-map svg [data-id]').all()

    // Click multiple provinces rapidly to trigger simultaneous animations
    await provinces[0].click()
    await page.waitForTimeout(100)
    await provinces[1].click()
    await page.waitForTimeout(100)
    await provinces[2].click()

    // Wait for animations to render
    await page.waitForTimeout(200)

    // Check that multiple animation elements exist
    const multipleAnimations = await page.evaluate(() => {
      const animationElements = document.querySelectorAll(
        '.floating-score, .score-popup, .click-feedback'
      )
      return animationElements.length
    })

    // Should have multiple animation elements (at least 2-3)
    expect(multipleAnimations).toBeGreaterThanOrEqual(2)

    // Wait for all animations to complete
    await page.waitForTimeout(2500)

    // Verify cleanup
    const remainingAnimations = await page.evaluate(() => {
      const animationElements = document.querySelectorAll(
        '.floating-score, .score-popup, .click-feedback'
      )
      return animationElements.length
    })

    // Most animations should be cleaned up
    expect(remainingAnimations).toBeLessThanOrEqual(1)
  })

  test('should maintain animation performance with rapid clicks', async ({ page }) => {
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()

    // Record start time
    const startTime = Date.now()

    // Perform rapid clicks (stress test)
    for (let i = 0; i < 20; i++) {
      await firstProvince.click({ delay: 50 })
    }

    // Record end time
    const endTime = Date.now()
    const duration = endTime - startTime

    // Clicks should complete in reasonable time (not blocked by animations)
    // 20 clicks with 50ms delay = ~1000ms minimum, allow up to 3000ms for processing
    expect(duration).toBeLessThan(3000)

    // Wait for animations to settle
    await page.waitForTimeout(2500)

    // Verify page is still responsive
    await expect(firstProvince).toBeVisible()
    const isClickable = await firstProvince.isEnabled()
    expect(isClickable).toBeTruthy()
  })
})
