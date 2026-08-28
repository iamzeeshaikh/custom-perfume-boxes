// Typed data access for products, categories, pages, home.
import productsRaw from '../data/products.json';
import categoriesRaw from '../data/categories.json';
import pagesRaw from '../data/pages.json';
import homeRaw from '../data/home.json';

export interface ImageRec {
  src: string; width: number; height: number;
  alt: string;
  /** Human-readable tooltip label; distinct from alt, which describes the image. */
  title?: string;
}
export interface FAQ { q: string; a: string; }
export interface CatRef { name: string; slug: string; }
export interface Product {
  id: string; slug: string; title: string; excerpt: string;
  content_html: string; specs_html: string; faqs: FAQ[];
  categories: CatRef[]; featured: ImageRec | null; gallery: ImageRec[];
  card: ImageRec | null; seo_title: string; seo_desc: string; focus_kw: string;
}
export interface Category {
  term_id: string; slug: string; name: string; description: string;
  products: string[]; seo_title: string; seo_desc: string;
}
export interface Page {
  slug: string; title: string; content_html: string;
  seo_title: string; seo_desc: string; wordcount: number;
}

export const products = productsRaw as unknown as Product[];
export const categories = categoriesRaw as unknown as Category[];
export const pages = pagesRaw as unknown as Page[];
export const home = homeRaw as unknown as {
  hero_eyebrow: string; hero_title: string; hero_sub: string;
  longform_html: string; faqs: FAQ[]; seo_title: string; seo_desc: string;
};

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getPage = (slug: string) => pages.find((p) => p.slug === slug);
export const productsInCategory = (slug: string) =>
  products.filter((p) => p.categories.some((c) => c.slug === slug));

// Primary category for breadcrumbs (first assigned category).
export const primaryCategory = (p: Product): CatRef | null =>
  p.categories[0] || null;

// Deterministic "related products": same category, excluding self, capped.
export function relatedProducts(p: Product, limit = 4): Product[] {
  const catSlugs = new Set(p.categories.map((c) => c.slug));
  const sameCat = products.filter(
    (x) => x.slug !== p.slug && x.categories.some((c) => catSlugs.has(c.slug))
  );
  const pool = sameCat.length >= limit
    ? sameCat
    : [...sameCat, ...products.filter((x) => x.slug !== p.slug && !sameCat.includes(x))];
  return pool.slice(0, limit);
}
