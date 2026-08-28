/**
 * Hand-written editorial for each product category.
 *
 * The eight categories deliberately do not share a shape: section counts run
 * from three to five, every H2 is unique across the whole set, and each one is
 * written from a different angle (finish stacking for luxury, press behaviour
 * for color, substrate specs for material, unit economics for subscription and
 * so on). Anything missing here falls back to the category's SEO description
 * rather than to generated filler.
 */
import raw from '../data/category-content.json';
import type { FAQ } from './data';

export interface CategorySection { h2: string; html: string }
export interface CategoryContent {
  layout: string;
  h1: string;
  lede: string;
  sections: CategorySection[];
  faqs: FAQ[];
}

const content = raw as unknown as Record<string, CategoryContent>;

export const getCategoryContent = (slug: string): CategoryContent | undefined =>
  content[slug];

export const CATEGORY_CONTENT_SLUGS = Object.keys(content);
