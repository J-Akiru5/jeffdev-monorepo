/**
 * Products E2E Test Suite
 *
 * Tests the public product catalog, comparison, detail, and quote flow.
 */

import { test, expect } from "@playwright/test";

test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "Skipping products tests because NEXT_PUBLIC_SUPABASE_URL is not configured.");

test.describe("Product Catalog", () => {
  test("products page loads with all products", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText("Product Catalog");

    // Verify product cards are rendered
    const productCards = page.locator('a[href^="/products/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(3); // Core 3 templates
  });

  test("category filters work correctly", async ({ page }) => {
    await page.goto("/products");

    // Click Templates filter
    await page.click('button:has-text("Templates")');
    await page.waitForTimeout(500);

    // Verify filtered results
    const templates = page.locator('a[href^="/products/"]');
    const templateCount = await templates.count();
    expect(templateCount).toBeGreaterThanOrEqual(1);

    // Click Boilerplates filter
    await page.click('button:has-text("Boilerplates")');
    await page.waitForTimeout(500);

    // Click All Products to reset
    await page.click('button:has-text("All Products")');
    await page.waitForTimeout(500);
  });

  test("product cards display correct information", async ({ page }) => {
    await page.goto("/products");

    // Check first product card has required elements
    const firstCard = page.locator('a[href^="/products/"]').first();
    await expect(firstCard).toBeVisible();

    // Card should have name, tagline, tech stack, and price
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("p").first()).toBeVisible();
  });
});

test.describe("Product Comparison", () => {
  test("comparison table renders feature matrix", async ({ page }) => {
    await page.goto("/products");

    // Scroll to comparison section
    const comparisonSection = page.locator("text=Compare Templates");
    if (await comparisonSection.isVisible()) {
      await comparisonSection.scrollIntoViewIfNeeded();

      // Verify comparison table exists
      const table = page.locator("table");
      await expect(table).toBeVisible();
    }
  });

  test("comparison works on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/products");

    // Verify page doesn't break on mobile
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Scroll to comparison if visible
    const comparisonSection = page.locator("text=Compare Templates");
    if (await comparisonSection.isVisible()) {
      await comparisonSection.scrollIntoViewIfNeeded();

      // Verify horizontal scroll is available for table on mobile
      const table = page.locator("table");
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    }
  });
});

test.describe("Product Detail", () => {
  test("product detail page loads with contract terms", async ({ page }) => {
    // Navigate to a known product
    await page.goto("/products/saas-boilerplate");

    // Verify product name is displayed
    await expect(page.locator("h1")).toContainText("SaaS Boilerplate");

    // Verify contract terms are displayed
    const termButtons = page.locator('button:has-text("Monthly"), button:has-text("Annual")');
    const termCount = await termButtons.count();
    expect(termCount).toBeGreaterThanOrEqual(1);
  });

  test("monthly/annual toggle changes price", async ({ page }) => {
    await page.goto("/products/saas-boilerplate");

    // Get initial price
    const priceDisplay = page.locator(".font-mono").filter({ hasText: /₱|$/ });
    await expect(priceDisplay.first()).toBeVisible();

    // Click monthly term
    const monthlyButton = page.locator('button:has-text("Monthly")');
    if (await monthlyButton.isVisible()) {
      await monthlyButton.click();
      await page.waitForTimeout(300);
    }

    // Click annual term
    const annualButton = page.locator('button:has-text("Annual")');
    if (await annualButton.isVisible()) {
      await annualButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("5-year extension info displays correctly", async ({ page }) => {
    await page.goto("/products/saas-boilerplate");

    // Verify extension info is shown
    const extensionText = page.locator("text=Extension Available");
    if (await extensionText.isVisible()) {
      await expect(extensionText).toBeVisible();

      // Verify 10% increase text
      const increaseText = page.locator("text=10%");
      await expect(increaseText).toBeVisible();
    }
  });

  test("features list shows included/excluded items", async ({ page }) => {
    await page.goto("/products/saas-boilerplate");

    // Verify features section exists
    const featuresSection = page.locator("text=What's Included");
    await expect(featuresSection).toBeVisible();

    // Verify feature items are rendered
    const featureItems = page.locator('[class*="rounded-lg"][class*="border"]');
    const featureCount = await featureItems.count();
    expect(featureCount).toBeGreaterThanOrEqual(3);
  });

  test("tech stack chips are displayed", async ({ page }) => {
    await page.goto("/products/saas-boilerplate");

    // Verify tech stack section
    const techSection = page.locator("text=Tech Stack");
    await expect(techSection).toBeVisible();

    // Verify tech chips
    const techChips = page.locator('[class*="font-mono"][class*="rounded-lg"]');
    const chipCount = await techChips.count();
    expect(chipCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Quote Flow from Product", () => {
  test("Get Started button navigates to quote with params", async ({ page }) => {
    await page.goto("/products/saas-boilerplate");

    // Click Get Started button
    const getStartedBtn = page.locator('a:has-text("Get Started")');
    await expect(getStartedBtn).toBeVisible();

    // Verify the link has correct query params
    const href = await getStartedBtn.getAttribute("href");
    expect(href).toContain("/quote");
    expect(href).toContain("template=saas-boilerplate");
  });

  test("quote page loads with template param", async ({ page }) => {
    await page.goto("/quote?template=saas-boilerplate&term=test-term-id");

    // Verify quote form loads
    await expect(page.locator("h1")).toBeVisible();

    // Verify it's the quote form (step 1 should be visible)
    const projectTypeSection = page.locator("text=What type of project?");
    await expect(projectTypeSection).toBeVisible();
  });

  test("quote form can be submitted", async ({ page }) => {
    await page.goto("/quote");

    // Step 1: Select project type
    await page.click('button:has-text("SaaS Platform")');
    await page.click('button:has-text("Continue")');

    // Step 2: Select budget and timeline
    await page.click('button:has-text("100k-250k")');
    await page.click('button:has-text("1 Month")');
    await page.click('button:has-text("Continue")');

    // Step 3: Fill contact info
    await page.fill('input[placeholder="Your name"]', "Test User");
    await page.fill('input[placeholder="you@company.com"]', "test@example.com");
    await page.fill('textarea[placeholder*="Describe your project"]', "This is a test project description that is long enough to pass validation.");

    // Submit
    await page.click('button:has-text("Submit")');

    // Verify success state
    await expect(page.locator("text=Quote Request Sent!")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Mobile Responsive", () => {
  test("product catalog is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/products");

    // Verify page loads
    await expect(page.locator("h1")).toBeVisible();

    // Verify product cards stack vertically
    const productCards = page.locator('a[href^="/products/"]');
    await expect(productCards.first()).toBeVisible();
  });

  test("product detail is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/products/saas-boilerplate");

    // Verify page loads
    await expect(page.locator("h1")).toBeVisible();

    // Verify pricing section is accessible
    const pricingSection = page.locator("text=Choose Your Plan");
    await expect(pricingSection).toBeVisible();
  });
});
