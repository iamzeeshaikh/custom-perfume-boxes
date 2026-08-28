/**
 * FAQs for the content, policy and listing pages.
 *
 * Every indexable page on the site carries a visible FAQ block and matching
 * FAQPage schema. Product, category, location, resource and blog pages each
 * hold their own FAQs alongside their own content; this file covers the
 * remainder, which have no natural home for them.
 */
import raw from '../data/page-faqs.json';
import type { FAQ } from './data';

const faqs = raw as unknown as Record<string, FAQ[]>;

export const pageFaqs = (key: string): FAQ[] => faqs[key] ?? [];
