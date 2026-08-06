// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const SITE = process.env.PUBLIC_SITE_URL || 'https://customperfumeboxes.com';

// Pages that must never appear in the sitemap (functional/retired/utility)
const SITEMAP_EXCLUDE = [
  `${SITE}/thank-you/`,
  `${SITE}/404/`,
];

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static',
  adapter: vercel(),
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDE.includes(page),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
});
