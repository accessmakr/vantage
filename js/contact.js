/**
 * Cloudflare Pages Function — POST /contact
 *
 * Receives the Vantage contact form (JSON body: name, email, whatsapp,
 * message, bot-field) and relays it to accessmakr@gmail.com via the
 * Resend API. Runs entirely on Cloudflare's edge — no server to manage.
 *
 * SETUP REQUIRED before this works in production:
 *   1. Create a free Resend account: https://resend.com
 *   2. Add and verify the vantageweb.site domain in Resend (DNS records).
 *   3. Create an API key in Resend.
 *   4. In the Cloudflare Pages dashboard for this project, go to
 *      Settings → Environment variables → add a secret named
 *      RESEND_API_KEY with that key. Do this for both Production and
 *      Preview environments.
 *   5. Update the "from" address below once your domain is verified —
 *      it must be an address on a domain you've verified with Resend.
 *
 * Until RESEND_API_KEY is set, this function returns a 500 so the form
 * fails loudly instead of silently pretending to send.
 */

const TO_ADDRESS = 'accessmakr@gmail.com';
const FROM_ADDRESS = 'Vantage Studio <noreply@vantageweb.site>';
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

  if (!env.RESEND_API_KEY) {
    return json({ error: 'Contact form is not configured yet.' }, 500);
  }

  const emailPayload = {
    from: FROM_ADDRESS,
    to: [TO_ADDRESS],
    reply_to: email,
    subject: `New Request And Contact submission — ${name}`,
    html: `
      <h2>New enquiry from vantageweb.site</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || 'Not provided')}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `
  };

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', errText);
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
