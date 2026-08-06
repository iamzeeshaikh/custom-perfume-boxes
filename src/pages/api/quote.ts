import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

// --- config from environment (never hard-coded) ---
const SMTP_HOST = import.meta.env.SMTP_HOST;
const SMTP_PORT = Number(import.meta.env.SMTP_PORT || 587);
const SMTP_USER = import.meta.env.SMTP_USER;
const SMTP_PASS = import.meta.env.SMTP_PASS;
const MAIL_TO = import.meta.env.QUOTE_TO || SMTP_USER;
const MAIL_FROM = import.meta.env.QUOTE_FROM || SMTP_USER;
const ALLOWED_ORIGINS = (import.meta.env.ALLOWED_ORIGINS ||
  'https://customperfumeboxes.com,https://www.customperfumeboxes.com')
  .split(',').map((s: string) => s.trim());

const MAX_FILE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/svg+xml',
  'application/postscript', 'application/illustrator',
  'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
]);
const ALLOWED_EXT = /\.(pdf|png|jpe?g|ai|svg|zip)$/i;

// naive in-memory rate limit (per warm instance) — best-effort defense in depth
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 5;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}
function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c));
}
function safeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, '_').replace(/\.{2,}/g, '.').slice(0, 120);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // 1. Origin / referer check
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    const okOrigin = ALLOWED_ORIGINS.some(
      (o: string) => origin === o || referer.startsWith(o) || origin.endsWith('.vercel.app') || referer.includes('.vercel.app')
    );
    if (origin && !okOrigin) return json({ ok: false, error: 'Invalid origin.' }, 403);

    // 2. Rate limit
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimited(ip)) return json({ ok: false, error: 'Too many requests. Please try again shortly.' }, 429);

    const form = await request.formData();

    // 3. Honeypot
    if ((form.get('company_website') as string)?.trim()) {
      return json({ ok: true }); // silently accept & drop
    }

    // 4. Validate fields
    const name = (form.get('name') as string || '').trim();
    const email = (form.get('email') as string || '').trim();
    const phone = (form.get('phone') as string || '').trim();
    const message = (form.get('message') as string || '').trim();
    const productName = (form.get('product_name') as string || '').trim();
    const productUrl = (form.get('product_url') as string || '').trim();
    const sourcePage = (form.get('source_page') as string || '').trim();
    const submittedAt = (form.get('submitted_at') as string || '').trim();

    if (!name || name.length > 120) return json({ ok: false, error: 'Please enter your name.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'Please enter a valid email.' }, 400);
    if (message.length > 4000) return json({ ok: false, error: 'Message too long.' }, 400);

    // 5. Validate optional file upload
    const attachments: { filename: string; content: Buffer }[] = [];
    const file = form.get('artwork');
    if (file && file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE) return json({ ok: false, error: 'File too large (max 10 MB).' }, 400);
      const fname = safeName(file.name);
      if (!ALLOWED_EXT.test(fname)) return json({ ok: false, error: 'Unsupported file type.' }, 400);
      if (file.type && !ALLOWED_MIME.has(file.type)) return json({ ok: false, error: 'Unsupported file type.' }, 400);
      const buf = Buffer.from(await file.arrayBuffer());
      attachments.push({ filename: fname, content: buf });
    }

    // 6. Build + send email (fail loudly — never report success on failure)
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return json({ ok: false, error: 'Mail service is not configured.' }, 500);
    }
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const subject = productName
      ? `Quote request: ${productName}`
      : 'New quote request — Custom Perfume Boxes';
    const html = `
      <h2>New Quote Request</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
        <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
        <tr><td><b>Phone</b></td><td>${esc(phone)}</td></tr>
        <tr><td><b>Product</b></td><td>${esc(productName) || '—'}</td></tr>
        <tr><td><b>Product URL</b></td><td>${esc(productUrl) || '—'}</td></tr>
        <tr><td><b>Source page</b></td><td>${esc(sourcePage) || '—'}</td></tr>
        <tr><td><b>Submitted</b></td><td>${esc(submittedAt) || new Date().toISOString()}</td></tr>
      </table>
      <h3>Message</h3>
      <p>${esc(message).replace(/\n/g, '<br>') || '—'}</p>`;

    await transporter.sendMail({
      from: `"Custom Perfume Boxes" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: email,
      subject,
      html,
      attachments,
    });

    return json({ ok: true });
  } catch (err) {
    console.error('quote error', err);
    return json({ ok: false, error: 'Delivery failed. Please email us directly.' }, 500);
  }
};

// Reject non-POST
export const GET: APIRoute = () => json({ ok: false, error: 'Method not allowed.' }, 405);
