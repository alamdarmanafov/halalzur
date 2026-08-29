// Vercel serverless function — verifies the admin panel's email/passphrase
// server-side so neither value ever ships in the page's client JS. Set
// ADMIN_EMAIL and ADMIN_PASSPHRASE as environment variables on this
// project in the Vercel dashboard (Settings → Environment Variables).
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassphrase = process.env.ADMIN_PASSPHRASE;
  if (!adminEmail || !adminPassphrase) {
    res.status(500).json({ error: 'admin_credentials_not_configured' });
    return;
  }

  const { email, password } = req.body || {};
  const ok =
    typeof email === 'string' &&
    typeof password === 'string' &&
    email.trim().toLowerCase() === adminEmail.toLowerCase() &&
    password === adminPassphrase;

  if (!ok) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  res.status(200).json({ ok: true });
}
