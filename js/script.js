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
