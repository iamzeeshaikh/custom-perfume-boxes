// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const SITE = process.env.PUBLIC_SITE_URL || 'https://customperfumeboxes.com';

// A single sitemap is served by src/pages/sitemap.xml.ts (not @astrojs/sitemap,
// which splits into sitemap-index.xml + sitemap-0.xml).
export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static',
  adapter: vercel(),
  build: { format: 'directory' },
});
