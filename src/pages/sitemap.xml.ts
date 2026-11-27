import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// Temporary: list only the home page. Set to false to list every page again.
const HOME_ONLY = true;

// Dates of real content changes. Update when a page changes; unlisted pages get no <lastmod>.
const LASTMOD: Record<string, string> = { '/': '2026-11-25' };

export async function GET({ site }: APIContext) {
  const pages = Object.keys(import.meta.glob('./**/*.astro'))
    .map((f) => f.slice(1).replace(/(index)?\.astro$/, ''))
    .filter((p) => !p.includes('[') && p !== '/404')
    .map((p) => (p.endsWith('/') ? p : `${p}/`));
  const posts = (await getCollection('blog')).map((p) => `/blog/${p.id}/`);
  const paths = HOME_ONLY ? ['/'] : [...pages, ...posts].sort();

  const urls = paths.map((path) => {
    const lastmod = LASTMOD[path] ? `\n    <lastmod>${LASTMOD[path]}</lastmod>` : '';
    return `  <url>\n    <loc>${new URL(path, site).href}</loc>${lastmod}\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
