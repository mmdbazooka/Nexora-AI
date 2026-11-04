import { test, expect } from '@playwright/test';
test('real account → project → task → note → logout persists through MongoDB', async ({ page }) => {
  const unique = Date.now();
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E Explorer');
  await page.getByLabel('Email address').fill(`e2e-${unique}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill(`e2e-strong-password-${unique}`);
  await page.getByRole('button', { name: 'Create your account', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: /Good to see you/ })).toBeVisible();
  await page.getByRole('link', { name: 'Projects', exact: true }).first().click();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name').fill('A real E2E project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: 'A real E2E project' }) })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A real E2E project');
  await page.getByRole('button', { name: 'Task', exact: true }).click();
  await page.getByLabel('Task title').fill('Verify persistence');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByLabel('Status for Verify persistence').selectOption('done');
  await page.reload();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByLabel('Status for Verify persistence')).toHaveValue('done');
  await page.getByRole('link', { name: 'Notes & docs', exact: true }).click();
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title').fill('Persisted thoughts');
  await page.locator('.tiptap').fill('A real note saved to MongoDB.');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Note title')).toHaveValue('Persisted thoughts');
  await expect(page.locator('.tiptap')).toContainText('A real note saved to MongoDB.');
  await page.getByRole('link', { name: 'AI assistant', exact: false }).first().click();
  await expect(
    page.getByText('Your thinking partner isn’t connected yet.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});
