import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should display signin page for unauthenticated user', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to signin or show auth UI
    const heading = page.locator('text=/sign in|sign up/i');
    await expect(heading).toBeVisible();
  });

  test.describe('After Sign In', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Set up Clerk test login helper
      // See: https://clerk.com/docs/testing/e2e-testing
      await page.goto('/');
    });

    test('should show onboarding for new users', async ({ page }) => {
      // TODO: Mock a new user that hasn't completed onboarding
      const roleSelection = page.locator('text=/mentor|mentee/i').first();
      await expect(roleSelection).toBeVisible();
    });

    test('should skip onboarding for existing users', async ({ page }) => {
      // TODO: Mock an existing onboarded user
      const dashboard = page.locator('text=/dashboard|my dashboard/i').first();
      await expect(dashboard).toBeVisible();
    });
  });
});

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated user session
    await page.goto('/messages');
  });

  test('should display message list', async ({ page }) => {
    const messagesList = page.locator('[data-testid="conversations-list"]');
    await expect(messagesList).toBeVisible();
  });

  test('should send and receive messages', async ({ page, context }) => {
    // TODO: Open two contexts (mentor + mentee) and test real-time messaging
    const messageInput = page.locator('input[placeholder*="message" i]');
    await expect(messageInput).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated admin user
    await page.goto('/');
  });

  test('should display stats cards', async ({ page }) => {
    const stats = page.locator('[data-testid="stat-card"]');
    await expect(stats).toHaveCount(4);
  });

  test('should display activity feed', async ({ page }) => {
    const activityFeed = page.locator('[data-testid="activity-feed"]');
    await expect(activityFeed).toBeVisible();
  });
});
