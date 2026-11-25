import { open } from './pw.mjs';
const base = process.env.BASE || 'http://localhost:4321';
const jobs = [['/', 1280, 'light', 1], ['/', 390, 'light', 1], ['/printable-habit-tracker/', 1280, 'light', 0], ['/daily-routine-planner/', 1280, 'dark', 0], ['/30-day-habit-challenge/', 390, 'light', 0], ['/blog/how-to-build-better-habits/', 1280, 'light', 0], ['/features/', 390, 'dark', 0], ['/habit-tracker-templates/', 1280, 'light', 0]];
const { browser } = await open();
let i = 0;
for (const [url, w, theme, full] of jobs) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 600 ? 900 : 844 }, colorScheme: theme, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); await p.goto(base + url, { waitUntil: 'networkidle' });
  if (url === '/daily-routine-planner/') { await p.click('[data-act=example]'); }
  if (url === '/30-day-habit-challenge/') { await p.selectOption('#ch-pick', 'read'); for (const d of [1,2,3,4,5]) await p.click(`[data-day="${d}"]`); }
  await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/v${i++}.png`, fullPage: !!full }); await ctx.close();
}
await browser.close();
