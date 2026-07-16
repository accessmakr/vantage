/**
 * Cloudflare Pages Function — POST /contact
 *
 * Receives the Vantage contact form (JSON body: name, email, whatsapp,
 * message, bot-field) and relays it to accessmakr@gmail.com using
 * Cloudflare's own Email Service — no third-party provider involved.
 *
 * SETUP REQUIRED before this works in production:
 *   1. This site's domain (vantageweb.site) must be on Cloudflare DNS —
 *      already true once you've connected it to Cloudflare Pages.
 *   2. In the Cloudflare dashboard, go to Compute & AI → Email Service
 *      and onboard vantageweb.site for sending. This adds SPF/DKIM DNS
 *      records for you to confirm — Cloudflare Email Service is a
 *      separate opt-in from just having the domain on Cloudflare DNS.
 *   3. Create an API token with "Email Sending: Edit" permission under
 *      My Profile → API Tokens.
 *   4. In the Cloudflare Pages dashboard for this project, go to
 *      Settings → Environment variables and add two secrets, for both
 *      Production and Preview:
 *        - CF_ACCOUNT_ID   (your Cloudflare account ID)
 *        - CF_EMAIL_TOKEN  (the API token from step 3)
 *   5. Update FROM_ADDRESS below once your domain is verified — it must
 *      be an address on vantageweb.site.
 *
 * Cloudflare Email Service is a newer product (still Beta as of this
 * writing) — the send endpoint is stable enough to build against, but
 * keep an eye on Cloudflare's changelog if anything about auth or the
 * request shape changes.
 *
 * Until both secrets are set, this function returns a 500 so the form
 * fails loudly instead of silently pretending to send.
 */

const TO_ADDRESS = 'accessmakr@gmail.com';
const FROM_ADDRESS = { address: 'noreply@vantageweb.site', name: 'Vantage Studio' };
const MAX_FIELD_LENGTH = 3000;

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json;charset=UTF-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid request body' }, 400);
  }

  // Honeypot — bots that fill every field will trip this. Return a
  // generic success so the bot doesn't learn its submission was rejected.
  if (body['bot-field']) {
    return json({ ok: true });
  }

  const name = (body.name || '').toString().trim().slice(0, 200);
  const email = (body.email || '').toString().trim().slice(0, 200);
  const whatsapp = (body.whatsapp || '').toString().trim().slice(0, 60);
  const message = (body.message || '').toString().trim().slice(0, MAX_FIELD_LENGTH);

  if (!name || !message || !isValidEmail(email)) {
    return json({ error: 'Please provide a valid name, email, and message.' }, 400);
  }

  if (!env.CF_ACCOUNT_ID || !env.CF_EMAIL_TOKEN) {
    return json({ error: 'Contact form is not configured yet.' }, 500);
  }

  const emailPayload = {
    to: [TO_ADDRESS],
    from: FROM_ADDRESS,
    reply_to: email,
    subject: `New Request And Contact submission — ${name}`,
    html: `
      <h2>New enquiry from vantageweb.site</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || 'Not provided')}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `,
    text: `New enquiry from vantageweb.site\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp || 'Not provided'}\n\nMessage:\n${message}`
  };

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CF_EMAIL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      }
    );

    const cfData = await cfRes.json().catch(() => null);

    if (!cfRes.ok || !cfData || cfData.success !== true) {
      console.error('Cloudflare Email Service error:', cfData);
      return json({ error: 'Email provider rejected the request.' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Contact function error:', err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Reject non-POST methods explicitly.
export async function onRequestGet() {
  return json({ error: 'Method not allowed' }, 405);
}
