/**
 * Single source of truth for the unit price a shopper sees.
 *
 * The Merchant Center feed, the Product/Offer JSON-LD and the price printed on
 * the product page all read from here, so a price can never appear in Google
 * that the landing page does not also show. Divergence between the two is what
 * Google's Misrepresentation check looks for.
 */
import merchantRaw from '../data/merchant.json';

const merchant = merchantRaw as Record<string, { price: string }>;

// Feed format is "0.30 USD".
const FALLBACK = '0.30 USD';

export function unitPrice(slug: string): { amount: string; currency: string; raw: string } {
  const raw = merchant[slug]?.price ?? FALLBACK;
  const [amount, currency] = raw.split(/\s+/);
  return { amount: amount || '0.30', currency: currency || 'USD', raw };
}
