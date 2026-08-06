// JSON-LD builders. Only accurate schema — no fabricated ratings/prices/offers.
import { SITE_URL, BRAND } from './site';
import type { Product, FAQ } from './data';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: SITE_URL + '/',
    email: BRAND.email,
    telephone: BRAND.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '409 N 7th Ave Unit #529',
      addressLocality: 'Phoenix',
      addressRegion: 'AZ',
      postalCode: '85013',
      addressCountry: 'US',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: SITE_URL + '/',
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: SITE_URL + it.url,
    })),
  };
}

// Product schema WITHOUT offers/price/rating (quote-based; none are real).
export function productSchema(p: Product) {
  const img = p.featured ? SITE_URL + p.featured.src : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.excerpt || p.seo_desc,
    ...(img ? { image: img } : {}),
    category: p.categories[0]?.name,
    brand: { '@type': 'Brand', name: BRAND.name },
    url: `${SITE_URL}/product/${p.slug}/`,
  };
}

// FAQPage schema — must match visible FAQs exactly.
export function faqSchema(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
