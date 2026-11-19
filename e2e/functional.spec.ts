import { expect, test } from '@playwright/test';

test.describe('CampusTrace Functional End-to-End Verification', () => {
  test('Public home portal loads hero, quick search, and navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'CampusTrace' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search Items' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('Protected routes redirect unauthenticated users to Sign In page', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page.getByRole('heading', { name: /Sign in to CampusTrace/i })).toBeVisible();

    await page.goto('/#/testing-qa');
    await expect(page.getByRole('heading', { name: /Sign in to CampusTrace/i })).toBeVisible();
  });

  test('Registration page renders all required inputs and Google OAuth button', async ({ page }) => {
    await page.goto('/#/register');
    await expect(page.getByRole('heading', { name: /Create CampusTrace Account/i })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/University Email/i)).toBeVisible();
    await expect(page.getByLabel(/^Password \*/i)).toBeVisible();
    await expect(page.getByLabel(/Confirm Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });

  test('Registration form validates empty submissions cleanly without crashing', async ({ page }) => {
    await page.goto('/#/register');
    await page.getByRole('button', { name: /Create Account/i }).click();
    await expect(page.getByText(/Full name must be between 2 and 100 characters/i)).toBeVisible();
    await expect(page.getByText(/Please confirm your password/i)).toBeVisible();
  });

  test('Search page filters catalog and validates unsupported query characters', async ({ page }) => {
    await page.goto('/#/search');
    const searchInput = page.getByLabel(/Search by item name or keywords/i);
    await searchInput.fill('<script>alert(1)</script>');
    await expect(page.getByText(/Search query contains unsupported characters/i)).toBeVisible();
  });

  test('Responsive mobile navigation drawer opens and exposes links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /Toggle navigation menu/i }).click();
    await expect(page.getByRole('button', { name: 'Search Items' }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });
});
