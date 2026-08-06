// JSON-LD builders. Only accurate schema — no fabricated ratings/prices/offers.
import { SITE_URL, BRAND } from './site';
import type { Product, FAQ } from './data';
import merchantRaw from '../data/merchant.json';

const merchant = merchantRaw as Record<string, {
  gla_id: string; price: string; availability: string;
  brand: string; product_type: string; shipping_country: string;
}>;

const AVAIL: Record<string, string> = {
  'in stock': 'https://schema.org/InStock',
  'out of stock': 'https://schema.org/OutOfStock',
  'preorder': 'https://schema.org/PreOrder',
};

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

// Product schema with a real Offer (per-unit wholesale price from the live
// Google Merchant Center feed). No fabricated reviews/ratings.
export function productSchema(p: Product) {
  const img = p.featured ? SITE_URL + p.featured.src : undefined;
  const url = `${SITE_URL}/product/${p.slug}/`;
  const m = merchant[p.slug];
  let offers;
  if (m) {
    const [priceVal, currency] = m.price.split(/\s+/); // "0.40 USD"
    offers = {
      '@type': 'Offer',
      url,
      priceCurrency: currency || 'USD',
      price: priceVal || '0.40',
      availability: AVAIL[m.availability.toLowerCase()] || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: '2027-12-31',
      seller: { '@type': 'Organization', name: BRAND.name },
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.excerpt || p.seo_desc,
    ...(img ? { image: img } : {}),
    category: p.categories[0]?.name,
    brand: { '@type': 'Brand', name: BRAND.name },
    mpn: m?.gla_id || p.slug,
    url,
    ...(offers ? { offers } : {}),
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
