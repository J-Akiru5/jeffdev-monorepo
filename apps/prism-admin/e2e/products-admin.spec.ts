/**
 * Admin Products E2E Test Suite
 *
 * Tests admin product management, contract terms, and customization services.
 * Requires test-admin@syntaxure.dev user (run seed-test-user.ts first).
 */

import { test, expect } from "@playwright/test";
import { loginAndNavigate } from "./helpers/auth";

const BASE_URL = process.env.BASE_URL || "http://localhost:3004";

test.describe("Product Templates Admin", () => {
  test("product templates list loads", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Verify page heading
    await expect(page.locator("h1")).toContainText("Product Templates");

    // Verify product list is displayed
    const productList = page.locator('[class*="rounded-lg"][class*="border"]');
    await expect(productList.first()).toBeVisible({ timeout: 10000 });
  });

  test("category filter works", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Click Templates filter
    const templatesFilter = page.locator('button:has-text("Template")');
    if (await templatesFilter.isVisible()) {
      await templatesFilter.click();
      await page.waitForTimeout(500);
    }

    // Click Boilerplates filter
    const boilerplatesFilter = page.locator('button:has-text("Boilerplate")');
    if (await boilerplatesFilter.isVisible()) {
      await boilerplatesFilter.click();
      await page.waitForTimeout(500);
    }

    // Click All to reset
    const allFilter = page.locator('button:has-text("All")');
    if (await allFilter.isVisible()) {
      await allFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test("create new product template", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products/new");

    // Verify form is loaded
    await expect(page.locator("h1")).toContainText("New Product Template");

    // Fill in product details
    await page.fill('input[placeholder="Website Starter"]', "E2E Test Product");
    await page.fill('input[placeholder="website-starter"]', "e2e-test-product");

    // Select category
    await page.selectOption("select:near(:text('Category'))", "template");

    // Fill tagline
    await page.fill('input[placeholder*="Professional websites"]', "Test tagline for E2E");

    // Fill description
    await page.fill('textarea[placeholder*="Detailed description"]', "This is a test product created by E2E tests.");

    // Fill pricing
    await page.fill('input[placeholder="2500"]', "5000");
    await page.fill('input[placeholder="45"]', "100");

    // Add a feature
    const addFeatureBtn = page.locator('button:has-text("Add Feature")');
    if (await addFeatureBtn.isVisible()) {
      await addFeatureBtn.click();
      await page.waitForTimeout(300);
    }

    // Submit form
    const saveBtn = page.locator('button:has-text("Create Template")');
    await saveBtn.click();

    // Verify redirect to products list
    await expect(page).toHaveURL(/\/admin\/products/, { timeout: 10000 });
  });

  test("edit product template", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Click edit on first product
    const editBtn = page.locator('[title="Edit"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      // Verify edit form loads
      await expect(page.locator("h1")).toContainText("Edit Template");

      // Make a small change
      const nameInput = page.locator('input[placeholder="Website Starter"]');
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill("E2E Updated Product");
      }

      // Save changes
      const saveBtn = page.locator('button:has-text("Save Changes")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
    }
  });

  test("delete product template with confirmation", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Find a product to delete (look for E2E test product)
    const testProduct = page.locator('text="E2E Test Product"');
    if (await testProduct.isVisible()) {
      // Click delete button
      const deleteBtn = testProduct.locator('[title="Delete"]');
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("Confirm")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);

        // Verify product is removed
        await expect(page.locator('text="E2E Test Product"')).not.toBeVisible();
      }
    }
  });
});

test.describe("Contract Terms Admin", () => {
  test("contract terms manager loads on product detail", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Click on first product to view detail
    const firstProduct = page.locator('[class*="rounded-lg"][class*="border"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Verify contract terms section exists
      const contractSection = page.locator("text=Contract Terms");
      await expect(contractSection).toBeVisible();
    }
  });

  test("add new contract term", async ({ page }) => {
    // Navigate to a product detail page
    await loginAndNavigate(page, BASE_URL, "/admin/products");

    // Click on first product
    const firstProduct = page.locator('[class*="rounded-lg"][class*="border"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Click Add Term button
      const addTermBtn = page.locator('button:has-text("Add Term")');
      if (await addTermBtn.isVisible()) {
        await addTermBtn.click();

        // Verify modal opens
        await expect(page.locator("text=New Contract Term")).toBeVisible();

        // Fill in term details
        await page.fill('input[placeholder="2500"]', "3000");
        await page.fill('input[placeholder="45"]', "55");

        // Save
        const saveBtn = page.locator('button:has-text("Create Term")');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
        }
      }
    }
  });
});

test.describe("Customization Services Admin", () => {
  test("customization services list loads", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/customization-services");

    // Verify page heading
    await expect(page.locator("h1")).toContainText("Customization Services");

    // Verify services list is displayed
    const servicesList = page.locator('[class*="rounded-lg"][class*="border"]');
    await expect(servicesList.first()).toBeVisible({ timeout: 10000 });
  });

  test("create new customization service", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/customization-services");

    // Click Add Service button
    const addServiceBtn = page.locator('button:has-text("Add Service")');
    await addServiceBtn.click();

    // Verify modal opens
    await expect(page.locator("text=New Customization Service")).toBeVisible();

    // Fill in service details
    await page.fill('input[placeholder="Branding & Design"]', "E2E Test Service");
    await page.fill('input[placeholder="branding-design"]', "e2e-test-service");

    // Select pricing model
    await page.selectOption("select:near(:text('Pricing Model'))", "fixed");

    // Fill price range
    await page.fill('input[placeholder="Min PHP"]', "10000");
    await page.fill('input[placeholder="Max PHP"]', "50000");
    await page.fill('input[placeholder="Min USD"]', "200");
    await page.fill('input[placeholder="Max USD"]', "900");

    // Fill turnaround
    await page.fill('input[placeholder="7"]', "5");

    // Save
    const saveBtn = page.locator('button:has-text("Create Service")');
    await saveBtn.click();

    // Verify modal closes and service appears in list
    await page.waitForTimeout(1000);
    await expect(page.locator('text="E2E Test Service"')).toBeVisible();
  });

  test("edit customization service", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/customization-services");

    // Click edit on first service
    const editBtn = page.locator('[title="Edit"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      // Verify edit modal opens
      await expect(page.locator("text=Edit Customization Service")).toBeVisible();

      // Make a change
      const nameInput = page.locator('input[placeholder="Branding & Design"]');
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill("E2E Updated Service");
      }

      // Save
      const saveBtn = page.locator('button:has-text("Save Changes")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
    }
  });

  test("delete customization service", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/customization-services");

    // Find E2E test service
    const testService = page.locator('text="E2E Test Service"');
    if (await testService.isVisible()) {
      // Click delete
      const deleteBtn = testService.locator('[title="Delete"]');
      await deleteBtn.click();

      // Confirm
      const confirmBtn = page.locator('button:has-text("Confirm")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);

        // Verify service is removed
        await expect(page.locator('text="E2E Test Service"')).not.toBeVisible();
      }
    }
  });
});

test.describe("Admin Navigation", () => {
  test("Products section appears in sidebar", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/dashboard");

    // Verify Products section exists in sidebar
    const productsSection = page.locator('text="Products"');
    await expect(productsSection).toBeVisible();

    // Verify Product Templates link
    const productTemplatesLink = page.locator('a:has-text("Product Templates")');
    await expect(productTemplatesLink).toBeVisible();

    // Verify Customization link
    const customizationLink = page.locator('a:has-text("Customization")');
    await expect(customizationLink).toBeVisible();
  });

  test("can navigate to all product pages", async ({ page }) => {
    await loginAndNavigate(page, BASE_URL, "/admin/dashboard");

    // Navigate to Product Templates
    await page.click('a:has-text("Product Templates")');
    await expect(page).toHaveURL(/\/admin\/products/);

    // Navigate to Customization Services
    await page.click('a:has-text("Customization")');
    await expect(page).toHaveURL(/\/admin\/customization-services/);
  });
});
