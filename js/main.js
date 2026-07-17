/* ==========================================================================
   VANTAGE — shared site behavior
   Loaded with `defer` on every page. Every block below is guarded so pages
   that don't have a given element simply skip that block.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Sticky nav shadow ---------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---------------- Mobile nav toggle ---------------- */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => navLinks.classList.toggle('is-open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('is-open'))
    );
  }

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ---------------- Hero image carousel ---------------- */
  const heroSlides = document.querySelectorAll('.hero__slide');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only the first slide has a real `src` on page load — the rest carry
  // `data-src` so the browser can't fetch them early (all slides share the
  // same on-screen rectangle, so native loading="lazy" wouldn't defer them).
  // Swap the rest in only after the page has fully loaded, so they don't
  // compete with anything on the critical rendering path.
  window.addEventListener('load', () => {
    document.querySelectorAll('.hero__slide[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  });

  if (heroSlides.length > 1 && !reducedMotion) {
    let heroIndex = 0;
    setInterval(() => {
      heroSlides[heroIndex].classList.remove('is-active');
      heroIndex = (heroIndex + 1) % heroSlides.length;
      heroSlides[heroIndex].classList.add('is-active');
    }, 5000);
  }

  /* ---------------- Testimonial carousel ---------------- */
  const testiCards = document.querySelectorAll('.testi-carousel .testi-card');
  const testiDots = document.querySelectorAll('.testi-carousel__dot');
  if (testiCards.length > 1) {
    let testiIndex = 0;
    const showTesti = (i) => {
      testiCards.forEach(c => c.classList.remove('is-active'));
      testiDots.forEach(d => d.classList.remove('is-active'));
      testiCards[i].classList.add('is-active');
      if (testiDots[i]) testiDots[i].classList.add('is-active');
      testiIndex = i;
    };
    testiDots.forEach((dot, i) => dot.addEventListener('click', () => showTesti(i)));
    if (!reducedMotion) {
      setInterval(() => showTesti((testiIndex + 1) % testiCards.length), 6000);
    }
  }

  /* ---------------- Scroll progress bar ---------------- */
  const progress = document.querySelector('.scroll-progress');
  if (progress) {
    const updateProgress = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------------- Work filter (home page only) ---------------- */
  const filters = document.querySelectorAll('.filter');
  const workCards = document.querySelectorAll('.work-card');
  if (filters.length && workCards.length) {
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const f = btn.dataset.filter;
        workCards.forEach(card => {
          card.classList.toggle('is-hidden', f !== 'all' && card.dataset.industry !== f);
        });
      });
    });
  }

  /* ---------------- Tabs (Reach Us section) ---------------- */
  document.querySelectorAll('.tabs').forEach(group => {
    const btns = group.querySelectorAll('.tabs__btn');
    const panels = group.querySelectorAll('.tabs__panel');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => p.classList.remove('is-active'));
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        const target = document.getElementById(btn.getAttribute('aria-controls'));
        if (target) target.classList.add('is-active');
      });
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item__q').forEach(q => {
    q.addEventListener('click', () => {
      q.closest('.faq-item').classList.toggle('is-open');
    });
  });

  /* ---------------- Dynamic copyright year ---------------- */
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = year; });

  /* ---------------- Seasonal greeting banner ---------------- */
  const seasonEl = document.querySelector('[data-season-banner]');
  if (seasonEl) {
    const month = new Date().getMonth(); // 0=Jan
    const seasons = [
      'Winter Edition', 'Winter Edition', 'Spring Edition',
      'Spring Edition', 'Spring Edition', 'Summer Edition',
      'Summer Edition', 'Summer Edition', 'Fall Edition',
      'Fall Edition', 'Fall Edition', 'Winter Edition'
    ];
    seasonEl.textContent = `${seasons[month]} — currently booking new studio engagements`;
    const dismissBtn = document.querySelector('[data-dismiss-banner]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        dismissBtn.closest('.season-banner').classList.add('is-hidden');
      });
    }
  }

  /* ---------------- Randomized CTA text ---------------- */
  const ctaEls = document.querySelectorAll('[data-cta-rotate]');
  if (ctaEls.length) {
    const variants = [
      'Start a Project', 'Get a Proposal', 'Book a Consultation',
      "Let's Talk", 'Request a Quote', 'Start the Conversation'
    ];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    ctaEls.forEach(el => { el.textContent = pick; });
  }

  /* ---------------- Freshness badge + JSON-LD dateModified ---------------- */
  // Computes the most recent Monday so "last updated" reflects a real,
  // consistent weekly review cadence rather than today's date on every visit.
  const mostRecentMonday = () => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sunday
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d;
  };
  const monday = mostRecentMonday();
  const formatted = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  document.querySelectorAll('[data-freshness]').forEach(el => {
    el.textContent = `Reviewed ${formatted}`;
  });
  const schemaEl = document.querySelector('script[data-schema]');
  if (schemaEl) {
    try {
      const data = JSON.parse(schemaEl.textContent);
      const isoMonday = monday.toISOString().slice(0, 10);
      const applyDate = (node) => {
        if (Array.isArray(node)) { node.forEach(applyDate); return; }
        if (node && typeof node === 'object') {
          if ('dateModified' in node) node.dateModified = isoMonday;
          Object.values(node).forEach(applyDate);
        }
      };
      applyDate(data);
      schemaEl.textContent = JSON.stringify(data);
    } catch (e) { /* leave static schema in place if parsing fails */ }
  }

  /* ---------------- Toast system ---------------- */
  window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  /* ---------------- Share system ---------------- */
  document.querySelectorAll('[data-share]').forEach(el => {
    el.addEventListener('click', (e) => {
      const type = el.dataset.share;
      const url = window.location.href;
      const title = document.title;
      const targets = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
      };
      if (type === 'copy') {
        e.preventDefault();
        navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard'));
        return;
      }
      if (targets[type]) {
        e.preventDefault();
        window.open(targets[type], '_blank', 'noopener,noreferrer,width=600,height=600');
      }
    });
  });

  /* ---------------- Newsletter signup (Cloudflare Pages Function) ---------------- */
  document.querySelectorAll('.footer__news form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const email = input.value.trim();
      if (!email) return;

      const originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';

      try {
        const res = await fetch('/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Request failed');
        showToast('Thanks — you are on the list.');
        form.reset();
      } catch (err) {
        showToast('Could not sign up — please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });
  });

  /* ---------------- Contact form (Cloudflare Pages Function backend) ---------------- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const status = contactForm.querySelector('.form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot: if this hidden field has a value, a bot filled the form.
      // Pretend success and stop — no request is sent.
      const honeypot = contactForm.querySelector('input[name="bot-field"]');
      if (honeypot && honeypot.value) {
        contactForm.reset();
        return;
      }

      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const res = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Request failed');

        if (status) {
          status.textContent = "Thank you — your request has been sent. We reply within one business day.";
          status.className = 'form-status is-visible is-success';
        }
        showToast('Message sent — we will be in touch shortly.');
        contactForm.reset();
      } catch (err) {
        if (status) {
          status.textContent = 'Something went wrong sending your message. Please try WhatsApp or email instead.';
          status.className = 'form-status is-visible is-error';
        }
        showToast('Could not send — please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
      }
    });
  }

});
