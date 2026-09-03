// Post-build: inject security headers + HTTP 410 routes into the Vercel
// Build Output API config. The @astrojs/vercel adapter writes its own
// .vercel/output/config.json, which makes root vercel.json routing ignored,
// so we patch the generated config directly. Idempotent.
import fs from 'node:fs';

const CONFIG = '.vercel/output/config.json';
if (!fs.existsSync(CONFIG)) {
  console.error('[patch-vercel] config.json not found — did the build run?');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
cfg.routes = cfg.routes || [];

// Zendesk Chat (zopim) needs several hosts; Astro emits small hydration
// scripts inline, so 'unsafe-inline' is required for on-page interactivity.
const ZD = 'https://*.zopim.com https://v2.zopim.com https://*.zdassets.com https://*.zendesk.com';
// The ZeeOps live-chat widget loads its script from chat.zeeops.dev, polls it
// over fetch, and shows the site logo + uploaded files from it.
const ZEE = 'https://chat.zeeops.dev';
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  // Fonts are self-hosted now, so no Google Fonts origins are needed.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: " + ZD,
  "script-src 'self' 'unsafe-inline' " + ZD + ' ' + ZEE,
  "connect-src 'self' " + ZD + ' ' + ZEE + " wss://*.zopim.com wss://*.zendesk.com",
  "frame-src " + ZD,
  "media-src 'self' " + ZD,
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': CSP,
};

const MARK = '__cpb_patched__';
if (cfg[MARK]) { console.log('[patch-vercel] already patched'); process.exit(0); }

// 1) Global security headers — applied to every response, then continue routing.
const headerRoute = { src: '^/.*$', headers: SECURITY_HEADERS, continue: true };

// 2) HTTP 410 for retired / malicious legacy WordPress paths -> static 410.html
const gonePatterns = [
  '^/wp-admin(?:/.*)?$',
  '^/wp-includes(?:/.*)?$',
  '^/wp-content(?:/.*)?$',
  '^/wp-login\\.php$',
  '^/wp-cron\\.php$',
  '^/xmlrpc\\.php$',
  '^/wp-json(?:/.*)?$',
  '^/.*\\.php$',
  '^/cart/?$',
  '^/checkout/?$',
  '^/my-account/?$',
  '^/feed/?$',
  '^/.*/feed/?$',
];
const goneRoutes = gonePatterns.map((src) => ({
  src,
  dest: '/410.html',
  status: 410,
  headers: { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-store' },
}));

// 3) 301 old Yoast/split sitemap paths to the single /sitemap.xml.
const redirectRoutes = [
  { src: '^/sitemap_index\\.xml$', headers: { Location: '/sitemap.xml' }, status: 301 },
  { src: '^/sitemap-index\\.xml$', headers: { Location: '/sitemap.xml' }, status: 301 },
  { src: '^/sitemap-0\\.xml$', headers: { Location: '/sitemap.xml' }, status: 301 },
];

// Insert header route at the very top; insert 410 + redirect just before filesystem handle.
const fsIdx = cfg.routes.findIndex((r) => r && r.handle === 'filesystem');
const before = fsIdx >= 0 ? cfg.routes.slice(0, fsIdx) : cfg.routes.slice();
const after = fsIdx >= 0 ? cfg.routes.slice(fsIdx) : [];

cfg.routes = [headerRoute, ...before, ...redirectRoutes, ...goneRoutes, ...after];
cfg[MARK] = true;

fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2));
console.log(`[patch-vercel] injected security headers + ${goneRoutes.length} 410 routes + sitemap redirect`);
