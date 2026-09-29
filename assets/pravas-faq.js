(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Accordion.
     The markup is <details>, so it already opens/closes and is keyboard and
     screen-reader accessible with no JS. This only adds the closing
     animation, since a browser hides <details> content the instant `open`
     is removed and there's nothing left to transition. */
  document.querySelectorAll('.pw-faq__item').forEach(function (item) {
    var wrap = item.querySelector('.pw-faq__answer-wrap');
    if (!wrap) return;

    item.addEventListener('click', function (event) {
      var summary = event.target.closest('.pw-faq__question');
      if (!summary || !item.contains(summary)) return;
      if (!item.open || reduceMotion) return;

      // Keep the panel in the DOM long enough to animate it shut.
      event.preventDefault();
      wrap.classList.add('is-collapsing');

      var done = function () {
        wrap.classList.remove('is-collapsing');
        item.open = false;
        wrap.removeEventListener('transitionend', done);
      };
      wrap.addEventListener('transitionend', done);
      // Fallback in case the transition never fires (e.g. display changes).
      setTimeout(function () {
        if (wrap.classList.contains('is-collapsing')) done();
      }, 400);
    });
  });

  /* Sticky index: highlight the category currently in view. */
  var links = document.querySelectorAll('.pw-faq__index-link');
  var categories = document.querySelectorAll('.pw-faq__category');
  if (!links.length || !categories.length || !window.IntersectionObserver) return;

  var setActive = function (id) {
    links.forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.faqIndex === id);
    });
  };

  var observer = new IntersectionObserver(
    function (entries) {
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (visible.length) setActive(visible[0].target.dataset.faqCategory);
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
  );

  categories.forEach(function (cat) { observer.observe(cat); });
})();
