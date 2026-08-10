import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'tmp');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err)));
page.on('requestfailed', (req) => {
  const url = req.url();
  if (url.includes('/_next/') || url.includes('.js')) {
    failedRequests.push({ url, error: req.failure()?.errorText });
  }
});

const url = 'http://127.0.0.1:3000/sign-in?force=1';
const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
console.log('status', response?.status());

await page.waitForSelector('h1:has-text("Sign in")', { timeout: 15000 });
await page.waitForSelector('[data-testid="sign-in-submit"]', { timeout: 15000 });

const visible = await page.locator('h1:has-text("Sign in")').isVisible();
const btnVisible = await page.locator('[data-testid="sign-in-submit"]').isVisible();
const btnText = await page.locator('[data-testid="sign-in-submit"]').innerText();
console.log('h1Visible', visible, 'btnVisible', btnVisible, 'btnText', JSON.stringify(btnText));

await page.fill('#email', 'demo@virtualgallery.dev');
await page.fill('#password', 'Demo1234!');
await page.screenshot({ path: path.join(outDir, 'sign-in-visible.png'), fullPage: true });
console.log('screenshot', path.join(outDir, 'sign-in-visible.png'));

const navPromise = page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30000 }).then(() => 'nav').catch((e) => e.message);
await page.click('[data-testid="sign-in-submit"]');
const navResult = await navPromise;
await page.waitForTimeout(1500);

const finalUrl = page.url();
const errorText = await page.locator('[role="alert"], [data-slot="alert"]').filter({ hasText: /Couldn|Incorrect|Network|emulator/i }).first().textContent().catch(() => null);
console.log('navResult', navResult);
console.log('finalUrl', finalUrl);
console.log('errorAlert', errorText);
await page.screenshot({ path: path.join(outDir, 'sign-in-after-submit.png'), fullPage: true });

console.log('consoleErrors', JSON.stringify(consoleErrors, null, 2));
console.log('pageErrors', JSON.stringify(pageErrors, null, 2));
console.log('failedJs', JSON.stringify(failedRequests, null, 2));

const ok =
  visible &&
  btnVisible &&
  btnText.trim() === 'Sign in' &&
  pageErrors.length === 0 &&
  failedRequests.length === 0 &&
  (/\/(dashboard|onboarding)/.test(finalUrl) || Boolean(errorText));

console.log('PROOF_OK', ok);
await browser.close();
process.exit(ok ? 0 : 1);
