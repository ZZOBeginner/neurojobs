/* Halaman tentang: FAQ accordion. */
(function () {
  'use strict';
  NJ.$('#faq').addEventListener('click', e => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const c = q.parentElement.querySelector('.collapse');
    const open = c.classList.toggle('open');
    q.setAttribute('aria-expanded', open);
  });
})();
