import type { APIRoute } from 'astro';
import { SITE_URL } from '../utils/site';

export const prerender = true;

export const GET: APIRoute = () => {
  const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true';
  const body = indexable
    ? `User-agent: *
Allow: /

# Retired WordPress / attack surface — disallow crawling of legacy paths
Disallow: /wp-admin/
Disallow: /wp-login.php
Disallow: /xmlrpc.php
Disallow: /wp-json/
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /*?add-to-cart=
Disallow: /*?orderby=
Disallow: /*?filter=

Sitemap: ${SITE_URL}/sitemap-index.xml
`
    : `User-agent: *
Disallow: /
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
