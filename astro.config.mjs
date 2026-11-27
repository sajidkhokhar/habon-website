import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Production URL. Change if the Cloudflare Pages subdomain differs.
const SITE = process.env.SITE_URL || 'https://habon-app.pages.dev';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
