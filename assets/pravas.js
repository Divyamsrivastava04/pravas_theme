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

  /* Featured colourway drag-to-compare slider */
  (function initFeatCompare() {
    const wrap = document.getElementById('pw-feat-compare');
    if (!wrap) return;
    const overlay = document.getElementById('pw-feat-overlay');
    const divider = document.getElementById('pw-feat-divider');
    const handle = document.getElementById('pw-feat-handle');
    if (!overlay || !divider || !handle) return;

    let dragging = false;

    function setPosition(clientX) {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      overlay.style.clipPath = `inset(0 0 0 ${pct}%)`;
      divider.style.left = pct + '%';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    wrap.addEventListener('pointermove', (e) => {
      if (dragging) setPosition(e.clientX);
    });
    handle.addEventListener('pointerup', () => { dragging = false; });
    handle.addEventListener('pointercancel', () => { dragging = false; });

    /* Click/tap anywhere in the compare area jumps the handle there */
    wrap.addEventListener('pointerdown', (e) => {
      if (e.target === handle) return;
      setPosition(e.clientX);
    });

    /* Keyboard accessibility */
    handle.setAttribute('tabindex', '0');
    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(handle.style.left) || 50;
      let next = current;
      if (e.key === 'ArrowLeft')  next = Math.max(0, current - 5);
      else if (e.key === 'ArrowRight') next = Math.min(100, current + 5);
      else return;
      e.preventDefault();
      overlay.style.clipPath = `inset(0 0 0 ${next}%)`;
      divider.style.left = next + '%';
      handle.style.left = next + '%';
      handle.setAttribute('aria-valuenow', Math.round(next));
    });
  })();

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

  /* Quick-buy card — hide when hero scrolls out of view, but only when the
     card is anchored to the hero. When it's fixed to the screen, hiding it
     would defeat the point of it staying visible. */
  const hero  = document.getElementById('pw-hero');
  const strip = document.getElementById('pw-qb-strip');
  if (hero && strip && window.IntersectionObserver) {
    const isFixed = getComputedStyle(strip).position === 'fixed';
    if (!isFixed) {
      new IntersectionObserver(([e]) => {
        strip.style.opacity       = e.isIntersecting ? '' : '0';
        strip.style.pointerEvents = e.isIntersecting ? '' : 'none';
      }, { threshold: 0 }).observe(hero);
    }
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
    const btn = this;
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;

    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    const formData = new FormData();
    formData.append('id', active.dataset.variant);
    formData.append('quantity', 1);
    if (cart) {
      formData.append('sections', cart.getSectionsToRender().map((s) => s.id));
      formData.append('sections_url', window.location.pathname);
    }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/javascript' },
      body: formData,
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.status) throw new Error(response.description || response.message);
        closeQB();
        if (cart) {
          /* Same reason as the product page: the drawer keeps its page-load
             is-empty class through renderContents, so the first add into an
             empty cart renders the empty state until a reload. */
          cart.classList.remove('is-empty');
          cart.renderContents(response);
        } else {
          fetch('/cart.js').then((r) => r.json()).then((cartData) => {
            const b = document.querySelector('.pw-hdr__cart-count');
            if (b) b.textContent = cartData.item_count;
          });
        }
      })
      .catch(() => { btn.textContent = 'Error — try again'; })
      .finally(() => {
        btn.disabled = false;
        if (btn.textContent === 'Adding...') btn.textContent = originalText;
      });
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
