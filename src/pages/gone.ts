import type { APIRoute } from 'astro';

export const prerender = false;

// Returns HTTP 410 Gone for retired/malicious WordPress paths.
// Legacy patterns are rewritten here via vercel.json.
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Gone | Custom Perfume Boxes</title>
<style>body{font-family:system-ui,Arial,sans-serif;background:#fff;color:#2a2a2a;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center}
.b{max-width:520px;padding:24px}h1{color:#111}a{color:#c2185b;font-weight:600}
.btn{display:inline-block;background:#c2185b;color:#fff;padding:11px 24px;border-radius:26px;text-decoration:none;margin-top:14px}</style>
</head><body><div class="b"><h1>410 — This page is gone</h1>
<p>The old WordPress application was permanently retired during a security rebuild. This address no longer exists.</p>
<a class="btn" href="/">Go to homepage</a></div></body></html>`;

const respond: APIRoute = () =>
  new Response(html, {
    status: 410,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'no-store',
    },
  });

export const GET = respond;
export const POST = respond;
