import { test, expect } from '@playwright/test';
test('landing has a coherent title, usable CTA, and no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('More possibility.');
  await expect(page).toHaveTitle(/Nexora AI/);
  await expect(page.getByRole('link', { name: 'Get started for free' })).toHaveAttribute(
    'href',
    '/register',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('the product preview switches views without pretending to be live data', async ({
  page,
  isMobile,
}) => {
  await page.goto('/demo');
  await expect(
    page.getByText('Interactive preview · Illustrative data, not a live workspace'),
  ).toBeVisible();
  if (!isMobile) {
    await page.getByRole('button', { name: 'AI assistant', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'A fresh perspective, on demand.' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    await expect(page.getByText('Big ideas. Clear next steps.')).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Create a real workspace' })).toHaveAttribute(
    'href',
    '/register',
  );
});
test('navigation and public content routes work', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Features', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Everything you need.');
  for (const path of ['/solutions', '/pricing', '/about', '/contact', '/privacy', '/terms']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});
test('FAQ expands and pricing is honestly labeled', async ({ page }) => {
  await page.goto('/faq');
  await page.getByText('Can I use it without an AI API key?', { exact: true }).click();
  await expect(page.getByText(/Absolutely. Projects, tasks/)).toBeVisible();
  await page.goto('/pricing');
  await expect(
    page.getByText('Illustrative plans for a portfolio project.', { exact: false }),
  ).toBeVisible();
});
test('auth forms validate before contacting the API', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create your account', exact: true }).click();
  await expect(page.getByText('Use at least 10 characters')).toBeVisible();
  await page.getByLabel('Full name').fill('Alex Morgan');
  await page.getByLabel('Email address').fill('invalid-email');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByRole('button', { name: 'Create your account', exact: true }).click();
  await expect(page.getByText('Invalid email address')).toBeVisible();
});
test('404 recovers to the home page and SEO endpoints are present', async ({ page, request }) => {
  const response = await page.goto('/a-thought-that-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This idea is still out there.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL('/');
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/robots.txt')).status()).toBe(200);
});
