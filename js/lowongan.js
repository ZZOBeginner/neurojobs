/* Halaman cari lowongan: pencarian, filter, urutan, simpan, detail. */
(function () {
  'use strict';
  const { $, $$, esc, icon, toast, initials } = NJ;
  const D = NJData;

  const res = NJ.store.get('result', null);
  const infoMap = {};
  if (res && res.listings) res.listings.forEach(it => { infoMap[it.id] = it; });
  const hasMatch = Object.keys(infoMap).some(id => D.listings.some(l => l.id === id));

  const state = { q: '', type: 'Semua', level: 'Semua', loc: 'Semua', sort: hasMatch ? 'match' : 'new', saved: false, shown: 9 };

  if (hasMatch) $('#jobs-lead').textContent = 'Skor kecocokan di setiap kartu dihitung dari analisis terakhir kamu.';

  $('#f-type').innerHTML = D.types.map(t => '<button type="button" role="radio" data-v="' + t + '" aria-checked="' + (t === 'Semua') + '">' + (t === 'Semua' ? 'Semua tipe' : t) + '</button>').join('');
  $('#f-level').innerHTML = D.levels.map(l => '<option value="' + l + '">' + (l === 'Semua' ? 'Semua level' : l) + '</option>').join('');
  $('#f-loc').innerHTML = D.locations.map(l => '<option value="' + l + '">' + (l === 'Semua' ? 'Semua lokasi' : l) + '</option>').join('');
  $('#f-sort').innerHTML = (hasMatch ? '<option value="match">Kecocokan tertinggi</option>' : '') + '<option value="new">Terbaru</option><option value="name">Perusahaan A–Z</option>';
  $('#f-sort').value = state.sort;

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const out = D.listings.filter(l => {
      if (state.type !== 'Semua' && l.type !== state.type) return false;
      if (state.level !== 'Semua' && l.level !== state.level) return false;
      if (state.loc !== 'Semua' && l.loc !== state.loc) return false;
      if (state.saved && !NJ.saved.has(l.id)) return false;
      if (q && !(l.company + ' ' + l.title + ' ' + l.skills.join(' ') + ' ' + l.loc).toLowerCase().includes(q)) return false;
      return true;
    });
    if (state.sort === 'match') out.sort((a, b) => ((infoMap[b.id] || {}).score || 0) - ((infoMap[a.id] || {}).score || 0));
    else if (state.sort === 'name') out.sort((a, b) => a.company.localeCompare(b.company));
    else out.sort((a, b) => a.d - b.d);
    return out;
  }

  function cardHtml(l, i) {
    const info = infoMap[l.id];
    const saved = NJ.saved.has(l.id);
    const applied = NJ.applied.has(l.id);
    const matched = info ? info.matched : [];
    const skills = l.skills.slice(0, 4).map(s => '<span class="chip ' + (matched.includes(s) ? 'chip-blue' : '') + '">' + esc(s) + '</span>').join('') +
      (l.skills.length > 4 ? '<span class="chip">+' + (l.skills.length - 4) + '</span>' : '');
    return '<article class="card job-card reveal" data-id="' + l.id + '" tabindex="0" style="--rd:' + Math.min(i % 9, 8) * 0.04 + 's">' +
      '<div class="job-top"><span class="avatar">' + esc(initials(l.company)) + '</span>' +
      '<div class="t"><h3>' + esc(l.title) + '</h3><p class="muted">' + esc(l.company) + (applied ? ' · <span style="color:var(--blue)">Dilamar</span>' : '') + '</p></div>' +
      '<button class="btn-icon' + (saved ? ' is-on' : '') + '" data-act="save" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Hapus dari simpanan' : 'Simpan lowongan') + '">' + icon('bookmark') + '</button></div>' +
      '<div class="chips"><span class="chip">' + icon('pin') + esc(l.loc) + '</span><span class="chip">' + esc(l.type) + '</span>' + (l.level !== l.type ? '<span class="chip">' + esc(l.level) + '</span>' : '') + '</div>' +
      '<div class="chips">' + skills + '</div>' +
      '<div class="job-bottom"><span class="salary">' + esc(l.salary) + '</span>' +
      (info ? '<span class="match">' + info.score + '% cocok</span>' : '<span class="hint">' + NJ.fmtDays(l.d) + '</span>') + '</div></article>';
  }

  function render() {
    const all = filtered();
    const list = all.slice(0, state.shown);
    $('#grid').innerHTML = list.map(cardHtml).join('');
    NJ.reveal($('#grid'));
    $('#empty').hidden = all.length > 0;
    $('#count').textContent = all.length ? 'Menampilkan ' + list.length + ' dari ' + all.length + ' lowongan' : '';
    $('#btn-more').hidden = all.length <= state.shown;
    $('#f-saved').innerHTML = icon('bookmark') + 'Tersimpan (' + NJ.saved.all().length + ')';
    $('#f-saved').classList.toggle('btn-primary', state.saved);
    $('#f-saved').classList.toggle('btn-glass', !state.saved);
    $('#f-saved').setAttribute('aria-pressed', state.saved);
  }

  function reset() {
    state.q = ''; state.type = 'Semua'; state.level = 'Semua'; state.loc = 'Semua'; state.saved = false; state.shown = 9;
    state.sort = hasMatch ? 'match' : 'new';
    $('#q').value = '';
    $('#f-level').value = 'Semua';
    $('#f-loc').value = 'Semua';
    $('#f-sort').value = state.sort;
    $$('#f-type button').forEach(b => b.setAttribute('aria-checked', b.dataset.v === 'Semua'));
    render();
  }

  $('#q').addEventListener('input', e => { state.q = e.target.value; state.shown = 9; render(); });
  $('#f-type').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    $$('#f-type button').forEach(x => x.setAttribute('aria-checked', x === b));
    state.type = b.dataset.v; state.shown = 9; render();
  });
  $('#f-level').addEventListener('change', e => { state.level = e.target.value; state.shown = 9; render(); });
  $('#f-loc').addEventListener('change', e => { state.loc = e.target.value; state.shown = 9; render(); });
  $('#f-sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#f-saved').addEventListener('click', () => { state.saved = !state.saved; state.shown = 9; render(); });
  $('#f-reset').addEventListener('click', reset);
  $('#empty-reset').addEventListener('click', reset);
  $('#btn-more').addEventListener('click', () => { state.shown += 9; render(); });

  function openCard(card) {
    const l = D.listings.find(x => x.id === card.dataset.id);
    NJ.openListing(l, infoMap[l.id] || null, {});
  }
  $('#grid').addEventListener('click', e => {
    const card = e.target.closest('.job-card');
    if (!card) return;
    if (e.target.closest('[data-act="save"]')) {
      const on = NJ.saved.toggle(card.dataset.id);
      toast(on ? 'Lowongan disimpan' : 'Dihapus dari simpanan');
      return;
    }
    openCard(card);
  });
  $('#grid').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('job-card')) { e.preventDefault(); openCard(e.target); }
  });
  document.addEventListener('nj:change', render);

  render();
})();
