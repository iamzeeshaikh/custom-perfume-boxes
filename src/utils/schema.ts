// JSON-LD builders. Only accurate schema — no fabricated ratings/prices/offers.
import { SITE_URL, BRAND } from './site';
import type { Product, FAQ } from './data';
import merchantRaw from '../data/merchant.json';
import { unitPrice } from './price';

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
 * Shipping terms, lifted straight from the published Shipping Policy: free
 * shipping on all orders with no minimum, 2-3 business days handling, 3-6
 * business days transit.
 *
 * Returns are a different matter. Everything sold here is printed to the
 * customer's own artwork, so the Refund and Returns Policy permits no
 * change-of-mind return; defects, misprints and wrong items are remedied by
 * reprint or refund instead. schema.org has no field for a defect remedy, so
 * the honest encoding is MerchantReturnNotPermitted. Claiming a free 10-day
 * return here while the policy page excludes custom orders is precisely the
 * mismatch Google flags as misrepresentation.
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
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
};

// Product schema with a real Offer (per-unit wholesale price from the live
// Google Merchant Center feed). No fabricated reviews/ratings.
export function productSchema(p: Product) {
  const img = p.featured ? SITE_URL + p.featured.src : undefined;
  const url = `${SITE_URL}/product/${p.slug}/`;
  const m = merchant[p.slug];
  // Same helper the product page prints from, so the offer and the visible
  // price can never disagree.
  const { amount: priceVal, currency } = unitPrice(p.slug);
  const offers = {
    '@type': 'Offer',
    url,
    priceCurrency: currency,
    price: priceVal,
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

/**
 * Service graph for the state and city pages.
 *
 * Deliberately NOT LocalBusiness: we have no premises, staff or opening hours
 * in these places, and claiming otherwise is the kind of thing that gets a
 * merchant account suspended. Service with areaServed says the true thing —
 * we supply into that area from elsewhere.
 */
export function locationServiceSchema(input: {
  areaName: string;
  areaType: 'State' | 'City';
  containedInState?: string;
  url: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Custom perfume box printing for ${input.areaName}`,
    serviceType: 'Custom perfume packaging manufacturing',
    description: input.description,
    url: SITE_URL + input.url,
    provider: {
      '@type': 'Organization',
      name: BRAND.name,
      url: SITE_URL + '/',
      telephone: BRAND.phone,
      email: BRAND.email,
    },
    areaServed: {
      '@type': input.areaType,
      name: input.areaName,
      ...(input.containedInState
        ? { containedInPlace: { '@type': 'State', name: input.containedInState } }
        : {}),
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: '0.30',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '0.30',
        priceCurrency: 'USD',
        unitText: 'box',
        eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 100, unitText: 'box' },
      },
    },
  };
}

/** ItemList for the hand-picked products on a location page. */
export function itemListSchema(name: string, items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: SITE_URL + it.url,
    })),
  };
}

/** HowTo graph for the box specification tool. */
export function howToSchema(input: {
  name: string; description: string; url: string;
  steps: { name: string; text: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    url: SITE_URL + input.url,
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
