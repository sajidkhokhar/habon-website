import { open } from './pw.mjs';
const [url, out, w = '1280', h = '900', full = '0', theme = 'light'] = process.argv.slice(2);
const { browser, ctx } = await open({ viewport: { width: +w, height: +h }, colorScheme: theme });
const p = await ctx.newPage(); const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle' });
await p.screenshot({ path: out, fullPage: full === '1' });
console.log('errors:', errs);
await browser.close();
