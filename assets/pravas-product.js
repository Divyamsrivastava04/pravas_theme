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

  /* ---------------------------------------------------------------
     Optional accessory add-on.

     The accessory is a separate Shopify product. Nothing here changes
     this product's price or variants — the only effect is a second,
     independent line in the cart. Absent when no accessory product is
     configured, in which case every branch below is skipped and the page
     behaves exactly as it did before.
     --------------------------------------------------------------- */
  const addonEl = document.getElementById('pw-addon');
  const addonJsonEl = document.getElementById('pw-addon-variants-json');
  const addonVariants = addonJsonEl ? JSON.parse(addonJsonEl.textContent) : [];
  const addonToggle = document.getElementById('pw-addon-toggle');
  const addonPriceWasEl = document.getElementById('pw-addon-price-was');
  const addonPriceNowEl = document.getElementById('pw-addon-price-now');
  const addonImgEl = document.getElementById('pw-addon-img');

  /* Bundle pricing is display only — the reduction itself is a real Shopify
     automatic discount applied in the cart and at checkout. These values
     mirror that discount so the page states the same figure; the theme never
     alters what is actually charged. */
  const bundleCfg = {
    on: addonEl?.dataset.bundleEnabled === 'true',
    type: addonEl?.dataset.bundleType || 'price',
    value: parseFloat(addonEl?.dataset.bundleValue) || 0,
  };

  function bundlePrice(base) {
    if (!bundleCfg.on || !bundleCfg.value) return base;
    let out = base;
    if (bundleCfg.type === 'amount') out = base - bundleCfg.value * 100;
    else if (bundleCfg.type === 'percent') out = Math.round((base * (100 - bundleCfg.value)) / 100);
    else out = bundleCfg.value * 100;
    if (out < 0) out = 0;
    /* A "bundle price" above the real price would be nonsense, so it is
       ignored rather than shown. */
    return out < base ? out : base;
  }

  const sumEl = document.getElementById('pw-sum');
  const sumProductEl = document.getElementById('pw-sum-product');
  const sumAddonRow = document.getElementById('pw-sum-addon-row');
  const sumAddonEl = document.getElementById('pw-sum-addon');
  const sumTotalEl = document.getElementById('pw-sum-total');

  let addonVariant = addonVariants.find((v) => v.available) || null;
  let addonOn = false;

  function currentVariant() {
    const id = Number(variantIdInput?.value);
    return variants.find((v) => v.id === id) || variants[0];
  }

  /* The only place the two prices are ever combined. Both come from real
     Shopify variant data, so a price change in Shopify flows through
     without touching the theme. */
  function renderTotals() {
    const base = currentVariant();
    if (!base) return;
    const addonActive = addonOn && addonVariant && addonVariant.available;
    const addonCharged = addonActive ? bundlePrice(addonVariant.price) : 0;
    const total = base.price + addonCharged;

    if (sumProductEl) sumProductEl.textContent = formatMoney(base.price);
    if (sumAddonRow) sumAddonRow.hidden = !addonActive;
    if (sumAddonEl && addonActive) sumAddonEl.textContent = '+ ' + formatMoney(addonCharged);
    if (sumTotalEl) sumTotalEl.textContent = formatMoney(total);
    if (stickyPriceEl) stickyPriceEl.textContent = formatMoney(total);
  }

  function renderAddon() {
    if (!addonEl) return;

    addonEl.querySelectorAll('[data-addon-variant]').forEach((btn) => {
      btn.classList.toggle('is-active', addonVariant && Number(btn.dataset.addonVariant) === addonVariant.id);
    });

    if (addonVariant) {
      const base = addonVariant.price;
      const now = bundlePrice(base);
      const discounted = now < base;
      if (addonPriceNowEl) addonPriceNowEl.textContent = '+ ' + formatMoney(now);
      if (addonPriceWasEl) {
        addonPriceWasEl.textContent = formatMoney(base);
        addonPriceWasEl.hidden = !discounted;
      }
      addonEl.classList.toggle('pw-addon--bundle', discounted);
    }

    if (addonImgEl && addonVariant) {
      const btn = addonEl.querySelector(`[data-addon-variant="${addonVariant.id}"]`);
      const src = btn?.dataset.addonImage;
      if (src && addonImgEl.getAttribute('src') !== src) {
        addonImgEl.removeAttribute('srcset');
        addonImgEl.src = src;
      }
    }

    if (addonToggle) {
      const usable = !!(addonVariant && addonVariant.available);
      addonToggle.disabled = !usable;
      if (!usable) addonOn = false;
      addonToggle.setAttribute('aria-pressed', String(addonOn));
      addonToggle.textContent = addonOn
        ? addonToggle.dataset.addedLabel || 'REMOVE'
        : addonToggle.dataset.addLabel || '+ ADD';
    }
  }

  if (addonEl) {
    addonEl.querySelectorAll('[data-addon-variant]').forEach((btn) => {
      btn.addEventListener('click', function () {
        if (this.disabled) return;
        const next = addonVariants.find((v) => v.id === Number(this.dataset.addonVariant));
        /* Changing colour swaps the chosen variant; it never adds a second
           accessory, and it leaves the added/not-added state alone. */
        if (next) addonVariant = next;
        renderAddon();
        renderTotals();
      });
    });

    addonToggle?.addEventListener('click', function () {
      if (this.disabled) return;
      addonOn = !addonOn;
      renderAddon();
      renderTotals();
    });
  }

  const selected = {};
  form?.querySelectorAll('.pw-pdp__option').forEach((optionEl) => {
    const idx = optionEl.dataset.optionIndex;
    const active = optionEl.querySelector('.pw-pdp__swatch.is-active:not([data-swatch-link])');
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

    /* Sticky bar and summary both show watch + accessory, so they are
       driven from one place rather than set piecemeal here. */
    renderTotals();
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

  /* Paint the accessory and the totals from the server-rendered state */
  renderAddon();
  renderTotals();

  /* Swatch selection. Swatches carrying data-swatch-link point at another
     product, so they are left alone to navigate rather than repainting this
     page's price and availability on the way out. */
  form?.querySelectorAll('.pw-pdp__swatch:not([data-swatch-link])').forEach((btn) => {
    btn.addEventListener('click', function () {
      const optionEl = this.closest('.pw-pdp__option');
      const idx = optionEl.dataset.optionIndex;
      optionEl
        .querySelectorAll('.pw-pdp__swatch:not([data-swatch-link])')
        .forEach((s) => s.classList.remove('is-active'));
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

    /* One request, one or two line items.

       Line-item properties still come from the real form, so other
       sections attached via form="pw-pdp-form" (the Founder's Hand note)
       keep working. The accessory is appended as its own item with its own
       variant id, which is what makes it a separate cart line with its own
       inventory — never a property on the watch, never a combined variant. */
    const formData = new FormData(form);
    const properties = {};
    formData.forEach((value, key) => {
      const match = key.match(/^properties\[(.+)\]$/);
      if (match && value) properties[match[1]] = value;
    });

    const mainItem = { id: Number(variantIdInput.value), quantity: 1 };
    if (Object.keys(properties).length) mainItem.properties = properties;

    const items = [mainItem];
    if (addonOn && addonVariant && addonVariant.available) {
      items.push({ id: addonVariant.id, quantity: 1 });
    }

    const payload = { items: items };
    if (cart) {
      payload.sections = cart.getSectionsToRender().map((s) => s.id);
      payload.sections_url = window.location.pathname;
    }

    fetch(window.routes ? window.routes.cart_add_url : '/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/javascript' },
      body: JSON.stringify(payload),
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
