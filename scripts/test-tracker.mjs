import { open } from './pw.mjs';
const base = process.env.BASE || 'http://localhost:4321';
const { browser, ctx } = await open(); const p = await ctx.newPage(); const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };
await p.goto(base + '/online-habit-tracker/', { waitUntil: 'networkidle' });
await p.click('[data-act=starter][data-i="0"]'); await p.click('[data-act=add]');
await p.fill('#hf-name', 'Gym session'); await p.selectOption('#hf-freq', 'weekly'); await p.fill('#hf-target', '3'); await p.click('button[value=save]');
await p.waitForTimeout(300); ok(await p.locator('#tracker-root ul li').count() === 2, 'two habits listed');
await p.click('[data-act=toggle] >> nth=0');
ok(await p.locator('[data-act=toggle][aria-pressed=true]').count() === 1, 'toggle on');
await p.reload({ waitUntil: 'networkidle' });
ok(await p.locator('[data-act=toggle][aria-pressed=true]').count() === 1, 'persisted after reload');
ok((await p.textContent('#tracker-root')).includes('1 days') || (await p.textContent('#tracker-root')).includes('1 '), 'streak shown');
await p.click('[data-act=prev]'); await p.click('[data-act=toggle] >> nth=0'); // yesterday on first habit
ok((await p.textContent('#tracker-root ul li')).includes('2'), 'streak 2 after back-fill');
for (const v of ['week', 'month', 'stats']) { await p.click(`[data-v=${v}]`); ok(await p.locator('[role=tabpanel]').innerText().then((t) => t.length > 20), v + ' view renders'); }
await p.screenshot({ path: '/tmp/tracker-stats.png', fullPage: false });
await p.click('[data-v=month]'); await p.screenshot({ path: '/tmp/tracker-month.png' });
await p.click('[data-v=today]'); await p.click('[data-act=edit] >> nth=1'); await p.click('[data-act=delete]', { force: true }).catch(() => {});
p.once('dialog', (d) => d.accept());
ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs));
await browser.close();
