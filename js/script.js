(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = $('header');

  // Keep --hh in sync with the real sticky header height (CSSOM, no style attribute)
  function syncHeader() {
    if (header) root.style.setProperty('--hh', header.offsetHeight + 'px');
  }
  syncHeader();
  window.addEventListener('resize', syncHeader);
  window.addEventListener('load', syncHeader);

  // Mobile menu
  const burger = $('#hamburgerBtn');
  const menu = $('#mobileMenu');
  function closeMenu() {
    if (!menu || !burger) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      syncHeader();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // Header-aware smooth scroll for in-page anchors
  function scrollToTarget(target, smooth) {
    const hh = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.pageYOffset - hh - 12;
    window.scrollTo({ top, behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto' });
  }
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target, true);
      history.replaceState(null, '', id);
    });
  });

  // Arriving with a hash (e.g. product page linking to index.html#shop)
  window.addEventListener('load', () => {
    if (!location.hash) return;
    let target = null;
    try { target = $(location.hash); } catch (err) { return; }
    if (target) scrollToTarget(target, false);
  });

  // Reveals: progressive enhancement. Only below-the-fold items get hidden, and only once JS runs.
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: leave alone
      el.style.setProperty('--i', String(i % 4));
      el.classList.add('pre');
      io.observe(el);
    });
  }

  // Shop filter
  const btns = $$('.filter-btn');
  const cards = $$('.prod-card[data-cat]');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      const f = btn.dataset.filter;
      cards.forEach((c) => {
        const show = f === 'all' || (c.dataset.cat || '').split(' ').includes(f);
        c.classList.toggle('filtered-out', !show);
        if (show) c.classList.add('in');
      });
    });
  });

  // FAQ: one open at a time (native <details> works without JS)
  const faqs = $$('.faq-item');
  faqs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  // Product card tilt: mouse devices only, never under reduced motion
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (fine.matches) {
    $$('.prod-in').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        if (reduceMotion.matches) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  // Map facade: no third-party request until the visitor asks for it
  $$('.map-wrap[data-map-src]').forEach((wrap) => {
    const b = $('[data-map-load]', wrap);
    if (!b) return;
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = wrap.dataset.mapSrc;
      f.title = wrap.dataset.mapTitle || 'Map';
      f.loading = 'lazy';
      f.setAttribute('allowfullscreen', '');
      const facade = $('.map-facade', wrap);
      if (facade) facade.remove();
      wrap.appendChild(f);
    });
  });

  // Footer year
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
