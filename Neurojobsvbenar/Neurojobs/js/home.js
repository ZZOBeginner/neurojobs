/* Beranda: coba langsung memakai Random Forest + lowongan dari JSON, dan statistik dari JSON. */
(async function () {
  'use strict';
  const { $, esc, bar, initials } = NJ;

  let cat;
  let init;
  try {
    [cat, init] = await Promise.all([NJ.skillCatalog(), NJ.currentProfile()]);
  } catch (e) {
    $('#demo-note').textContent = 'Data tidak bisa dimuat. Jalankan lewat server (node server.js lalu buka http://localhost:3000).';
    return;
  }
  const data = await NJ.loadData();

  const start = init.skills.map(s => NJEngine.canonical(s));
  const pool = start.concat(cat.map(c => c.n).filter(n => !start.includes(n))).slice(0, 12);
  const active = new Set(start);

  function drawChips() {
    $('#demo-skills').innerHTML = pool
      .map(s => '<button type="button" class="chip' + (active.has(s) ? ' on' : '') + '" data-s="' + esc(s) + '" aria-pressed="' + active.has(s) + '">' + esc(s) + '</button>')
      .join('');
  }

  function drawResults() {
    const skills = Array.from(active);
    const note = $('#demo-note');
    if (!skills.length) {
      note.textContent = 'Pilih minimal satu skill untuk melihat hasil.';
      $('#demo-roles').innerHTML = '';
      $('#demo-jobs').innerHTML = '';
      return;
    }
    const res = NJEngine.rfAnalyze({ skills }, data.model, data.jobs);
    note.textContent = skills.length + ' skill dipilih · dihitung Random Forest dari ' + res.ml.total + ' lowongan.';
    $('#demo-roles').innerHTML = res.roles.slice(0, 3).map((r, i) =>
      '<div class="demo-role"><strong>' + esc(r.title) + '</strong><span class="pct">' + r.score + '%</span>' + bar(r.score, i * 0.06) + '</div>'
    ).join('');
    $('#demo-jobs').innerHTML = res.listings.slice(0, 2).map(it =>
      '<div class="demo-job"><span class="avatar">' + esc(initials(it.ext.role)) + '</span><div><strong>' + esc(it.ext.title) + '</strong><span class="sub">' + esc(it.ext.kode) + ' · ' + esc(it.ext.type) + '</span></div><span class="pct">' + Math.round(it.score) + '%</span></div>'
    ).join('');
  }

  $('#demo-skills').addEventListener('click', e => {
    const b = e.target.closest('button[data-s]');
    if (!b) return;
    const s = b.dataset.s;
    if (active.has(s)) active.delete(s); else active.add(s);
    drawChips();
    drawResults();
  });

  $('#demo-go').addEventListener('click', e => {
    e.preventDefault();
    NJ.store.set('prefill', { skills: Array.from(active), jurusan: '', exp: null });
    location.href = 'analisis.html';
  });

  const m = data.model.metrik || {};
  [['#stat-skills', cat.length], ['#stat-roles', Object.keys(data.jobs.ringkasan_posisi).length], ['#stat-jobs', data.jobs.jumlah]].forEach(([sel, n]) => {
    $(sel).dataset.count = n;
  });
  NJ.observeCounts();

  drawChips();
  drawResults();
})();
