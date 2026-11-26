import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Production URL. Change if the Cloudflare Pages subdomain differs.
const SITE = process.env.SITE_URL || 'https://habon-app.pages.dev';

// Temporary: list only the home page in the sitemap. Set to false to list every page again.
const HOME_ONLY_SITEMAP = true;

// Also publish the URL list at the conventional /sitemap.xml address.
const sitemapXml = {
  name: 'sitemap-xml',
  hooks: {
    'astro:build:done': ({ dir }) => copyFile(new URL('sitemap-0.xml', dir), new URL('sitemap.xml', dir)),
  },
};

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [sitemap({ filter: (p) => (HOME_ONLY_SITEMAP ? p === new URL('/', SITE).href : !p.includes('/404')) }), sitemapXml],
  vite: { plugins: [tailwindcss()] },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
