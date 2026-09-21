/* pravas.js — PRAVAS Timepieces */
(function() {
  'use strict';

  /* Announcement bar dismiss */
  const ann = document.getElementById('pw-ann');
  if (ann) {
    if (sessionStorage.getItem('pravas-ann')) {
      ann.style.display = 'none';
    }
    document.getElementById('pw-ann-close')?.addEventListener('click', function(e) {
      e.stopPropagation();
      ann.style.transition = 'max-height 300ms ease, opacity 200ms';
      ann.style.overflow = 'hidden';
      ann.style.maxHeight = ann.offsetHeight + 'px';
      requestAnimationFrame(() => { ann.style.maxHeight = '0'; ann.style.opacity = '0'; });
      setTimeout(() => ann.remove(), 350);
      sessionStorage.setItem('pravas-ann', '1');
    });
  }

  /* Ticker clone for seamless loop */
  const ticker = document.getElementById('pw-ticker-inner');
  if (ticker) ticker.appendChild(ticker.cloneNode(true));

  /* Hero watch image crossfade rotation (only runs when 2+ images are set) */
  const heroSlides = document.querySelectorAll('.pw-hero__img-slide');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroSlides.length > 1 && !prefersReducedMotion) {
    let heroSlideIndex = 0;
    setInterval(() => {
      heroSlides[heroSlideIndex].classList.remove('is-active');
      heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
      heroSlides[heroSlideIndex].classList.add('is-active');
    }, 6000);
  }

  /* Header mobile drawer */
  const burger   = document.getElementById('pw-burger');
  const navDrawer= document.getElementById('pw-nav-drawer');
  const navClose = document.getElementById('pw-nav-close');
  const navOvl   = document.getElementById('pw-nav-overlay');
  function openNav()  { navDrawer?.classList.add('open');    document.body.style.overflow='hidden'; }
  function closeNav() { navDrawer?.classList.remove('open'); document.body.style.overflow='';       }
  burger?.addEventListener('click', openNav);
  navClose?.addEventListener('click', closeNav);
  navOvl?.addEventListener('click', closeNav);

  /* Quick-buy strip — hide when hero out of view */
  const hero  = document.getElementById('pw-hero');
  const strip = document.getElementById('pw-qb-strip');
  if (hero && strip && window.IntersectionObserver) {
    new IntersectionObserver(([e]) => {
      strip.style.opacity       = e.isIntersecting ? '' : '0';
      strip.style.pointerEvents = e.isIntersecting ? '' : 'none';
    }, { threshold: 0 }).observe(hero);
  }

  /* Quick-buy drawer */
  const qbDrawer = document.getElementById('pw-qb-drawer');
  const qbOvl    = document.getElementById('pw-qb-overlay');
  function openQB()  { qbDrawer?.classList.add('open');    document.body.style.overflow='hidden'; }
  function closeQB() { qbDrawer?.classList.remove('open'); document.body.style.overflow='';       }
  document.getElementById('pw-open-qb')?.addEventListener('click', openQB);
  document.getElementById('pw-close-qb')?.addEventListener('click', closeQB);
  qbOvl?.addEventListener('click', closeQB);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeNav(); closeQB(); closeLB(); }
  });

  /* QB tile selection + ATC */
  document.querySelectorAll('.pw-qb-tile').forEach(tile => {
    tile.addEventListener('click', function() {
      document.querySelectorAll('.pw-qb-tile').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const atc = document.getElementById('pw-qb-atc');
      if (atc) atc.disabled = false;
    });
  });
  document.getElementById('pw-qb-atc')?.addEventListener('click', function() {
    const active = document.querySelector('.pw-qb-tile.active');
    if (!active?.dataset.variant) return;
    this.textContent = 'Adding...';
    this.disabled = true;
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: active.dataset.variant, quantity: 1 })
    }).then(() => {
      closeQB();
      fetch('/cart.js').then(r => r.json()).then(cart => {
        const b = document.querySelector('.pw-hdr__cart-count');
        if (b) b.textContent = cart.item_count;
      });
    }).catch(() => { this.textContent = 'Error — try again'; this.disabled = false; });
  });

  /* UGC lightbox */
  const lb    = document.getElementById('pw-lightbox');
  const lbOvl = document.getElementById('pw-lb-overlay');
  const lbFrame = document.getElementById('pw-lb-frame');
  function closeLB() {
    if (!lb) return;
    lb.style.display = 'none';
    if (lbFrame) lbFrame.innerHTML = '';
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.pw-ugc__play').forEach(btn => {
    btn.addEventListener('click', function() {
      let url = this.dataset.url;
      if (!url || !lb) return;
      url = url.replace('watch?v=','embed/').replace('youtu.be/','youtube.com/embed/');
      if (url.includes('embed') && !url.includes('autoplay')) url += (url.includes('?') ? '&' : '?') + 'autoplay=1';
      lbFrame.innerHTML = `<iframe src="${url}" allowfullscreen allow="autoplay" style="width:100%;height:100%;border:none;"></iframe>`;
      lb.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });
  lbOvl?.addEventListener('click', closeLB);
  document.getElementById('pw-lb-close')?.addEventListener('click', closeLB);

})();
