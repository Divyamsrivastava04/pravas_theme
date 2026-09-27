/* pravas-product.js — PRAVAS product page
   Reads real Shopify variant data embedded server-side; drives price,
   compare-at price, availability, swatch state and the sticky bar.
   Add to Cart goes through the theme's real /cart/add.js endpoint and
   the existing cart-drawer/cart-notification component — no separate
   cart system. */
(function () {
  'use strict';

  const root = document.getElementById('pw-pdp');
  if (!root) return;

  const variantsEl = document.getElementById('pw-pdp-variants-json');
  if (!variantsEl) return;
  const variants = JSON.parse(variantsEl.textContent);

  const form = document.getElementById('pw-pdp-form');
  const variantIdInput = document.getElementById('pw-pdp-variant-id');
  const atcBtn = document.getElementById('pw-pdp-atc');
  const atcText = atcBtn?.querySelector('.pw-pdp__atc-text');
  const priceCurrentEl = document.getElementById('pw-pdp-price-current');
  const priceCompareEl = document.getElementById('pw-pdp-price-compare');
  const availabilityWrap = document.getElementById('pw-pdp-availability');
  const availabilityCount = document.getElementById('pw-pdp-availability-count');
  const stickyPriceEl = document.getElementById('pw-pdp-sticky-price');
  const stickyVariantEl = document.getElementById('pw-pdp-sticky-variant');
  const soldOutLabel = root.dataset.soldOutLabel || 'SOLD OUT';

  const selected = {};
  form?.querySelectorAll('.pw-pdp__option').forEach((optionEl) => {
    const idx = optionEl.dataset.optionIndex;
    const active = optionEl.querySelector('.pw-pdp__swatch.is-active');
    if (active) selected[idx] = active.dataset.optionValue;
  });

  /* Formats an integer cents value using the shop's real money_format
     string (window.pravasMoneyFormat, set by the section) so currency
     always matches Shopify's own settings rather than a hardcoded symbol. */
  function formatMoney(cents) {
    const amount = cents / 100;
    const format = window.pravasMoneyFormat || '₹{{amount}}';

    function withDecimals(n) {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function noDecimals(n) {
      return Math.round(n).toLocaleString('en-IN');
    }

    return format
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, noDecimals(amount))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, withDecimals(amount))
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, noDecimals(amount))
      .replace(/\{\{\s*amount\s*\}\}/, withDecimals(amount));
  }

  function findMatchingVariant() {
    const optionValues = Object.keys(selected)
      .sort((a, b) => a - b)
      .map((k) => selected[k]);
    return variants.find((v) => {
      return v.options.every((opt, i) => opt === optionValues[i]);
    });
  }

  function updateUI(variant) {
    if (!variant) return;
    if (variantIdInput) variantIdInput.value = variant.id;

    if (priceCurrentEl) priceCurrentEl.textContent = formatMoney(variant.price);
    if (priceCompareEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        priceCompareEl.textContent = formatMoney(variant.compare_at_price);
        priceCompareEl.hidden = false;
      } else {
        priceCompareEl.hidden = true;
      }
    }

    if (availabilityWrap) {
      if (variant.inventory_management === 'shopify') {
        availabilityWrap.style.display = '';
        if (availabilityCount) {
          const label = availabilityCount.textContent.replace(/^\S+\s*/, '');
          availabilityCount.textContent = variant.inventory_quantity + ' ' + label;
        }
      } else {
        availabilityWrap.style.display = 'none';
      }
    }

    if (atcBtn) {
      atcBtn.disabled = !variant.available;
      if (atcText) atcText.textContent = variant.available ? atcText.dataset.available || atcText.textContent : soldOutLabel;
    }

    if (stickyPriceEl) stickyPriceEl.textContent = formatMoney(variant.price);
    if (stickyVariantEl && variant.title !== 'Default Title') {
      stickyVariantEl.textContent = '— ' + variant.title;
    }

    // Swap gallery to the variant's featured image, if it has one
    if (variant.featured_media) {
      const slide = root.querySelector(`.pw-pdp__gallery-slide[data-media-id="${variant.featured_media.id}"]`);
      if (slide) {
        root.querySelectorAll('.pw-pdp__gallery-slide').forEach((s) => s.classList.remove('is-active'));
        slide.classList.add('is-active');
        root.querySelectorAll('.pw-pdp__gallery-thumb').forEach((t) => t.classList.remove('is-active'));
        const idx = [...root.querySelectorAll('.pw-pdp__gallery-slide')].indexOf(slide);
        root.querySelectorAll('.pw-pdp__gallery-thumb')[idx]?.classList.add('is-active');
      }
    }
  }

  /* Store the "available" label text once so we can restore it after a sold-out state */
  if (atcText) atcText.dataset.available = atcText.textContent.trim();

  /* Swatch selection */
  form?.querySelectorAll('.pw-pdp__swatch').forEach((btn) => {
    btn.addEventListener('click', function () {
      const optionEl = this.closest('.pw-pdp__option');
      const idx = optionEl.dataset.optionIndex;
      optionEl.querySelectorAll('.pw-pdp__swatch').forEach((s) => s.classList.remove('is-active'));
      this.classList.add('is-active');
      const label = optionEl.querySelector('[data-option-selected]');
      if (label) label.textContent = this.dataset.optionValue;
      selected[idx] = this.dataset.optionValue;
      updateUI(findMatchingVariant());
    });
  });

  /* Gallery thumbnail click */
  root.querySelectorAll('.pw-pdp__gallery-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      root.querySelectorAll('.pw-pdp__gallery-slide').forEach((s) => s.classList.remove('is-active'));
      root.querySelectorAll('.pw-pdp__gallery-slide')[i]?.classList.add('is-active');
      root.querySelectorAll('.pw-pdp__gallery-thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });

  /* Fullscreen zoom (simple lightbox over the active slide) */
  const zoomBtn = document.getElementById('pw-pdp-zoom-btn');
  zoomBtn?.addEventListener('click', () => {
    const activeSlide = root.querySelector('.pw-pdp__gallery-slide.is-active img');
    if (!activeSlide) return;
    const overlay = document.createElement('div');
    overlay.className = 'pw-pdp__lightbox';
    overlay.innerHTML = `<img src="${activeSlide.currentSrc || activeSlide.src}" alt="${activeSlide.alt || ''}">`;
    overlay.addEventListener('click', () => overlay.remove());
    document.addEventListener('keydown', function escClose(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escClose); }
    });
    document.body.appendChild(overlay);
  });

  /* AJAX Add to Cart — real /cart/add.js + existing cart-drawer/notification */
  function submitAddToCart(button) {
    if (!variantIdInput?.value || button.disabled) return;
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding…';

    /* Built from the real form (includes the hidden variant id input, plus
       any line-item property fields from other sections associated via
       the form="pw-pdp-form" attribute, e.g. the Founder's Hand note). */
    const formData = new FormData(form);
    formData.set('quantity', 1);
    [...formData.keys()].forEach((key) => {
      if (key.indexOf('properties[') === 0 && !formData.get(key)) formData.delete(key);
    });
    if (cart) {
      formData.append('sections', cart.getSectionsToRender().map((s) => s.id));
      formData.append('sections_url', window.location.pathname);
    }

    fetch(window.routes ? window.routes.cart_add_url : '/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/javascript' },
      body: formData,
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.status) throw new Error(response.description || response.message);
        if (cart) {
          cart.renderContents(response);
        } else {
          window.location.href = window.routes ? window.routes.cart_url : '/cart';
        }
      })
      .catch((err) => {
        console.error('PRAVAS product add to cart failed:', err);
        button.textContent = 'Error — try again';
        setTimeout(() => { button.textContent = originalText; }, 2000);
      })
      .finally(() => {
        button.disabled = false;
        if (button.textContent === 'Adding…') button.textContent = originalText;
      });
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAddToCart(atcBtn);
  });
  document.getElementById('pw-pdp-sticky-atc')?.addEventListener('click', () => submitAddToCart(atcBtn));

  /* Sticky bar visibility on scroll (appears once the main info panel scrolls out of view) */
  const stickyBar = document.getElementById('pw-pdp-sticky');
  if (stickyBar && window.IntersectionObserver) {
    const sentinel = document.getElementById('pw-pdp');
    new IntersectionObserver(
      ([entry]) => {
        stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }
    ).observe(sentinel);
  }
})();
