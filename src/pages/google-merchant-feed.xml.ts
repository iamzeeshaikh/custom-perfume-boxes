import type { APIRoute } from 'astro';
import { SITE_URL, BRAND } from '../utils/site';
import { products } from '../utils/data';
import merchantRaw from '../data/merchant.json';

export const prerender = true;

// Google Merchant Center product feed (RSS 2.0 + g: namespace).
// Regenerated on every build/deploy from products.json + merchant.json, so it
// auto-updates. Images point to the new sanitized assets (not old wp-content).
const merchant = merchantRaw as Record<string, {
  gla_id: string; price: string; availability: string;
  brand: string; product_type: string; shipping_country: string;
}>;

function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function stripTags(s: string) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = () => {
  const items = products
    .map((p) => {
      const m = merchant[p.slug];
      if (!m) return '';
      const link = `${SITE_URL}/product/${p.slug}/`;
      const image = p.featured ? `${SITE_URL}${p.featured.src}` : '';
      const addl = (p.gallery || [])
        .slice(0, 10)
        .map((g) => `    <g:additional_image_link>${esc(SITE_URL + g.src)}</g:additional_image_link>`)
        .join('\n');
      const desc = stripTags(p.excerpt || p.seo_desc || p.title).slice(0, 4900);
      return `  <item>
    <g:id>${esc(m.gla_id)}</g:id>
    <title>${esc(p.title)}</title>
    <description>${esc(desc)}</description>
    <link>${esc(link)}</link>
    <g:image_link>${esc(image)}</g:image_link>
${addl}
    <g:availability>${esc(m.availability)}</g:availability>
    <g:price>${esc(m.price)}</g:price>
    <g:condition>new</g:condition>
    <g:brand>${esc(m.brand || BRAND.name)}</g:brand>
    <g:mpn>${esc(m.gla_id)}</g:mpn>
    <g:identifier_exists>no</g:identifier_exists>
    <g:product_type>${esc(m.product_type)}</g:product_type>
    <g:google_product_category>2915</g:google_product_category>
    <g:shipping>
      <g:country>${esc(m.shipping_country)}</g:country>
      <g:price>0.00 USD</g:price>
    </g:shipping>
  </item>`;
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(BRAND.name)}</title>
    <link>${SITE_URL}/</link>
    <description>Custom perfume packaging — product feed</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
