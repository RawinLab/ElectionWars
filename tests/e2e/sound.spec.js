import { test, expect } from '@playwright/test'
import { joinGame, waitForMapLoad, clickProvince, clearStorage } from './helpers/game-helpers.js'

test.describe('Sound Toggle Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and navigate to game
    await clearStorage(page)
    await page.goto('/')
  })

  test('should display sound toggle button in settings', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    // Verify sound toggle button is visible
    const soundToggle = page.locator('.sound-toggle')
    await expect(soundToggle).toBeVisible()

    // Verify button has correct attributes
    const ariaLabel = await soundToggle.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(['Enable sound', 'Disable sound']).toContain(ariaLabel)
  })

  test('should show correct text when sound is disabled by default', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    // By default sound should be disabled (false)
    const soundToggle = page.locator('.sound-toggle')
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Verify button styling for disabled state
    const bgColor = await soundToggle.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    // Should be gray when disabled (#6b7280 = rgb(107, 114, 128))
    expect(bgColor).toBe('rgb(107, 114, 128)')
  })

  test('should toggle sound state on click', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Initial state should be OFF
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Click to enable sound
    await soundToggle.click()

    // Verify state changed to ON
    await expect(soundToggle).toHaveText('Sound: ON')

    // Verify button styling for enabled state
    let bgColor = await soundToggle.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    // Should be green when enabled (#22c55e = rgb(34, 197, 94))
    expect(bgColor).toBe('rgb(34, 197, 94)')

    // Click again to disable
    await soundToggle.click()

    // Verify state changed back to OFF
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Verify button styling changed back to gray
    bgColor = await soundToggle.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(107, 114, 128)')
  })

  test('should persist sound preference in localStorage', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Check localStorage value
    const soundEnabled = await page.evaluate(() => {
      return localStorage.getItem('electionWar_soundEnabled')
    })
    expect(soundEnabled).toBe('true')

    // Disable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Check localStorage updated
    const soundDisabled = await page.evaluate(() => {
      return localStorage.getItem('electionWar_soundEnabled')
    })
    expect(soundDisabled).toBe('false')
  })

  test('should maintain sound preference after page reload', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Reload page
    await page.reload()

    // Join game again
    await joinGame(page, 0, 'SoundTester')

    // Verify sound preference was restored
    const soundToggleAfterReload = page.locator('.sound-toggle')
    await expect(soundToggleAfterReload).toHaveText('Sound: ON')

    // Verify correct styling
    const bgColor = await soundToggleAfterReload.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(34, 197, 94)')
  })

  test('should show correct icon/text for enabled state', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()

    // Verify text indicates enabled state
    await expect(soundToggle).toHaveText('Sound: ON')

    // Verify aria-label for enabled state
    const ariaLabel = await soundToggle.getAttribute('aria-label')
    expect(ariaLabel).toBe('Disable sound')

    // Verify visual styling
    const bgColor = await soundToggle.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(34, 197, 94)')
  })

  test('should show correct icon/text for disabled state', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Should start disabled
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Verify aria-label for disabled state
    let ariaLabel = await soundToggle.getAttribute('aria-label')
    expect(ariaLabel).toBe('Enable sound')

    // Enable then disable again to test both transitions
    await soundToggle.click()
    await soundToggle.click()

    // Verify disabled state after toggle
    await expect(soundToggle).toHaveText('Sound: OFF')
    ariaLabel = await soundToggle.getAttribute('aria-label')
    expect(ariaLabel).toBe('Enable sound')

    // Verify visual styling
    const bgColor = await soundToggle.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toBe('rgb(107, 114, 128)')
  })

  test('should handle click sound when enabled', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')
    await waitForMapLoad(page)

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Set up a promise to listen for audio creation
    const audioCreated = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalAudio = window.Audio
        window.Audio = function(src) {
          window.Audio = originalAudio
          resolve({ created: true, src })
          return new originalAudio(src)
        }

        // Timeout after 5 seconds
        setTimeout(() => {
          window.Audio = originalAudio
          resolve({ created: false, src: null })
        }, 5000)
      })
    })

    // Click a province
    await clickProvince(page, 0)

    // Wait for audio creation check
    const result = await audioCreated

    // When sound is enabled, Audio object should be created
    expect(result.created).toBe(true)
    expect(result.src).toContain('/sounds/click.mp3')
  })

  test('should not play sound when disabled', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')
    await waitForMapLoad(page)

    const soundToggle = page.locator('.sound-toggle')

    // Ensure sound is disabled (default state)
    await expect(soundToggle).toHaveText('Sound: OFF')

    // Set up a promise to listen for audio creation
    const audioCreated = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalAudio = window.Audio
        let audioCalled = false

        window.Audio = function(src) {
          audioCalled = true
          window.Audio = originalAudio
          resolve({ created: true, src })
          return new originalAudio(src)
        }

        // Wait a bit to see if Audio is called
        setTimeout(() => {
          window.Audio = originalAudio
          resolve({ created: audioCalled, src: null })
        }, 2000)
      })
    })

    // Click a province
    await clickProvince(page, 0)

    // Wait for audio creation check
    const result = await audioCreated

    // When sound is disabled, Audio object should not be created
    expect(result.created).toBe(false)
  })

  test('should handle missing sound file gracefully', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')
    await waitForMapLoad(page)

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Intercept the sound request and fail it
    await page.route('/sounds/click.mp3', route => {
      route.abort('failed')
    })

    // Click province should not throw error even if sound file missing
    await clickProvince(page, 0)

    // Wait a bit to ensure no errors
    await page.waitForTimeout(500)

    // Verify map is still functional
    const firstProvince = page.locator('#thailand-map svg [data-id]').first()
    await expect(firstProvince).toBeVisible()
  })

  test('should integrate with Map component playClickSound', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')
    await waitForMapLoad(page)

    const soundToggle = page.locator('.sound-toggle')

    // Test with sound disabled
    await expect(soundToggle).toHaveText('Sound: OFF')
    await clickProvince(page, 0)
    await page.waitForTimeout(300)

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Monitor audio creation
    const audioMonitor = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalAudio = window.Audio
        window.Audio = function(src) {
          window.Audio = originalAudio
          const audio = new originalAudio(src)
          resolve({
            created: true,
            src,
            volume: audio.volume
          })
          return audio
        }

        setTimeout(() => {
          window.Audio = originalAudio
          resolve({ created: false })
        }, 3000)
      })
    })

    // Click province with sound enabled
    await clickProvince(page, 1)

    const audioResult = await audioMonitor

    // Verify audio was created with correct settings
    expect(audioResult.created).toBe(true)
    expect(audioResult.src).toContain('/sounds/click.mp3')
    expect(audioResult.volume).toBe(0.3)
  })

  test('should handle rapid toggle clicks', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Rapid toggle clicks
    for (let i = 0; i < 10; i++) {
      await soundToggle.click()
      await page.waitForTimeout(50)
    }

    // Should end in enabled state (started disabled, clicked 10 times)
    await expect(soundToggle).toHaveText('Sound: ON')

    // Verify localStorage is consistent
    const soundEnabled = await page.evaluate(() => {
      return localStorage.getItem('electionWar_soundEnabled')
    })
    expect(soundEnabled).toBe('true')
  })

  test('should maintain independent state across multiple sessions', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester1')

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Store the localStorage value
    const soundPref = await page.evaluate(() => {
      return localStorage.getItem('electionWar_soundEnabled')
    })
    expect(soundPref).toBe('true')

    // Clear session storage but keep localStorage
    await page.evaluate(() => {
      sessionStorage.clear()
    })

    // Reload and join with different name
    await page.reload()
    await joinGame(page, 1, 'SoundTester2')

    // Sound preference should still be enabled
    const soundToggleAfter = page.locator('.sound-toggle')
    await expect(soundToggleAfter).toHaveText('Sound: ON')
  })

  test('should restore default state when localStorage is cleared', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Clear all localStorage
    await clearStorage(page)

    // Reload and rejoin
    await page.goto('/')
    await joinGame(page, 0, 'SoundTester')

    // Should be back to default (disabled)
    const soundToggleAfter = page.locator('.sound-toggle')
    await expect(soundToggleAfter).toHaveText('Sound: OFF')

    // Verify localStorage is back to default
    const soundPref = await page.evaluate(() => {
      return localStorage.getItem('electionWar_soundEnabled')
    })
    // Should be null (not set) or 'false'
    expect(soundPref === null || soundPref === 'false').toBe(true)
  })

  test('should have correct button styling transitions', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')

    const soundToggle = page.locator('.sound-toggle')

    // Check initial styling (disabled)
    let styles = await soundToggle.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        padding: computed.padding,
        cursor: computed.cursor,
        borderRadius: computed.borderRadius
      }
    })

    expect(styles.cursor).toBe('pointer')
    expect(styles.borderRadius).toBe('4px')

    // Enable and check styling
    await soundToggle.click()

    styles = await soundToggle.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontWeight: computed.fontWeight
      }
    })

    expect(styles.backgroundColor).toBe('rgb(34, 197, 94)')
    expect(styles.color).toBe('rgb(255, 255, 255)')
    expect(styles.fontWeight).toBe('500')
  })

  test('should work correctly when used before province clicks', async ({ page }) => {
    await joinGame(page, 0, 'SoundTester')
    await waitForMapLoad(page)

    const soundToggle = page.locator('.sound-toggle')

    // Enable sound before any clicks
    await soundToggle.click()
    await expect(soundToggle).toHaveText('Sound: ON')

    // Now click province
    const audioCheck = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalAudio = window.Audio
        window.Audio = function(src) {
          window.Audio = originalAudio
          resolve(true)
          return new originalAudio(src)
        }
        setTimeout(() => {
          window.Audio = originalAudio
          resolve(false)
        }, 2000)
      })
    })

    await clickProvince(page, 0)
    const audioWasCreated = await audioCheck

    expect(audioWasCreated).toBe(true)
  })
})
