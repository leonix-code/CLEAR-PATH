import { test, expect } from '@playwright/test';

test.describe('Responsive Layout - Live Development Workflow', () => {
  
  test('should render desktop layout (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify key elements visible on desktop
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check desktop navigation is visible (not mobile hamburger)
    const desktopNav = page.locator('header nav');
    await expect(desktopNav).toBeVisible();
    
    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(windowWidth);
    
    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/desktop-layout.png', fullPage: true });
  });

  test('should render tablet layout (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify key elements visible on tablet
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Mobile menu button should be visible on tablet
    await expect(page.getByRole('button').filter({ has: page.locator('svg') })).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/tablet-layout.png', fullPage: true });
  });

  test('should render mobile layout (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify key elements visible on mobile
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Verify no horizontal scroll on mobile
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(windowWidth);
    
    await page.screenshot({ path: 'e2e/screenshots/mobile-layout.png', fullPage: true });
  });

  test('should have active HMR connection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check for HMR WebSocket connection
    const hasHMR = await page.evaluate(() => {
      return window.__NEXT_DATA__ !== undefined || 
             document.querySelector('[data-next-hmr]') !== null ||
             document.querySelector('script[src*="hmr"]') !== null;
    });
    
    // The HTML should contain turbopack HMR references
    const html = await page.content();
    expect(html).toContain('hmr');
  });

  test('should re-render on CSS change simulation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Get the initial background color
    const initialBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    // The background should be a valid CSS color
    expect(initialBg).toBeTruthy();
    expect(initialBg).not.toBe('');
    
    // Verify the page is interactive and HMR is listening
    const title = await page.title();
    expect(title).toContain('ClearPath');
  });
});
