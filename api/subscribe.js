import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

// Rate limiting (best-effort, resets on cold start)
const rateMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function sanitizeName(name) {
  if (!name) return '';
  return name
    .slice(0, 100)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED' });
  }

  // CSRF: check Origin or Referer
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  const host = req.headers['host'] || '';
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const originOk =
    allowedOrigins.some((o) => origin.startsWith(o)) ||
    allowedOrigins.some((o) => referer.startsWith(o));
  if (!originOk) {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
  }

  // Rate limit
  const ip = getIP(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, code: 'RATE_LIMITED' });
  }

  const { email, name, _hp } = req.body || {};

  // Honeypot: if filled, pretend success
  if (_hp) {
    return res.status(200).json({ ok: true });
  }

  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, code: 'INVALID_EMAIL' });
  }

  const safeName = sanitizeName(name);

  try {
    await resend.emails.send({
      from: 'ILS VOUS ONT MENTI <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `🚨 Nouvelle inscription — ${email}`,
      html: `
        <h2>Nouvelle inscription</h2>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Prénom :</strong> ${safeName || '(non fourni)'}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' })}</p>
        <p><strong>IP :</strong> ${ip}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ ok: false, code: 'SERVER_ERROR' });
  }
}
