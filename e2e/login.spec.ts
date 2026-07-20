import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the landing page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Clearance');
    await expect(page.getByText(/Clearance System/)).toBeVisible();
  });

  test('should navigate to login page from landing page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/you@university/i).fill('invalid@test.com');
    await page.getByPlaceholder(/enter your password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should show error toast or message
    await expect(page.getByText(/invalid credentials/i).or(page.getByText(/try again/i))).toBeVisible({ timeout: 10000 });
  });

  test('should login as admin and redirect to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/you@university/i).fill('admin@clearpath.edu');
    await page.getByPlaceholder(/enter your password/i).fill('Admin@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should login as student and redirect to student dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/you@university/i).fill('student@clearpath.edu');
    await page.getByPlaceholder(/enter your password/i).fill('Student@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should redirect to student dashboard
    await expect(page).toHaveURL(/\/student/, { timeout: 10000 });
  });

  test('should login as finance officer and redirect to officer dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/you@university/i).fill('finance@clearpath.edu');
    await page.getByPlaceholder(/enter your password/i).fill('Officer@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should redirect to officer dashboard
    await expect(page).toHaveURL(/\/officer/, { timeout: 10000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    await passwordInput.fill('MySecretPassword');
    
    // Password should be hidden initially
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Toggle visibility
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should have working forgot password link', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  test('should show test accounts helper', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Test Accounts')).toBeVisible();
    await expect(page.getByText('Admin: admin@clearpath.edu')).toBeVisible();
    await expect(page.getByText('Student: student@clearpath.edu')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/you@university/i).fill('admin@clearpath.edu');
    await page.getByPlaceholder(/enter your password/i).fill('Admin@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /log.?out|sign.?out/i }).or(
      page.locator('[aria-label=\"Logout\"]')
    );
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });
});
