import { open } from './pw.mjs';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:4321';
const { browser, ctx } = await open(); const errs = [];
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
async function page(path) { const p = await ctx.newPage(); p.on('console', (m) => m.type() === 'error' && errs.push(path + ' ' + m.text())); p.on('pageerror', (e) => errs.push(path + ' ' + e)); await p.goto(base + path, { waitUntil: 'networkidle' }); return p; }
const pdf = async (p, sel, name) => { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click(sel)]); const f = '/tmp/pdfs/' + name + '.pdf'; await d.saveAs(f); const okk = fs.readFileSync(f).subarray(0, 5).toString() === '%PDF-' && fs.statSync(f).size > 2000; ok(okk, 'PDF ' + name + ' ' + fs.statSync(f).size + 'B'); };
fs.mkdirSync('/tmp/pdfs', { recursive: true });

// Streak calculator
let p = await page('/habit-streak-calculator/');
await p.fill('#sc-paste', '2026-11-20\n2026-11-21\n2026-11-22\n2026-11-24\n2026-11-25\n11/10/2026\nnotadate'); await p.click('[data-act=paste]');
let t = await p.textContent('#streak-root'); ok(/Added 6 new dates, 1 could not be read/.test(t), 'streak paste parse');
const stats = await p.$$eval('.stat b', (e) => e.map((x) => x.textContent)); console.log('  stats', stats);
ok(stats[0] === '2' && stats[1] === '3', 'streak current=2 longest=3');
await p.reload({ waitUntil: 'networkidle' }); ok((await p.$$eval('.stat b', (e) => e[0].textContent)) === '2', 'streak persisted');
await p.fill('#sc-start', '2026-11-01'); await p.click('[data-act=since]'); ok((await p.$$eval('.stat b', (e) => e[0].textContent)) === '25', 'fill range gives 25');

// Challenge
p = await page('/30-day-habit-challenge/');
await p.selectOption('#ch-pick', 'walk'); await p.click('[data-day="1"]'); await p.click('[data-day="2"]');
ok((await p.textContent('#challenge-root')).includes('Walk 20 minutes a day') && (await p.$$eval('.stat b', (e) => e[0].textContent)) === '2', 'challenge select + 2 days');
await p.reload({ waitUntil: 'networkidle' }); ok((await p.$$eval('[data-day][aria-pressed=true]', (e) => e.length)) === 2, 'challenge persisted');
await pdf(p, '[data-act=pdf]', 'challenge');

// Routine planner
p = await page('/daily-routine-planner/');
await p.click('[data-act=example]'); const n0 = await p.$$eval('li[data-id]', (e) => e.length); ok(n0 === 9, 'routine example 9 items');
await p.fill('[data-add=morning] [name=text]', 'Take vitamins'); await p.click('[data-add=morning] button'); ok((await p.$$eval('[data-list=morning] li', (e) => e.length)) === 5, 'add task');
const first = await p.$eval('[data-list=morning] li input[data-f=text]', (e) => e.value);
await p.click('[data-list=morning] li:first-child [data-act=down]'); const sec = await p.$eval('[data-list=morning] li:nth-child(2) input[data-f=text]', (e) => e.value); ok(first === sec, 'move down via arrow');
// drag: first evening item onto afternoon list
const src = p.locator('[data-list=evening] li').first(); const dst = p.locator('[data-list=afternoon] li').first();
const txt = await src.locator('input[data-f=text]').inputValue(); await src.dragTo(dst);
ok((await p.$$eval('[data-list=afternoon] li input[data-f=text]', (e) => e.map((x) => x.value))).includes(txt), 'drag-and-drop across sections: ' + txt);
await p.click('[data-act=done] >> nth=0'); await p.reload({ waitUntil: 'networkidle' }); ok((await p.$$eval('li[data-id]', (e) => e.length)) === 10 && (await p.$$eval('[data-act=done][aria-pressed=true]', (e) => e.length)) === 1, 'routine persisted');
await pdf(p, '[data-act=pdf]', 'routine');

// Weekly + monthly grids
for (const [path, name] of [['/weekly-habit-planner/', 'weekly-planner'], ['/monthly-habit-calendar/', 'monthly-calendar']]) {
  p = await page(path); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle' }); await p.fill('#gr-new', 'Stretch'); await p.click('[data-add] button'); await p.fill('#gr-new', 'Read'); await p.click('[data-add] button');
  await p.click('.check >> nth=0'); ok((await p.$$eval('.check[aria-pressed=true]', (e) => e.length)) === 1, name + ' toggle');
  await p.reload({ waitUntil: 'networkidle' }); ok((await p.$$eval('.check[aria-pressed=true]', (e) => e.length)) === 1, name + ' persisted');
  await pdf(p, '[data-act=pdf]', name);
}

// Goals
p = await page('/goal-planner/'); await p.fill('#g-title', 'Run a 5K'); await p.click('[data-new] button[type=submit]');
await p.fill('[data-addms] [name=text]', 'Run 10 minutes'); await p.click('[data-addms] button'); await p.fill('[data-addms] [name=text]', 'Run 3 km'); await p.click('[data-addms] button');
await p.check('[data-ms] >> nth=0'); ok((await p.textContent('#goals-root')).includes('50%'), 'goal progress 50%');
await p.reload({ waitUntil: 'networkidle' }); ok((await p.textContent('#goals-root')).includes('Run a 5K') && (await p.textContent('#goals-root')).includes('50%'), 'goal persisted');

// Ideas -> tracker
p = await page('/habit-ideas-generator/'); ok((await p.$$eval('#ideas-root li', (e) => e.length)) === 8, '8 ideas'); await p.click('[data-cat=Sleep]'); ok((await p.textContent('#ideas-root')).includes('Sleep'), 'category filter');
const idea = await p.$eval('#ideas-root li p.font-semibold', (e) => e.textContent); await p.click('[data-act=add] >> nth=0');
p = await page('/online-habit-tracker/'); ok((await p.textContent('#tracker-root')).includes(idea), 'idea landed in tracker: ' + idea);

// Routine generators + send to planner
for (const k of ['morning', 'evening']) {
  p = await page(`/${k}-routine-generator/`); await p.click('form button[type=submit]'); const rows = await p.$$eval('#rg-out ol li', (e) => e.length); ok(rows >= 3, k + ' routine ' + rows + ' steps');
  await p.click('[data-act=send]'); ok((await p.textContent('#rg-out')).includes('Sent'), k + ' sent to planner');
}
p = await page('/daily-routine-planner/'); ok((await p.$$eval('[data-list=evening] li', (e) => e.length)) >= 3, 'planner has generated routines');

// Consistency
p = await page('/habit-consistency-calculator/'); ok((await p.textContent('#cc-out')).includes('70%'), '21/30 = 70%'); await p.fill('#cc-done', '29'); ok((await p.textContent('#cc-out')).includes('97%'), '29/30 = 97%');

// PDF presets hub
p = await page('/habit-tracker-pdf/'); let i = 0;
for (const sel of ['weekly:letter:grid', 'monthly:a4:grid', 'challenge:letter:grid']) await pdf(p, `[data-pdf-preset="${sel}"]`, 'preset-' + sel.replaceAll(':', '-'));
// Printable monthly + print path
p = await page('/printable-habit-tracker/'); await p.locator('label:has([name=pt-kind][value=monthly])').click(); await p.waitForTimeout(600);
ok(await p.$eval('#pt-frame', (f) => f.src.startsWith('blob:')), 'live preview iframe has blob PDF');
await p.reload({ waitUntil: 'networkidle' }); ok(await p.$eval('[name=pt-kind][value=monthly]', (e) => e.checked), 'printable options persisted');

// Theme toggle
p = await page('/'); await p.click('#theme-toggle'); ok((await p.getAttribute('html', 'data-theme')) === 'dark', 'theme toggles to dark'); await p.reload(); ok((await p.getAttribute('html', 'data-theme')) === 'dark', 'dark persists');
// App store link
const hrefs = await p.$$eval('a[data-track=app_store_click]', (e) => [...new Set(e.map((a) => a.href))]); ok(hrefs.length === 1 && hrefs[0].includes('id6828774437'), 'all App Store buttons point to id6828774437');
ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs));
await browser.close();
