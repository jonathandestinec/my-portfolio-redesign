import { expect, test, type Page } from '@playwright/test'

async function openMenuIfCollapsed(page: Page) {
  const menu = page.getByRole('button', { name: 'Menu' })
  if (await menu.isVisible()) await menu.click()
}

test('blog index lists posts and opens one', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('link', { name: /AgroHub/i }).first().click()
  await expect(page).toHaveURL(/\/blog\/agrohub-payment-held-until-delivery$/)
  await expect(page.getByRole('heading', { level: 1, name: /AgroHub/i })).toBeVisible()
  await openMenuIfCollapsed(page)
  await expect(page.getByRole('link', { name: /All writing/ }).first()).toHaveText('← All writing')
})
test('blog index is marked current in the menu', async ({ page }) => {
  await page.goto('/blog')
  await openMenuIfCollapsed(page)
  const dialog = page.getByRole('dialog')
  const menu = (await dialog.isVisible()) ? dialog : page.getByRole('navigation', { name: 'Primary' })
  await expect(menu.getByRole('link', { name: 'Writing', exact: true })).toHaveAttribute('aria-current', 'page')
})
test('unknown post 404s', async ({ page }) => {
  const r = await page.goto('/blog/nope')
  expect(r!.status()).toBe(404)
})

test('post renders without JS and highlights code', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/blog/agrohub-payment-held-until-delivery')
  await expect(page.locator('article h2').first()).toBeVisible()
  await expect(page.locator('article pre.shiki')).toBeVisible()
  await ctx.close()
})
