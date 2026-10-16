/* ==========================================================================
   DiabloFoil — shared script for every page
   --------------------------------------------------------------------------
   Each feature checks whether its HTML exists on the current page, so one
   file serves all pages. Part A works without GSAP; Part B adds the GSAP
   animations, and is skipped if GSAP fails to load or the visitor has
   "reduce motion" switched on.
   ========================================================================== */

const $  = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Business details in one place — update here if they ever change */
const BUSINESS = {
  whatsappNumber: '971555533020',     // used by the quote form
  email: 'ask@diablofoil.ae',
  foundedYear: 2012
};


/* ==========================================================================
   A. FEATURES THAT DON'T NEED GSAP
   ========================================================================== */

/* ---- A1. Years in business + copyright year (never go out of date) ---- */
const years = new Date().getFullYear() - BUSINESS.foundedYear;
$$('[data-years]').forEach(el => { el.textContent = years; el.dataset.count = years; });
$$('[data-year-now]').forEach(el => el.textContent = new Date().getFullYear());


/* ---- A2. Header: turns solid after scrolling, hides on the way down ---- */
const nav = $('#nav');
let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 40);
  if (!document.body.classList.contains('menu-open')) {
    nav.classList.toggle('is-hidden', y > lastY && y > 500);
  }
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


/* ---- A3. Mobile menu ---- */
const burger = $('#burger');
const menu = $('#mobileMenu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menu.classList.toggle('open', open);
  menu.inert = !open;                                   // links can't be tabbed to while closed
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (open) {
    nav.classList.remove('is-hidden');
    // links slide up one after another (GSAP), then focus the first one
    if (window.gsap && !reduceMotion) {
      gsap.fromTo($$('#mobileMenu nav a, #mobileMenu .menu-foot'),
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .06, delay: .2 });
    }
    setTimeout(() => $('#mobileMenu nav a')?.focus(), 300);
  }
}
if (burger && menu) {
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  // close it if the window grows to desktop size
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => e.matches && setMenu(false));
}


/* ---- A4. Optional hero video ----
   Add data-video="your-file.mp4" to .hero-media to play a video over the photo.
   It is skipped for reduced-motion and data-saver users; if it fails, the photo stays. */
const heroMedia = $('#heroMedia');
if (heroMedia?.dataset.video && !reduceMotion && !navigator.connection?.saveData) {
  const v = document.createElement('video');
  Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'metadata' });
  v.setAttribute('aria-hidden', 'true');
  v.src = heroMedia.dataset.video;
  v.addEventListener('canplay', () => { v.classList.add('ready'); v.play().catch(() => {}); }, { once: true });
  v.addEventListener('error', () => v.remove(), { once: true });
  heroMedia.appendChild(v);
}


/* ---- A5. Hero studio light follows the mouse ---- */
const hero = $('.hero');
if (hero && canHover && !reduceMotion) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
}


/* ---- A6. Service list: photo preview follows the cursor (desktop) ---- */
const preview = $('#svcPreview');
if (preview && canHover) {
  const img = $('img', preview);
  $$('.svc a[data-img]').forEach(link => {
    link.addEventListener('mouseenter', () => { img.src = link.dataset.img; preview.classList.add('show'); });
    link.addEventListener('mouseleave', () => preview.classList.remove('show'));
  });
  window.addEventListener('pointermove', e => {
    preview.style.left = (e.clientX + 190) + 'px';
    preview.style.top = e.clientY + 'px';
  }, { passive: true });
}


/* ---- A7. Before / after slider (range input = mouse, touch and keyboard) ---- */
$$('.ba').forEach(ba => {
  const range = $('input[type=range]', ba);
  range?.addEventListener('input', () => ba.style.setProperty('--split', range.value + '%'));
});


/* ---- A8. Services page: highlight the section you're reading in the side index ---- */
const indexLinks = $$('.svc-index a');
if (indexLinks.length && 'IntersectionObserver' in window) {
  const byId = Object.fromEntries(indexLinks.map(a => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        indexLinks.forEach(a => a.classList.remove('active'));
        byId[entry.target.id]?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.svc-block[id]').forEach(s => io.observe(s));
}


/* ---- A9. Gallery lightbox (gallery page) ----
   Each thumbnail is a normal link to the full-size photo, so it still works
   without JavaScript. With JS, it opens in this lightbox instead. */
const galleryLinks = $$('.grid-gallery .g-item');
if (galleryLinks.length) {
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML = `
    <p class="lb-counter" aria-live="polite"></p>
    <button class="lb-btn lb-close" type="button" aria-label="Close viewer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button>
    <div class="lb-stage"><img alt=""></div>
    <button class="lb-btn lb-next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>`;
  document.body.appendChild(box);

  const lbImg = $('.lb-stage img', box);
  const counter = $('.lb-counter', box);
  let current = 0, opener = null;

  function show(i) {
    current = (i + galleryLinks.length) % galleryLinks.length;   // wrap around at both ends
    const link = galleryLinks[current];
    lbImg.classList.add('loading');
    lbImg.onload = () => lbImg.classList.remove('loading');
    lbImg.src = link.href;
    lbImg.alt = $('img', link).alt;
    counter.textContent = `${current + 1} / ${galleryLinks.length}`;
    // preload the next photo so arrowing through feels instant
    new Image().src = galleryLinks[(current + 1) % galleryLinks.length].href;
  }
  galleryLinks.forEach((link, i) => link.addEventListener('click', e => {
    e.preventDefault();
    opener = link;
    show(i);
    box.showModal();
  }));
  $('.lb-prev', box).addEventListener('click', () => show(current - 1));
  $('.lb-next', box).addEventListener('click', () => show(current + 1));
  $('.lb-close', box).addEventListener('click', () => box.close());
  box.addEventListener('close', () => opener?.focus());           // return focus to the thumbnail
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-stage')) box.close(); });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  // swipe left / right on touch screens
  let startX = null;
  box.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
  box.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
}


/* ---- A10. Quote form ----
   The current DiabloFoil site has no form backend, so the form sends the
   enquiry through the two channels the business already uses:
   WhatsApp (opens a pre-written message) or email (opens the mail app).
   To use a backend later, replace sendEnquiry() with a fetch() to it. */
const form = $('#quoteForm');
if (form) {
  const status = $('#formStatus');

  // "Get a quote for…" buttons on the services page link here with ?service=<id>; pre-select it
  const wanted = new URLSearchParams(location.search).get('service');
  const match = wanted && $(`#fService option[data-id="${CSS.escape(wanted)}"]`);
  if (match) match.selected = true;
  const rules = {
    name:    v => v.trim().length >= 2 || 'Enter your name.',
    phone:   v => v.replace(/\D/g, '').length >= 7 || 'Enter a phone number we can call or WhatsApp you on.',
    service: v => v !== '' || 'Choose a service, or pick "Not sure yet".'
  };

  function validate() {
    let firstBad = null;
    Object.entries(rules).forEach(([name, rule]) => {
      const input = form.elements[name];
      const result = rule(input.value);
      const field = input.closest('.field');
      field.classList.toggle('invalid', result !== true);
      input.setAttribute('aria-invalid', result !== true);
      $('.err', field).textContent = result === true ? '' : result;
      if (result !== true && !firstBad) firstBad = input;
    });
    firstBad?.focus();
    return !firstBad;
  }
  // clear a field's error as soon as it's fixed
  form.addEventListener('input', e => {
    const rule = rules[e.target.name];
    if (rule && rule(e.target.value) === true) {
      e.target.closest('.field').classList.remove('invalid');
      e.target.setAttribute('aria-invalid', 'false');
      $('.err', e.target.closest('.field')).textContent = '';
    }
  });

  function buildMessage(d) {
    return [
      "Hello DiabloFoil, I'd like a quote.",
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      `Car: ${d.car || 'Not given'}`,
      `Service: ${d.service}`,
      d.message ? `Details: ${d.message}` : ''
    ].filter(Boolean).join('\n');
  }

  function sendEnquiry(method, text) {
    if (method === 'email') {
      location.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent('Quote request')}&body=${encodeURIComponent(text)}`;
      return 'Your email app opened with the enquiry written out. Press send there to reach us.';
    }
    window.open(`https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return 'WhatsApp opened with your enquiry written out. Press send there to reach us.';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    status.textContent = '';
    if (!validate()) return;
    const method = e.submitter?.dataset.method || 'whatsapp';
    const data = Object.fromEntries(new FormData(form));
    status.textContent = sendEnquiry(method, buildMessage(data));
  });
}


/* ==========================================================================
   B. GSAP ANIMATIONS
   ========================================================================== */
if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  /* B1. Home hero entrance: photo fades up from black, headline lines rise
         and stretch from narrow to wide — like film being pulled taut */
  if ($('#heroTitle')) {
    // final stretch comes from CSS (--wd-end) so phones can use a narrower value
    const wdEnd = parseFloat(getComputedStyle($('#heroTitle')).getPropertyValue('--wd-end')) || 116;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('#heroMedia', { scale: 1.25, filter: 'brightness(0)', duration: 2.2 }, 0)
      .from('#heroTitle .line > span', { yPercent: 110, duration: 1.2, stagger: .12 }, .25)
      .to('#heroTitle', { '--wd': wdEnd, duration: 1.8, ease: 'power3.inOut' }, .45)
      .from('.hero-foot > *', { opacity: 0, y: 24, duration: 1, stagger: .12 }, 1.05)
      // animate the header's contents, not #nav itself, so the hide-on-scroll class keeps working
      .from('.nav-inner', { yPercent: -100, opacity: 0, duration: 1 }, .9);

    // photo drifts slower than the page while scrolling away
    gsap.to('.hero-media', { yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // and leans slightly toward the mouse (desktop)
    if (canHover) {
      const xTo = gsap.quickTo('#heroMedia', 'x', { duration: 1.2, ease: 'power3.out' });
      const yTo = gsap.quickTo('#heroMedia', 'y', { duration: 1.2, ease: 'power3.out' });
      hero.addEventListener('pointermove', e => {
        xTo((e.clientX / innerWidth - .5) * -24);
        yTo((e.clientY / innerHeight - .5) * -16);
      });
    }
  }

  /* B2. Inner page headers: title lines rise, background drifts */
  if ($('.page-head')) {
    gsap.from('.page-head .reveal > span', { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .1, delay: .1 });
    gsap.from('.page-head .lede, .page-head .crumbs', { opacity: 0, y: 16, duration: 1, delay: .4 });
    gsap.to('.page-head .bg img', { yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.page-head', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* B3. Colour-change section: pins, and a full-colour layer wipes across
         the grey "before" photo as you scroll */
  const peel = $('#peel');
  if (peel) {
    const gloss = $('#peelGloss'), edge = $('#peelEdge'), steps = $$('#steps li');
    const state = { p: 0 };
    gsap.to(state, {
      p: 1, ease: 'none',
      scrollTrigger: {
        trigger: peel, start: 'top top', end: '+=170%', pin: true, scrub: .6,
        onUpdate: () => {
          const p = state.p, w = peel.offsetWidth, h = peel.offsetHeight;
          gloss.style.setProperty('--p', p);
          // the bright film edge rides along the slanted wipe line
          const topX = p * 1.35 * w, slant = .35 * w;
          edge.style.transform = `translateX(${topX - slant / 2}px) skewX(${-Math.atan(slant / h) * 180 / Math.PI}deg)`;
          edge.style.opacity = p > .02 && p < .98 ? 1 : 0;
          steps.forEach((li, i) => li.classList.toggle('on', p >= i / 3));
        }
      }
    });
  }

  /* B4. Section headings: each line slides up out of a mask */
  $$('main .reveal > span').forEach(span => {
    if (span.closest('.page-head')) return;           // handled in B2
    gsap.from(span, { yPercent: 105, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: span.parentElement, start: 'top 90%', once: true } });
  });

  /* B5. Number counters (stats) */
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, { v: target, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => el.textContent = Math.round(obj.v).toLocaleString('en-US') });
  });

  /* B6. Photo frames: clip-reveal from the bottom, then a gentle parallax drift */
  $$('.frame').forEach(frame => {
    gsap.from(frame, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: frame, start: 'top 85%', once: true } });
    const img = $('img', frame);
    if (frame.classList.contains('tall')) {
      gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  /* B7. CTA band background parallax */
  $$('.cta-band > img').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* B8. Home gallery strip: pinned horizontal scroll on desktop (touch screens swipe natively) */
  if ($('#track')) {
    mm.add('(min-width: 901px)', () => {
      const track = $('#track');
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: '.strip', start: 'top top', end: () => '+=' + distance(),
          pin: true, scrub: .8, invalidateOnRefresh: true } });
    });
  }

  /* B9. Gallery page: thumbnails fade up in small batches as they enter */
  if ($('.grid-gallery')) {
    gsap.set('.g-item', { opacity: 0, y: 40 });
    ScrollTrigger.batch('.g-item', {
      start: 'top 92%', once: true,
      onEnter: items => gsap.to(items, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .07 })
    });
  }

  // photos load after the script runs; re-measure pin lengths once they're in
  window.addEventListener('load', () => ScrollTrigger.refresh());

} else {
  /* No GSAP (blocked, offline) or reduced motion: show everything in its finished state */
  $('#peelGloss')?.style.setProperty('--p', 1);
  $$('#steps li').forEach(li => li.classList.add('on'));
  const t = $('#heroTitle');
  t?.style.setProperty('--wd', getComputedStyle(t).getPropertyValue('--wd-end'));
}
