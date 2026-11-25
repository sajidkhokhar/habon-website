// Shared Playwright helper using the locally installed Chrome (no browser download needed).
import { chromium } from 'playwright-core';
export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export async function open(opts = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...opts });
  return { browser, ctx };
}
