/* pravas-nav.js — header collection dropdowns and the mobile disclosure.

   Progressive enhancement. With this file absent every nav item is still a
   plain link to its collection page, and the drawer sub-lists are simply
   hidden — nothing becomes unreachable. */
(function () {
  var HOVER = window.matchMedia('(hover: hover) and (pointer: fine)');
  var CLOSE_DELAY = 120;

  /* ---------------------------------------------------------------
     Desktop dropdowns
     --------------------------------------------------------------- */
  function initDesktopItem(item) {
    if (item.dataset.pwNavReady === 'true') return;
    item.dataset.pwNavReady = 'true';

    var caret = item.querySelector('[data-pw-nav-caret]');
    var panel = item.querySelector('[data-pw-nav-panel]');
    if (!panel) return;

    var closeTimer = null;

    function open() {
      window.clearTimeout(closeTimer);
      closeOthers(item);
      panel.hidden = false;
      /* The attribute has to land before the class so the transition has a
         frame to run from. */
      window.requestAnimationFrame(function () {
        item.classList.add('is-open');
      });
      if (caret) caret.setAttribute('aria-expanded', 'true');
    }

    function close() {
      item.classList.remove('is-open');
      if (caret) caret.setAttribute('aria-expanded', 'false');
      var ms = parseFloat(getComputedStyle(item).getPropertyValue('--navdrop-duration')) || 0;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        panel.hidden = true;
      }, ms);
    }

    function scheduleClose() {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(close, CLOSE_DELAY);
    }

    item._pwClose = close;

    /* Hover, pointer devices only */
    item.addEventListener('mouseenter', function () {
      if (HOVER.matches) open();
    });
    item.addEventListener('mouseleave', function () {
      if (HOVER.matches) scheduleClose();
    });

    /* Keyboard: opening on focus within keeps the panel's own links
       reachable by tabbing straight on from the trigger. */
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', function (event) {
      if (!item.contains(event.relatedTarget)) close();
    });

    /* Touch: the caret is a separate control so tapping the label still
       follows the link to the collection page. */
    if (caret) {
      caret.addEventListener('click', function (event) {
        event.preventDefault();
        if (item.classList.contains('is-open')) {
          close();
        } else {
          open();
        }
      });
    }

    item.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && item.classList.contains('is-open')) {
        close();
        var trigger = item.querySelector('[data-pw-nav-trigger]');
        if (trigger) trigger.focus();
      }
    });
  }

  function closeOthers(except) {
    document.querySelectorAll('[data-pw-nav-item].is-open').forEach(function (other) {
      if (other !== except && typeof other._pwClose === 'function') other._pwClose();
    });
  }

  /* ---------------------------------------------------------------
     Mobile drawer disclosure
     --------------------------------------------------------------- */
  function initDrawerToggle(button) {
    if (button.dataset.pwNavReady === 'true') return;
    button.dataset.pwNavReady = 'true';

    var panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;

    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      button.closest('.pw-nav-drawer__group').classList.toggle('is-open', !open);
    });
  }

  function init() {
    document.querySelectorAll('[data-pw-nav-item]').forEach(initDesktopItem);
    document.querySelectorAll('[data-pw-nav-toggle]').forEach(initDrawerToggle);
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-pw-nav-item]')) closeOthers(null);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Theme Editor re-renders the header without a page load */
  document.addEventListener('shopify:section:load', init);
})();
