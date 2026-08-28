import type { APIRoute } from 'astro';
import { SITE_URL } from '../utils/site';
import { products, categories, pages } from '../utils/data';
import { BLOG_POSTS } from '../utils/blog';
import { RESOURCES } from '../utils/resources';
import { stateEntries, cityEntries, stateUrl, cityUrl } from '../utils/locations';

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

  urls.push({ loc: `${SITE_URL}/design-your-box/`, priority: '0.8', changefreq: 'monthly' });

  // Programmatic location pages: hub, then states, then cities.
  urls.push({ loc: `${SITE_URL}/perfume-boxes/`, priority: '0.7', changefreq: 'monthly' });
  for (const s of stateEntries()) {
    urls.push({ loc: `${SITE_URL}${stateUrl(s.slug)}`, priority: '0.6', changefreq: 'monthly' });
  }
  for (const c of cityEntries()) {
    urls.push({ loc: `${SITE_URL}${cityUrl(c.state, c.slug)}`, priority: '0.55', changefreq: 'monthly' });
  }

  urls.push({ loc: `${SITE_URL}/resources/`, priority: '0.7', changefreq: 'monthly' });
  for (const r of RESOURCES) {
    urls.push({ loc: `${SITE_URL}${r.url}`, priority: '0.6', changefreq: 'monthly' });
  }

  urls.push({ loc: `${SITE_URL}/blog/`, priority: '0.6', changefreq: 'weekly' });
  for (const post of BLOG_POSTS) {
    urls.push({ loc: `${SITE_URL}${post.url}`, priority: '0.6', changefreq: 'monthly' });
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
