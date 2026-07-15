# Vantage Studio — vantageweb.site

Static multi-page site + one Cloudflare Pages Function, ready to push to a
git repo and deploy on Cloudflare Pages.

## Structure

```
/
├── index.html              Home
├── about.html
├── blog.html                Blog listing
├── blog-post-example.html   Sample full article (Quick Answer, comparison
│                             table, Logic/Methodology, citations, FAQ)
├── contact.html              Form, WhatsApp, addresses + maps, payments
├── privacy-policy.html
├── cookies-policy.html
├── terms-of-use.html
├── sitemap.xml
├── robots.txt
├── css/styles.css            Shared stylesheet, all pages
├── js/main.js                Shared behavior, all pages
└── functions/contact.js      Cloudflare Pages Function — POST /contact
```

No build step, no framework, no npm install required for the front end.
Deploy the repo root as-is.

## Deploying to Cloudflare Pages

1. Push this folder to a GitHub/GitLab repo.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, select the repo.
3. Build settings: **Framework preset: None**, **Build command: (leave
   blank)**, **Build output directory: /**.
4. Deploy. Cloudflare auto-detects `functions/contact.js` and wires it to
   `POST /contact` — no extra config needed.
5. Once deployed, add `vantageweb.site` as a custom domain under the
   Pages project's **Custom domains** tab (after the domain is registered
   and its nameservers point to Cloudflare).

## Required setup: contact form email (Resend)

The contact form posts to `/contact`, which relays the message by email
via [Resend](https://resend.com). Netlify Forms isn't available on
Cloudflare, so this replaces it — see `functions/contact.js` for the code.

1. Create a free Resend account.
2. Add and verify `vantageweb.site` as a sending domain in Resend (adds a
   few DNS records — do this after the domain is registered).
3. Create a Resend API key.
4. In Cloudflare Pages: **Settings → Environment variables**, add a
   **secret** named `RESEND_API_KEY` for both Production and Preview.
5. Until this is set, the form will show an error instead of failing
   silently — that's intentional.

Messages are sent to `accessmakr@gmail.com`. To change that, edit
`TO_ADDRESS` in `functions/contact.js`.

## Before you go live — placeholder content to replace

These were built as realistic examples so the structure is easy to
evaluate, but they are **not real** and should be swapped before launch:

- **Client logos & names** in the homepage marquee (Meridian Capital,
  Northwell Health, etc.) — marked with an HTML comment above each block.
- **Case studies** in the Work section — currently link to the contact
  page ("Start a Similar Project") rather than dead case-study pages.
  Build real case-study pages and update the links once you have them.
- **Testimonials** on the homepage — sample quotes attributed to sample
  people. Replace with real, attributable client quotes.
- **Social links** in the footer (`x.com/vantagestudio`,
  `github.com/vantagestudio`) — placeholder handles, point them at your
  real accounts.
- **`og:image` / `twitter:image` URLs and hero/section photography** —
  currently pulled live from LoremFlickr by keyword so the design reads
  correctly. Replace with real photography before launch; hotlinked
  placeholder images shouldn't stay in a production deploy.
- **Two more blog posts** are stubbed as "Coming soon" cards on
  `blog.html` — write them or remove the cards.

## Flagged items — decisions you already made, noted here for the record

- **Auto-rotating "last updated" dates**: kept, per your instruction —
  `js/main.js` computes the most recent Monday and updates both the
  visible freshness badge and each page's `dateModified` in JSON-LD on
  every visit. Worth knowing: Google's guidance treats freshness signals
  that don't reflect real content changes as potentially manipulative.
  If you'd rather this reflect genuine edits, replace the computed value
  with a manually-set date in each page's `<script data-schema>` block.
- **No star ratings or specific trust numbers** — used qualitative trust
  language throughout instead ("trusted across industries," etc.), per
  your instruction. Add real ratings/aggregateRating schema only once you
  have genuine, verifiable review data — fabricated ratings risk a
  Google manual action.
- **Geo coordinates** for the Abuja address are district-level
  approximations (Asokoro Extension), not the exact building. Refine with
  precise coordinates if you want pinpoint accuracy in geo meta tags.
- **Google Maps embeds** on the Contact page use the no-API-key
  `?output=embed` pattern. It works today but isn't Google's officially
  supported method — for guaranteed long-term reliability, switch to the
  official Maps Embed API with an API key.

## Domain checklist (once vantageweb.site is registered)

- Point nameservers to Cloudflare and add the custom domain in Pages.
- Verify the domain in Resend for the contact form (see above).
- Double-check every `canonical`, `og:url`, and JSON-LD `url`/`@id` field
  already points to `https://vantageweb.site/...` — they do, throughout
  this build, so nothing else should need changing.
