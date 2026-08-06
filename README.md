# Custom Perfume Boxes — Astro

Static marketing/catalog site for **customperfumeboxes.com**, rebuilt in Astro after the
previous WordPress installation was compromised. No PHP, no WordPress runtime, no database.

## Stack
- **Astro** (static output) + `@astrojs/vercel` adapter
- **TypeScript**, minimal client JS
- **sharp** for image processing (build-time)
- **nodemailer** in one serverless function for the quote form
- `@astrojs/sitemap` for the sitemap

## Develop
```bash
npm install
cp .env.example .env.local   # fill in SMTP + set PUBLIC_INDEXABLE as needed
npm run dev
```

## Build
```bash
npm run build   # astro build + scripts/patch-vercel.mjs (headers + 410 routes)
```
The build runs a post-step (`scripts/patch-vercel.mjs`) that injects security headers,
HTTP 410 routes for retired WordPress paths, and the old-sitemap 301 into the generated
Vercel Build Output config (the adapter ignores root `vercel.json`).

## Environment variables
See `.env.example`. Summary:
- `PUBLIC_SITE_URL` — canonical origin (default `https://customperfumeboxes.com`).
- `PUBLIC_INDEXABLE` — `"true"` = production (`index,follow` + crawlable robots.txt); anything else = preview (`noindex,nofollow` + `Disallow: /`).
- `SMTP_HOST/PORT/USER/PASS`, `QUOTE_TO`, `QUOTE_FROM`, `ALLOWED_ORIGINS` — quote form delivery (server-only).

Set these in Vercel → Project → Settings → Environment Variables. Never commit real secrets.

## Structure
```
src/
  components/   Header, Footer, MobileMenu, NavLink, Breadcrumbs, ProductCard,
                ProductGallery, QuoteForm, ProductSpecifications, ProductFAQ,
                RelatedProducts, TrustBadges, BenefitsBar
  layouts/      BaseLayout, ProductLayout
  pages/        index, products/, product/[slug], product-category/[slug],
                [page] (about/policies), contact-us, thank-you, 404,
                api/quote (serverless), gone (410), robots.txt
  data/         products.json, categories.json, pages.json, home.json  (extracted offline from the DB)
  utils/        site, data, schema
public/
  images/products/<slug>/  sanitized WebP (main, gallery, card)
  favicon.svg, apple-touch-icon.png, images/og-default.png, 410.html
scripts/
  patch-vercel.mjs   post-build header + 410 injection
```

## Content
`src/data/*.json` was extracted **offline** from the WordPress SQL export (no WordPress run).
Malicious records were excluded; slugs, metadata, internal links, specs, and FAQs preserved.
To change product copy, edit `src/data/products.json` and rebuild.

## URL behavior
- Trailing slashes always; product/category slugs preserved.
- Retired/malicious WP paths (`/wp-admin/`, `*.php`, `/cart/`, `/wp-json/*`, `/feed/`, …) → **410**.
- Unknown paths → genuine **404**.
- `sitemap_index.xml` → 301 → `sitemap-index.xml`.

## Deploy
```bash
vercel deploy          # preview (noindex)
vercel deploy --prod   # production (set PUBLIC_INDEXABLE=true in Vercel first)
```

The domain is intentionally **not** attached yet — see `../_migration/DNS_CUTOVER_PLAN.md`.
