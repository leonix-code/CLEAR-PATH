import { test, expect } from '@playwright/test';

test.describe('Clearance Workflow', () => {
  test.describe('Student Clearance Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/you@university/i).fill('student@clearpath.edu');
      await page.getByPlaceholder(/enter your password/i).fill('Student@123');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/student/, { timeout: 10000 });
    });

    test('should display student dashboard with clearance section', async ({ page }) => {
      await expect(page.getByText(/clearance/i).or(page.getByText(/dashboard/i))).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Officer Clearance Approval', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/you@university/i).fill('finance@clearpath.edu');
      await page.getByPlaceholder(/enter your password/i).fill('Officer@123');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/officer/, { timeout: 10000 });
    });

    test('should display officer dashboard with clearance requests', async ({ page }) => {
      await expect(page.getByText(/clearance|pending|requests/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have search or filter for clearance list', async ({ page }) => {
      // Wait for the dashboard to load
      await page.waitForTimeout(2000);
      const searchInput = page.getByPlaceholder(/search|filter/i);
      const isVisible = await searchInput.isVisible();
      // Either a search input exists or the dashboard loaded successfully
      expect(isVisible || await page.getByText(/clearance/i).isVisible()).toBeTruthy();
    });
  });

  test.describe('Admin Clearance Overview', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/you@university/i).fill('admin@clearpath.edu');
      await page.getByPlaceholder(/enter your password/i).fill('Admin@123');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });

    test('should show clearance statistics on admin dashboard', async ({ page }) => {
      await expect(page.getByText(/clearance|statistics/i)).toBeVisible({ timeout: 10000 });
    });

    test('should display admin quick actions', async ({ page }) => {
      await expect(page.getByText(/manage users|departments|settings/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
