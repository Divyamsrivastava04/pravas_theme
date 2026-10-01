/* pravas-legal.js — table of contents behaviour for PW Legal Page.
   Progressive enhancement only: the markup, anchors and scrolling all work
   with this file absent. */
(function () {
  var DESKTOP = '(min-width: 990px)';

  function initToc(details) {
    if (details.dataset.pwLegalTocReady === 'true') return;
    details.dataset.pwLegalTocReady = 'true';

    var links = Array.prototype.slice.call(
      details.querySelectorAll('[data-legal-toc]')
    );

    /* --- open / closed state ---------------------------------------- */
    /* The section renders the element open so it is usable without JS.
       On mobile we honour the "expanded by default" setting instead. */
    var openOnMobile = details.dataset.openMobile === 'true';
    var mq = window.matchMedia(DESKTOP);

    function syncOpen() {
      if (mq.matches) {
        details.open = true;
      } else {
        details.open = openOnMobile;
      }
    }
    syncOpen();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', syncOpen);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(syncOpen);
    }

    /* Tapping a heading on mobile should hand the screen back to the
       content rather than leave a long list covering it. */
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        if (!mq.matches) details.open = false;
      });
    });

    /* --- active heading --------------------------------------------- */
    if (!('IntersectionObserver' in window) || !links.length) return;

    var byId = {};
    var targets = [];
    links.forEach(function (link) {
      var heading = document.getElementById(link.dataset.legalToc);
      if (!heading) return;
      byId[link.dataset.legalToc] = link;
      targets.push(heading);
    });
    if (!targets.length) return;

    function setActive(id) {
      links.forEach(function (link) {
        var on = link.dataset.legalToc === id;
        link.classList.toggle('is-active', on);
        if (on) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    /* Track every heading's position relative to the top of the viewport
       and highlight the last one scrolled past, so the marker stays put
       through the long gaps between headings. */
    var observer = new IntersectionObserver(
      function () {
        var current = null;
        var bestTop = -Infinity;
        targets.forEach(function (heading) {
          var top = heading.getBoundingClientRect().top;
          if (top <= 120 && top > bestTop) {
            bestTop = top;
            current = heading.id;
          }
        });
        if (!current) current = targets[0].id;
        if (byId[current]) setActive(current);
      },
      { rootMargin: '-110px 0px -70% 0px', threshold: 0 }
    );

    targets.forEach(function (heading) {
      observer.observe(heading);
    });
  }

  function init() {
    document
      .querySelectorAll('[data-pw-legal-toc]')
      .forEach(function (details) {
        initToc(details);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Theme Editor re-renders the section without reloading the page. */
  document.addEventListener('shopify:section:load', init);
})();
