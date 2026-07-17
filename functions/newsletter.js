/**
 * Cloudflare Pages Function — POST /newsletter
 *
 * Receives a single email address from the footer "Stay in the loop" form
 * and relays it to accessmakr@gmail.com as a notification, using the same
 * Cloudflare Email Service setup as /functions/contact.js (same secrets:
 * CF_ACCOUNT_ID, CF_EMAIL_TOKEN — see that file for full setup steps, or
 * just ask in chat instead of digging through this comment).
 *
 * Note on scope: this only notifies you by email that someone signed up —
 * it does not add them to a mailing list or send them anything itself.
 * For actual newsletter delivery (a monthly email going out to everyone
 * who's signed up), you'll eventually want a real mailing-list tool
 * (e.g. Mailchimp, Buttondown, or a Cloudflare KV-backed list) rather
 * than this function alone. This gets you a working, non-fake form today
 * without committing to a mailing-list vendor before you need one.
 */

const TO_ADDRESS = 'accessmakr@gmail.com';
const FROM_ADDRESS = { address: 'noreply@vantageweb.site', name: 'Vantage Studio' };

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

  const email = (body.email || '').toString().trim().slice(0, 200);
  if (!isValidEmail(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  if (!env.CF_ACCOUNT_ID || !env.CF_EMAIL_TOKEN) {
    return json({ error: 'Newsletter signup is not configured yet.' }, 500);
  }

  const emailPayload = {
    to: [TO_ADDRESS],
    from: FROM_ADDRESS,
    subject: 'New newsletter signup — vantageweb.site',
    html: `<p>New newsletter signup: <strong>${escapeHtml(email)}</strong></p>`,
    text: `New newsletter signup: ${email}`
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
    console.error('Newsletter function error:', err);
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

export async function onRequestGet() {
  return json({ error: 'Method not allowed' }, 405);
}
