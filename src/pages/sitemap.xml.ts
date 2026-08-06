import type { APIRoute } from 'astro';
import { SITE_URL } from '../utils/site';
import { products, categories, pages } from '../utils/data';

export const prerender = true;

// Pages excluded from the sitemap (utility / non-indexable).
const EXCLUDE = new Set(['thank-you']);

export const GET: APIRoute = () => {
  const urls: { loc: string; priority: string; changefreq: string }[] = [];

  urls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' });
  urls.push({ loc: `${SITE_URL}/products/`, priority: '0.9', changefreq: 'weekly' });

  for (const p of products) {
    urls.push({ loc: `${SITE_URL}/product/${p.slug}/`, priority: '0.8', changefreq: 'weekly' });
  }
  for (const c of categories) {
    urls.push({ loc: `${SITE_URL}/product-category/${c.slug}/`, priority: '0.7', changefreq: 'weekly' });
  }
  for (const pg of pages) {
    if (EXCLUDE.has(pg.slug)) continue;
    urls.push({ loc: `${SITE_URL}/${pg.slug}/`, priority: '0.5', changefreq: 'monthly' });
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
