/* Halaman cari lowongan: pencarian, filter, urutan, simpan, detail. */
(async function () {
  'use strict';
  const { $, $$, esc, icon, toast, initials } = NJ;
  const D = NJData;

  let res = null;
  try { res = await NJ.loadMl(); } catch (e) { res = null; }
  const infoMap = {};
  const LIST = [];
  const PAGE = 24;
  if (res && res.listings) res.listings.forEach(it => { infoMap[it.id] = it; LIST.push(Object.assign({ id: it.id, d: 0 }, it.ext)); });
  const hasMatch = LIST.length > 0;

  const state = { q: '', type: 'Semua', sort: 'match', saved: false, shown: PAGE };

  $('#jobs-lead').textContent = hasMatch
    ? 'Menampilkan semua ' + LIST.length + ' lowongan dari job_dataset.csv. Skor dihitung dari skill: ' + res.ml.input + '. Ubah lewat halaman Analisis.'
    : 'Data tidak bisa dimuat. Jalankan lewat server (node server.js lalu buka http://localhost:3000) supaya data/jobs.json dan data/rf_model.json terbaca.';

  $('#f-type').innerHTML = NJEngine.LEVELS.map(t => '<button type="button" role="radio" data-v="' + t + '" aria-checked="' + (t === 'Semua') + '">' + (t === 'Semua' ? 'Semua tipe' : t) + '</button>').join('');
  $('#f-sort').innerHTML = (hasMatch ? '<option value="match">Kecocokan tertinggi</option>' : '') + '<option value="name">Perusahaan A–Z</option>';
  $('#f-sort').value = state.sort;

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const out = LIST.filter(l => {
      if (state.type !== 'Semua' && l.type !== state.type) return false;
      if (state.saved && !NJ.saved.has(l.id)) return false;
      if (q && !(l.company + ' ' + l.title + ' ' + l.skills.join(' ') + ' ' + l.kode).toLowerCase().includes(q)) return false;
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
      '<div class="t"><h3>' + esc(l.title) + '</h3><p class="muted">' + esc(l.company) + ' · ' + esc(l.kode) + (applied ? ' · <span style="color:var(--blue)">Dilamar</span>' : '') + '</p></div>' +
      '<button class="btn-icon' + (saved ? ' is-on' : '') + '" data-act="save" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Hapus dari simpanan' : 'Simpan lowongan') + '">' + icon('bookmark') + '</button></div>' +
      '<div class="chips"><span class="chip">' + esc(l.type) + '</span>' + (l.level ? '<span class="chip">' + esc(l.level) + '</span>' : '') + '</div>' +
      '<div class="chips">' + skills + '</div>' +
      '<div class="job-bottom"><span class="salary">' + l.skills.length + ' skill dibutuhkan</span>' +
      (info ? '<span class="match">' + info.score + '% cocok</span>' : '<span class="hint"></span>') + '</div></article>';
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
    state.q = ''; state.type = 'Semua'; state.saved = false; state.shown = PAGE;
    state.sort = 'match';
    $('#q').value = '';
    $('#f-sort').value = state.sort;
    $$('#f-type button').forEach(b => b.setAttribute('aria-checked', b.dataset.v === 'Semua'));
    render();
  }

  $('#q').addEventListener('input', e => { state.q = e.target.value; state.shown = PAGE; render(); });
  $('#f-type').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    $$('#f-type button').forEach(x => x.setAttribute('aria-checked', x === b));
    state.type = b.dataset.v; state.shown = PAGE; render();
  });
  $('#f-sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#f-saved').addEventListener('click', () => { state.saved = !state.saved; state.shown = PAGE; render(); });
  $('#f-reset').addEventListener('click', reset);
  $('#empty-reset').addEventListener('click', reset);
  $('#btn-more').addEventListener('click', () => { state.shown += PAGE; render(); });

  function openCard(card) {
    const l = LIST.find(x => x.id === card.dataset.id);
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
