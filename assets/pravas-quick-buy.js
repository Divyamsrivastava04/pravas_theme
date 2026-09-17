/*
  PRAVAS Timepieces — custom homepage behaviour.
  Vanilla JS only. No external libraries.

  Covers:
  - Announcement bar dismiss (sessionStorage)
  - Header mobile drawer open/close
  - Hero quick-buy strip visibility (IntersectionObserver) + drawer open trigger
  - Quick-buy drawer: colourway selection, close, escape, add to cart
  - Social proof ticker seamless loop clone
*/

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * Announcement bar dismiss
   * ------------------------------------------------------------------- */
  function initAnnouncementBar() {
    const bar = document.querySelector('.pravas-announcement');
    if (!bar) return;

    if (sessionStorage.getItem('pravas-bar-dismissed')) {
      bar.style.display = 'none';
      return;
    }

    const dismiss = bar.querySelector('.pravas-announcement__dismiss');
    if (!dismiss) return;

    dismiss.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      bar.classList.add('is-dismissed');
      sessionStorage.setItem('pravas-bar-dismissed', 'true');
      window.setTimeout(() => {
        bar.style.display = 'none';
      }, 300);
    });
  }

  /* ---------------------------------------------------------------------
   * Header mobile drawer
   * ------------------------------------------------------------------- */
  function initHeaderDrawer() {
    const openBtn = document.getElementById('pravas-header-menu-toggle');
    const closeBtn = document.getElementById('pravas-header-drawer-close');
    const drawer = document.getElementById('pravas-header-drawer');
    const overlay = document.getElementById('pravas-header-drawer-overlay');
    if (!openBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      openBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      openBtn.setAttribute('aria-expanded', 'false');
    }

    openBtn.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ---------------------------------------------------------------------
   * Hero quick-buy strip + drawer open trigger
   * ------------------------------------------------------------------- */
  function initHeroQuickBuyStrip() {
    const hero = document.querySelector('.pravas-hero');
    const strip = document.getElementById('quick-buy-strip');

    if (hero && strip && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          strip.style.display = entry.isIntersecting ? 'flex' : 'none';
        },
        { threshold: 0 },
      );
      observer.observe(hero);
    }

    document.getElementById('open-quick-buy')?.addEventListener('click', () => {
      document.getElementById('quick-buy-drawer')?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  }

  /* ---------------------------------------------------------------------
   * Quick-buy drawer
   * ------------------------------------------------------------------- */
  function initQuickBuyDrawer() {
    const drawer = document.getElementById('quick-buy-drawer');
    if (!drawer) return;

    const atcButton = document.getElementById('qb-atc');

    function closeDrawer() {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    drawer.querySelectorAll('.qb-tile').forEach((tile) => {
      tile.addEventListener('click', function () {
        drawer.querySelectorAll('.qb-tile').forEach((t) => t.classList.remove('active'));
        this.classList.add('active');
        if (atcButton) atcButton.disabled = false;
      });
    });

    document.getElementById('close-quick-buy')?.addEventListener('click', closeDrawer);
    document.getElementById('qb-overlay')?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    atcButton?.addEventListener('click', function () {
      const active = drawer.querySelector('.qb-tile.active');
      if (!active || this.disabled) return;

      const variantId = active.dataset.variant;
      if (!variantId) return;

      const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

      this.disabled = true;
      this.classList.add('is-loading');
      const originalText = this.textContent;
      this.textContent = 'Adding…';

      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', 1);
      if (cart) {
        formData.append(
          'sections',
          cart.getSectionsToRender().map((section) => section.id),
        );
        formData.append('sections_url', window.location.pathname);
        cart.setActiveElement?.(document.activeElement);
      }

      fetch(window.routes ? window.routes.cart_add_url : '/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/javascript' },
        body: formData,
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            throw new Error(response.description || response.message || 'Unable to add to cart');
          }

          closeDrawer();

          if (cart) {
            cart.renderContents(response);
          } else {
            document.dispatchEvent(new CustomEvent('cart:open'));
          }
        })
        .catch((error) => {
          console.error('PRAVAS quick-buy add to cart failed:', error);
        })
        .finally(() => {
          this.disabled = false;
          this.classList.remove('is-loading');
          this.textContent = originalText;
        });
    });
  }

  /* ---------------------------------------------------------------------
   * Social proof ticker — seamless loop clone
   * ------------------------------------------------------------------- */
  function initTicker() {
    const tickerInner = document.getElementById('ticker-inner');
    if (!tickerInner) return;
    tickerInner.appendChild(tickerInner.cloneNode(true));
  }

  function init() {
    initAnnouncementBar();
    initHeaderDrawer();
    initHeroQuickBuyStrip();
    initQuickBuyDrawer();
    initTicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
