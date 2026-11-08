/* Glossy Naturals: motion layer (pairs with css/motion.css). Vanilla, no dependencies.
   One rAF loop for everything scroll/pointer driven; writes only CSS vars + transform-ish props. */
(() => {
  'use strict';
  const root = document.documentElement;
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (rm.matches) return; // CSS already gives the static end state
  root.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const header = $('header');

  /* ---------- helpers ---------- */
  // Wrap each word. mode 'w' = masked slide-up word; mode 'qw' = plain span for scroll-scrubbed fade.
  function splitWords(el, mode) {
    let n = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.textContent = part;
            if (mode === 'qw') { s.className = 'qw'; frag.appendChild(s); }
            else {
              const w = document.createElement('span');
              w.className = 'w';
              s.style.setProperty('--wi', String(n));
              w.appendChild(s);
              frag.appendChild(w);
            }
            n++;
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    };
    walk(el);
  }

  /* ---------- decorative DOM ---------- */
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const stage = $('.stage');
  if (stage) {
    for (let i = 1; i <= 6; i++) {
      const s = document.createElement('i');
      s.className = 'spark k' + i;
      s.setAttribute('aria-hidden', 'true');
      stage.appendChild(s);
    }
  }

  let dotEl = null, ringEl = null;
  if (fine) {
    dotEl = document.createElement('div'); dotEl.className = 'cursor';
    ringEl = document.createElement('div'); ringEl.className = 'cursor-ring';
    dotEl.setAttribute('aria-hidden', 'true'); ringEl.setAttribute('aria-hidden', 'true');
    document.body.append(dotEl, ringEl);
  }

  // SVG strokes: normalise length so they can "draw" in
  $$('.promise-list svg *, .pd-benefits li svg path').forEach((p) => p.setAttribute('pathLength', '1'));

  /* ---------- scroll-reveal system ---------- */
  const MAP = [
    ['.section-head', 'rise'], ['.shop-filters', 'rise'], ['.filter-btn', 'pop'],
    ['.ing', 'pop'], ['.prod-card', 'tilt'], ['.promise .container > div:first-child', 'left'],
    ['.promise-list li', 'right'], ['.founder-photo', 'zoom'], ['.founder .container > div:last-child', 'right'],
    ['.rev-card', 'tilt'], ['.broadcast .container', 'zoom'], ['.faq-item', 'left'],
    ['.contact-info', 'left'], ['.map-wrap', 'right'], ['.info-row', 'rise'],
    ['.pd-block', 'rise'], ['.pd-benefits li', 'left'], ['.foot-top', 'rise'],
  ];
  const HEADINGS = '.section-head h2, .promise h2, .founder h2, .broadcast h2, .pd-block h2, .pd-title, .foot-logo';
  const targets = new Set();
  $$('.reveal').forEach((el) => {
    el.classList.remove('pre'); // retire the old fade-in; this file drives reveals now
    if (!el.dataset.a && !el.classList.contains('pd-image')) el.dataset.a = 'rise';
    if (!el.classList.contains('pd-image')) targets.add(el);
  });
  MAP.forEach(([sel, type]) => {
    const groups = new Map();
    $$(sel).forEach((el) => {
      el.dataset.a = type;
      const p = el.parentElement;
      const idx = groups.get(p) || 0;
      groups.set(p, idx + 1);
      el.style.setProperty('--i', String(Math.min(idx, 6)));
      targets.add(el);
    });
  });
  $$(HEADINGS).forEach((h) => {
    splitWords(h, 'w');
    h.classList.add('wsplit');
    h.dataset.a = 'words';
    targets.add(h);
  });
  const quote = $('.founder-quote');
  let qWords = [];
  if (quote) { splitWords(quote, 'qw'); qWords = $$('.qw', quote); }

  const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.96 && r.bottom > 0; };
  const pending = new Set(); // safety net: anything scrolled past (fast fling / anchor jump) still reveals
  const reveal = (el) => {
    pending.delete(el);
    el.classList.remove('mpre');
    el.classList.add('min');
    setTimeout(() => el.classList.remove('min'), 2600);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      reveal(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  targets.forEach((el) => {
    if (inView(el)) {
      if (el.dataset.a === 'words') {
        el.classList.add('mpre'); // start hidden, then slide up on the next frames
        requestAnimationFrame(() => requestAnimationFrame(() => reveal(el)));
      }
      return;
    }
    el.classList.add('mpre');
    io.observe(el);
    pending.add(el);
  });

  /* ---------- parallax registry ---------- */
  const par = [];
  const addPar = (el, k, ref) => par.push({ el, ref: ref || el, k, y: 0, vis: false });
  $$('.mesh').forEach((m) => $$('i', m).forEach((b, i) => addPar(b, [60, -40, 34, -52][i % 4], m)));
  $$('.founder-photo').forEach((el) => addPar(el, 36));
  if (innerWidth > 820) $$('.ing').forEach((el, i) => addPar(el, i % 2 ? -26 : 22));
  $$('.prod-img img').forEach((el) => addPar(el, 14, el.closest('.prod-img')));
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    par.forEach((p) => { if (p.ref === e.target) p.vis = e.isIntersecting; });
  }), { rootMargin: '15% 0px' });
  new Set(par.map((p) => p.ref)).forEach((r) => pio.observe(r));

  /* ---------- state + loop ---------- */
  const hero = $('.hero');
  const band = $('.band');
  const sticky = $('.sticky-cta');
  const menu = $('#mobileMenu');
  let lastY = scrollY, vel = 0;
  let heroH = hero ? hero.offsetHeight : 1;
  let docH = 1;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, cx: -100, cy: -100, rx: -100, ry: -100 };
  let running = false;
  const request = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  function measure() {
    heroH = hero ? hero.offsetHeight : 1;
    docH = Math.max(1, root.scrollHeight - innerHeight);
    request();
  }

  let lastOn = -1, lastSk = 99, lastHp = -1;
  function frame() {
    running = false;
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    vel += (dy - vel) * 0.18;
    let again = Math.abs(vel) > 0.08;

    /* reads first, then writes: no layout thrash */
    const vh = innerHeight;
    const reads = [];
    for (const p of par) {
      if (!p.vis) continue;
      const r = p.ref.getBoundingClientRect();
      const top = p.ref === p.el ? r.top - p.y : r.top; // strip our own offset
      reads.push([p, (top + r.height / 2 - vh / 2) / vh]);
    }
    const qr = quote ? quote.getBoundingClientRect() : null;
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.93) { io.unobserve(el); reveal(el); }
    });

    bar.style.transform = 'scaleX(' + clamp(y / docH, 0, 1).toFixed(4) + ')';

    if (header) {
      header.classList.toggle('scrolled', y > 8);
      const menuOpen = menu && menu.classList.contains('open');
      if (!menuOpen && y > 520 && dy > 3) header.classList.add('hide');
      else if (dy < -3 || y < 520 || menuOpen) header.classList.remove('hide');
    }

    if (hero) {
      const hp = clamp(y / heroH, 0, 1);
      if (Math.abs(hp - lastHp) > 0.001) { hero.style.setProperty('--hp', hp.toFixed(3)); lastHp = hp; }
    }

    for (const [p, c] of reads) {
      p.y = -c * p.k;
      p.el.style.translate = '0 ' + p.y.toFixed(1) + 'px';
    }

    if (band) {
      const sk = clamp(vel * 0.16, -7, 7);
      if (Math.abs(sk - lastSk) > 0.02) { band.style.setProperty('--sk', sk.toFixed(2)); lastSk = sk; }
    }

    if (qr && qWords.length) {
      const prog = clamp((vh * 0.88 - qr.top) / (vh * 0.5 + qr.height * 0.6), 0, 1);
      const on = Math.round(prog * qWords.length);
      if (on !== lastOn) {
        qWords.forEach((w, i) => w.classList.toggle('on', i < on));
        lastOn = on;
      }
    }

    if (sticky) sticky.classList.toggle('show', y > (hero ? heroH * 0.55 : 320));

    /* pointer easing (hero parallax + cursor) */
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    if (stage) {
      stage.style.setProperty('--mx', mouse.x.toFixed(3));
      stage.style.setProperty('--my', mouse.y.toFixed(3));
      if (Math.abs(mouse.tx - mouse.x) > 0.002 || Math.abs(mouse.ty - mouse.y) > 0.002) again = true;
    }
    if (ringEl) {
      mouse.rx += (mouse.cx - mouse.rx) * 0.2;
      mouse.ry += (mouse.cy - mouse.ry) * 0.2;
      dotEl.style.transform = 'translate3d(' + mouse.cx + 'px,' + mouse.cy + 'px,0)';
      ringEl.style.transform = 'translate3d(' + mouse.rx.toFixed(1) + 'px,' + mouse.ry.toFixed(1) + 'px,0)';
      if (Math.abs(mouse.cx - mouse.rx) > 0.3 || Math.abs(mouse.cy - mouse.ry) > 0.3) again = true;
    }
    if (again) request();
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  measure();

  /* ---------- scrollspy ---------- */
  const spy = $$('.links a[href^="#"]');
  if (spy.length) {
    const map = new Map();
    spy.forEach((a) => { const s = $(a.getAttribute('href')); if (s) map.set(s, a); });
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      const a = map.get(e.target);
      if (a && e.isIntersecting) { spy.forEach((x) => x.classList.remove('active')); a.classList.add('active'); }
    }), { rootMargin: '-42% 0px -52% 0px' });
    map.forEach((_, s) => sio.observe(s));
  }

  /* ---------- pointer: hero parallax, cursor, glare, magnet ---------- */
  if (fine) {
    addEventListener('pointermove', (e) => {
      mouse.cx = e.clientX; mouse.cy = e.clientY;
      root.classList.add('cursor-on');
      if (hero) {
        const r = hero.getBoundingClientRect();
        if (r.bottom > 0 && e.clientY < r.bottom) {
          mouse.tx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5) * 2;
          mouse.ty = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5) * 2;
        }
      }
      const hot = e.target.closest && e.target.closest('a, button, summary, .prod-in, .ing');
      ringEl.classList.toggle('hot', !!hot);
      request();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => root.classList.remove('cursor-on'));
    addEventListener('pointerdown', () => ringEl.classList.add('down'));
    addEventListener('pointerup', () => ringEl.classList.remove('down'));

    $$('.prod-in').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });

    $$('.btn-cta, .btn-dark').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', () => { b.style.translate = '0 0'; });
    });
  }

  // click ripple on every button
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'rip';
    s.style.left = (e.clientX - r.left) + 'px';
    s.style.top = (e.clientY - r.top) + 'px';
    b.appendChild(s);
    setTimeout(() => s.remove(), 800);
  });

  /* ---------- shared-element page transition: tag the clicked product image ---------- */
  $$('.prod-card a[href$=".html"]').forEach((a) => {
    a.addEventListener('click', () => {
      $$('.vt-pimg').forEach((x) => x.classList.remove('vt-pimg'));
      const card = a.closest('.prod-card');
      const img = card && $('.prod-img', card);
      if (img) img.classList.add('vt-pimg');
    });
  });
  addEventListener('pageshow', () => $$('.vt-pimg').forEach((x) => x.classList.remove('vt-pimg')));

  /* ---------- shop filter: FLIP the cards ---------- */
  const filters = $('.shop-filters');
  const cards = $$('.prod-card[data-cat]');
  if (filters && cards.length && cards[0].animate) {
    filters.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-btn')) return;
      const before = new Map(cards.map((c) => [c, c.classList.contains('filtered-out') ? null : c.getBoundingClientRect()]));
      // script.js's own click handler runs after this capture listener; measure once it has
      requestAnimationFrame(() => {
        cards.forEach((c) => {
          if (c.classList.contains('filtered-out')) return;
          c.classList.remove('mpre');
          c.classList.add('min');
          const a = before.get(c);
          const b = c.getBoundingClientRect();
          if (a) {
            const dx = a.left - b.left, dy = a.top - b.top;
            if (Math.abs(dx) + Math.abs(dy) > 1) {
              c.animate([{ translate: dx + 'px ' + dy + 'px' }, { translate: '0 0' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
            }
          } else {
            c.animate([{ opacity: 0, scale: 0.86, translate: '0 30px' }, { opacity: 1, scale: 1, translate: '0 0' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', delay: 60 });
          }
          setTimeout(() => c.classList.remove('min'), 900);
        });
      });
    }, true);
  }

  /* ---------- FAQ: animated height (replaces script.js's instant close) ---------- */
  const faqList = $('.faq-list');
  if (faqList) {
    faqList.addEventListener('toggle', (e) => e.stopPropagation(), true); // keep script.js from snapping others shut
    $$('.faq-item').forEach((d) => {
      const sum = $('summary', d);
      if (!sum || !d.animate) return;
      let anim = null;
      const run = (open) => {
        if (anim) anim.cancel();
        const startH = d.offsetHeight;
        d.style.overflow = 'hidden';
        if (open) d.open = true;
        const endH = open ? d.scrollHeight : sum.offsetHeight;
        anim = d.animate({ height: [startH + 'px', endH + 'px'] }, { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        const done = () => { if (!open) d.open = false; d.style.overflow = ''; anim = null; };
        anim.onfinish = done;
        anim.oncancel = () => { d.style.overflow = ''; };
      };
      sum.addEventListener('click', (e) => {
        e.preventDefault();
        if (d.open) { run(false); return; }
        $$('.faq-item[open]').forEach((o) => { if (o !== d) { const s = $('summary', o); if (s) s.click(); } });
        run(true);
      });
    });
  }
})();
