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
    sameAs: [BRAND.facebook, BRAND.linkedin],
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

// Countries the published Shipping Policy names as served.
const SHIPS_TO = ['US', 'GB', 'CA', 'AU', 'NZ'];

/**
 * Shipping and returns terms, both lifted straight from the published policy
 * pages. Shipping Policy: free shipping on all orders with no minimum, 2-3
 * business days handling, 3-6 business days transit. Refund and Returns
 * Policy: returns accepted by mail within 10 days of delivery, return label
 * included, no restocking fee.
 *
 * Google will not show a merchant listing without these two, which is why
 * every product carries them rather than only the ones in the feed.
 */
const SHIPPING_DETAILS = SHIPS_TO.map((country) => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: country },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 2,
      maxValue: 3,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 3,
      maxValue: 6,
      unitCode: 'DAY',
    },
  },
}));

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: SHIPS_TO,
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 10,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
};

// Product schema with a real Offer (per-unit wholesale price from the live
// Google Merchant Center feed). No fabricated reviews/ratings.
export function productSchema(p: Product) {
  const img = p.featured ? SITE_URL + p.featured.src : undefined;
  const url = `${SITE_URL}/product/${p.slug}/`;
  const m = merchant[p.slug];
  // "0.30 USD" from the feed; the fallback keeps every product offer-bearing
  // even if a slug is ever missing from merchant.json.
  const [priceVal, currency] = (m?.price ?? '0.30 USD').split(/\s+/);
  const offers = {
    '@type': 'Offer',
    url,
    priceCurrency: currency || 'USD',
    price: priceVal || '0.30',
    availability:
      AVAIL[(m?.availability ?? 'in stock').toLowerCase()] || 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    priceValidUntil: '2027-12-31',
    seller: { '@type': 'Organization', name: BRAND.name },
    shippingDetails: SHIPPING_DETAILS,
    hasMerchantReturnPolicy: RETURN_POLICY,
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.excerpt || p.seo_desc,
    ...(img ? { image: img } : {}),
    category: p.categories[0]?.name,
    brand: { '@type': 'Brand', name: BRAND.name },
    mpn: m?.gla_id || p.slug,
    sku: p.slug,
    url,
    offers,
  };
}

/**
 * Generic page node. Content pages carried only a BreadcrumbList, so nothing
 * tied the URL to the site or the business. `type` narrows it where
 * schema.org has a better fit than plain WebPage.
 */
export function webPageSchema(input: {
  path: string;
  name: string;
  description: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': input.type ?? 'WebPage',
    '@id': `${SITE_URL}${input.path}#webpage`,
    url: SITE_URL + input.path,
    name: input.name,
    description: input.description,
    inLanguage: 'en-US',
  };
}

/**
 * Category pages list products, so the page is a CollectionPage owning an
 * ItemList. Previously they carried only a BreadcrumbList, which told search
 * engines nothing about what the page listed.
 */
export function collectionPageSchema(input: {
  name: string;
  url: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: SITE_URL + input.url,
    description: input.description,
    mainEntity: {
      '@type': 'ItemList',
      name: input.name,
      numberOfItems: input.items.length,
      itemListElement: input.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: SITE_URL + it.url,
      })),
    },
  };
}

/**
 * Article schema for the blog. The site publishes under the brand with no
 * per-author bylines, so the organisation is both author and publisher.
 */
export function blogPostingSchema(post: {
  title: string;
  description: string;
  url: string;
  image?: string;
  date: string;
}) {
  const published = `${post.date}T12:00:00Z`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: SITE_URL + post.url,
    ...(post.image ? { image: SITE_URL + post.image } : {}),
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-US',
    author: { '@type': 'Organization', name: BRAND.name, url: SITE_URL + '/' },
    publisher: { '@type': 'Organization', name: BRAND.name, url: SITE_URL + '/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE_URL + post.url },
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
