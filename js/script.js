  // Mobile menu toggle
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Header-aware smooth scroll for all in-page anchor links (closes mobile menu too)
  const header = document.querySelector('header');
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      mobileMenu.classList.remove('open');
      const headerHeight = header.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
      window.scrollTo({top, behavior:'smooth'});
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Scroll reveal — anything already on screen at load reveals instantly
  // (no animation), so there's never a race with the observer's first async
  // tick. Only below-the-fold elements get the animated scroll-in.
  const revealEls = document.querySelectorAll('.reveal');
  function isInViewport(el){
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0, rootMargin:'0px 0px 200px 0px'});
  revealEls.forEach(el => {
    if (isInViewport(el)) {
      el.classList.add('in');
    } else {
      observer.observe(el);
    }
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Correct landing position when arriving with a URL hash (e.g. a product page
  // linking to index.html#shop) — otherwise the browser's native jump lands
  // the section right under the sticky header.
  function fixHashScroll(){
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    const headerHeight = header.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
    window.scrollTo({top, behavior:'instant'});
  }
  window.addEventListener('load', fixHashScroll);

  // Shop-by-category filter — hides non-matching cards and re-centres a
  // lone card left dangling in the final row, at whatever column count
  // the current breakpoint uses.
  const filterBtns = document.querySelectorAll('.filter-btn');
  const prodGrid = document.querySelector('.prod-grid');
  function layoutProductGrid(){
    if (!prodGrid) return;
    const visible = Array.from(prodGrid.querySelectorAll('.prod-card'))
      .filter(c => !c.classList.contains('filtered-out'));
    visible.forEach(c => { c.style.gridColumn = ''; });
    const cols = getComputedStyle(prodGrid).gridTemplateColumns.split(' ').length;
    if (cols > 1 && visible.length % cols === 1) {
      visible[visible.length - 1].style.gridColumn = String(Math.floor(cols / 2) + 1);
    }
  }
  if (filterBtns.length && prodGrid) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        prodGrid.querySelectorAll('.prod-card').forEach(card => {
          const cats = (card.dataset.cat || '').split(' ');
          const show = filter === 'all' || cats.includes(filter);
          card.classList.toggle('filtered-out', !show);
        });
        layoutProductGrid();
      });
    });
    window.addEventListener('resize', layoutProductGrid);
    layoutProductGrid();
  }
