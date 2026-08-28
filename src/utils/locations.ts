/**
 * Location data access for the programmatic state and city pages.
 *
 * Every location carries its own hand-written lede, sections, product picks and
 * FAQs. Nothing here is generated from a template string: the page renders
 * whatever sections a location happens to define, and section counts, headings
 * and voice differ per location by design.
 */
import raw from '../data/locations.json';
import { getProduct, type Product } from './data';

export interface LocSection { h2: string; html: string }
export interface LocFAQ { q: string; a: string }
export interface LocPick { h2: string; intro: string; items: [string, string, string][] }

interface LocBase {
  meta_title: string;
  meta_desc: string;
  lede: string;
  sections: LocSection[];
  picks: LocPick;
  faqs: LocFAQ[];
}
export interface StateLoc extends LocBase { name: string; abbr: string; title: string }
export interface CityLoc extends LocBase { name: string; state: string }

const data = raw as unknown as {
  states: Record<string, StateLoc>;
  cities: Record<string, CityLoc>;
};

export const STATE_SLUGS = Object.keys(data.states).sort();
export const CITY_SLUGS = Object.keys(data.cities).sort();

export const getState = (slug: string) => data.states[slug];
export const getCity = (slug: string) => data.cities[slug];

export const stateEntries = () =>
  STATE_SLUGS.map((slug) => ({ slug, ...data.states[slug] }));

export const citiesInState = (stateSlug: string) =>
  CITY_SLUGS.filter((s) => data.cities[s].state === stateSlug)
    .map((slug) => ({ slug, ...data.cities[slug] }));

export const cityEntries = () =>
  CITY_SLUGS.map((slug) => ({ slug, ...data.cities[slug] }));

export const stateUrl = (slug: string) => `/perfume-boxes/${slug}/`;
export const cityUrl = (stateSlug: string, citySlug: string) =>
  `/perfume-boxes/${stateSlug}/${citySlug}/`;

/** Resolves a pick tuple to the real product, so a bad slug fails the build. */
export function resolvePicks(picks: LocPick): {
  product: Product; anchor: string; why: string;
}[] {
  return picks.items.map(([slug, anchor, why]) => {
    const product = getProduct(slug);
    if (!product) throw new Error(`locations.json references unknown product "${slug}"`);
    return { product, anchor, why };
  });
}
