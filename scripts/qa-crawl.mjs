import { open } from './pw.mjs';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:4321';
const site = process.env.SITE || 'https://habon.pages.dev';
const idx = await (await fetch(base + '/sitemap-index.xml')).text();
const sm = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(site, base));
let urls = [];
for (const s of sm) { const x = await (await fetch(s)).text(); urls.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(site, ''))); }
urls = [...new Set(urls)].sort();
console.log('sitemap urls:', urls.length);
const { browser, ctx } = await open(); const issues = []; const linkSet = new Set(); const titles = new Map(); const descs = new Map();
const p = await ctx.newPage();
let cur = '';
p.on('console', (m) => { if (m.type() === 'error') issues.push([cur, 'console', m.text()]); });
p.on('pageerror', (e) => issues.push([cur, 'pageerror', String(e)]));
p.on('requestfailed', (r) => issues.push([cur, 'reqfail', r.url()]));
for (const u of urls) {
  cur = u; const r = await p.goto(base + u, { waitUntil: 'networkidle' });
  if (r.status() !== 200) issues.push([u, 'status', r.status()]);
  const d = await p.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'INVALID'; } });
    return {
      title: document.title, desc: q('meta[name=description]')?.content ?? '', canon: q('link[rel=canonical]')?.href ?? '', h1: document.querySelectorAll('h1').length,
      og: !!q('meta[property="og:image"]'), banner: !!q('meta[name="apple-itunes-app"]'), ld,
      noalt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/') && !h.startsWith('//')),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      heads: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]),
    };
  });
  d.links.forEach((l) => linkSet.add(l.split('#')[0].split('?')[0]));
  if (d.h1 !== 1) issues.push([u, 'h1count', d.h1]);
  if (d.title.length < 20 || d.title.length > 70) issues.push([u, 'title-length', d.title.length + ' ' + d.title]);
  if (d.desc.length < 70 || d.desc.length > 165) issues.push([u, 'desc-length', d.desc.length]);
  if (!d.canon.endsWith(u)) issues.push([u, 'canonical', d.canon]);
  if (!d.og || !d.banner) issues.push([u, 'og/banner', '']);
  if (d.ld.includes('INVALID')) issues.push([u, 'jsonld-invalid', '']);
  if (d.noalt) issues.push([u, 'img-no-alt', d.noalt]);
  if (d.overflow) issues.push([u, 'h-overflow', '']);
  for (let i = 1; i < d.heads.length; i++) if (d.heads[i] - d.heads[i - 1] > 1) { issues.push([u, 'heading-skip', d.heads.join('')]); break; }
  if (titles.has(d.title)) issues.push([u, 'dup-title', titles.get(d.title)]); titles.set(d.title, u);
  if (descs.has(d.desc)) issues.push([u, 'dup-desc', descs.get(d.desc)]); descs.set(d.desc, u);
}
cur = 'links';
for (const l of linkSet) { if (/\.(xml|svg|png|ico|webmanifest|txt)$/.test(l) || !l) continue; const r = await fetch(base + l); if (r.status !== 200) issues.push(['(links)', 'broken-link', l + ' ' + r.status]); }
const toCheck = ['/robots.txt', '/sitemap-index.xml', '/rss.xml', '/manifest.webmanifest', '/app-store-badge.svg', '/og-default.png', '/favicon.ico', '/apple-touch-icon.png', '/nonexistent-page/'];
for (const t of toCheck) { const r = await fetch(base + t); console.log(t, r.status); }
console.log('internal link targets checked:', linkSet.size);
console.log(issues.length ? issues.map((i) => i.join(' | ')).join('\n') : 'NO ISSUES');
await browser.close();
