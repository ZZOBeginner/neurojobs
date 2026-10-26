/* Beranda: demo interaktif memakai engine asli + angka statistik dari data. */
(function () {
  'use strict';
  const { $, esc, bar, initials } = NJ;
  const D = NJData;
  const E = NJEngine;

  const pool = ['Python', 'SQL', 'JavaScript', 'HTML', 'CSS', 'Git', 'React', 'Linux', 'Excel', 'Networking', 'Figma', 'Testing'];
  const active = new Set(['Python', 'SQL', 'Git', 'HTML']);

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
    note.textContent = skills.length + ' skill dipilih · profil contoh: jurusan RPL, fresher.';
    const res = E.analyze({ jurusan: 'RPL', exp: 0, skills, prefType: 'Semua', prefLoc: 'Semua' });
    $('#demo-roles').innerHTML = res.roles.slice(0, 3).map((r, i) =>
      '<div class="demo-role"><strong>' + esc(r.title) + '</strong><span class="pct">' + r.score + '%</span>' + bar(r.score, i * 0.06) + '</div>'
    ).join('');
    $('#demo-jobs').innerHTML = res.listings.slice(0, 2).map(it => {
      const l = D.listings.find(x => x.id === it.id);
      return '<div class="demo-job"><span class="avatar">' + esc(initials(l.company)) + '</span><div><strong>' + esc(l.company) + '</strong><span class="sub">' + esc(l.title) + ' · ' + esc(l.loc) + '</span></div><span class="pct">' + it.score + '%</span></div>';
    }).join('');
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
    NJ.store.set('prefill', { skills: Array.from(active), jurusan: 'RPL', exp: 0 });
    location.href = 'analisis.html';
  });

  [['#stat-skills', D.skills.length], ['#stat-roles', D.roles.length], ['#stat-jobs', D.listings.length]].forEach(([sel, n]) => {
    const el = $(sel);
    el.dataset.count = n;
  });
  NJ.observeCounts();

  drawChips();
  drawResults();
})();
