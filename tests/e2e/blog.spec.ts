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
  await expect(page.getByRole('link', { name: /All writing/ })).toHaveText('← All writing')
})
test('blog index back link has a single arrow (mobile menu)', async ({ page }) => {
  await page.goto('/blog')
  const menu = page.getByRole('button', { name: 'Menu' })
  test.skip(!(await menu.isVisible()), 'side nav shows the wordmark instead of a back link on desktop')
  await menu.click()
  await expect(page.getByRole('link', { name: /Home/ })).toHaveText('← Home')
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
