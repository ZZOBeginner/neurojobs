/* Dijalankan di <head> supaya tema terpasang sebelum halaman tampil (tanpa kedip). */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var t = localStorage.getItem('nj.theme');
    if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', t);
  } catch (e) {
    root.setAttribute('data-theme', 'light');
  }
})();
