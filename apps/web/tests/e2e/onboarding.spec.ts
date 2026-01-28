import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/onboarding')

    // Step 1: Select handedness
    await expect(page.locator('text=Are you right-handed or left-handed?')).toBeVisible()
    await page.click('button:has-text("Right-handed")')
    await page.click('button:has-text("Next")')

    // Step 2: Select guitar type
    await expect(page.locator('text=What type of guitar are you using?')).toBeVisible()
    await page.click('button:has-text("Acoustic")')
    await page.click('button:has-text("Next")')

    // Step 3: Tutorial
    await expect(page.locator('text=Setup Tips')).toBeVisible()
    await page.click('button:has-text("Start Calibration")')

    // Should redirect to calibration
    await expect(page).toHaveURL(/.*calibrate/)
  })
})
