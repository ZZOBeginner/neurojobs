/* Opsi pilihan di form (bukan data lowongan). Semua data lowongan, skill, dan posisi
   berasal dari data/jobs.json dan data/rf_model.json. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NJData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const jurusan = [
    { v: 'SIJA', l: 'SIJA — Sistem Informatika, Jaringan & Aplikasi' },
    { v: 'PPLG', l: 'PPLG — Pengembangan Perangkat Lunak & Gim' },
    { v: 'RPL', l: 'RPL — Rekayasa Perangkat Lunak' },
    { v: 'TJKT', l: 'TJKT / TKJ — Teknik Jaringan Komputer & Telekomunikasi' },
    { v: 'Informatika', l: 'Informatika / Ilmu Komputer' },
    { v: 'Sistem Informasi', l: 'Sistem Informasi' },
    { v: 'Teknik Komputer', l: 'Teknik Komputer' },
    { v: 'Lainnya', l: 'Lainnya (bidang IT)' }
  ];
  const exp = [
    { v: 0, l: 'Fresher', t: 'Fresher (0–1 tahun)', s: '0–1 thn' },
    { v: 1, l: '1–2 thn', t: '1–2 tahun', s: '1–2 thn' },
    { v: 2, l: '2–4 thn', t: '2–4 tahun', s: '2–4 thn' },
    { v: 3, l: '4+ thn', t: '4+ tahun', s: '4+ thn' }
  ];
  return { jurusan, exp };
});
