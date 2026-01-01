import { test, expect } from '@playwright/test';

/**
 * Smoke Test Suite
 * -----------------
 * Basic health checks to verify the app is running.
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JeffDev/i);
  });

  test('work page loads successfully', async ({ page }) => {
    await page.goto('/work');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('form')).toBeVisible();
  });
});
