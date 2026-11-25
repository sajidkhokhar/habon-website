import { open } from './pw.mjs';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:4321';
const { browser, ctx } = await open(); const p = await ctx.newPage(); const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(base + '/printable-habit-tracker/', { waitUntil: 'networkidle' });
fs.mkdirSync('/tmp/pdfs', { recursive: true });
let i = 0;
for (const [kind, paper, design] of [['weekly', 'letter', 'grid'], ['weekly', 'a4', 'bold'], ['monthly', 'a4', 'dots'], ['monthly', 'letter', 'minimal']]) {
  await p.locator(`label:has([name=pt-kind][value=${kind}])`).click(); await p.selectOption('#pt-paper', paper); await p.selectOption('#pt-design', design);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#pt-dl')]);
  const f = `/tmp/pdfs/${kind}-${paper}-${design}.pdf`; await dl.saveAs(f);
  const hdr = fs.readFileSync(f).subarray(0, 5).toString();
  console.log(hdr === '%PDF-' ? 'PASS' : 'FAIL', dl.suggestedFilename(), fs.statSync(f).size + 'B');
}
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/printable.png' });
console.log('errors', errs);
await browser.close();
