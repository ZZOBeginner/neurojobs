/* Halaman hasil: posisi, skill gap, perusahaan (filter, simpan, detail), salin, cetak, impor JSON ML. */
(async function () {
  'use strict';
  const { $, $$, esc, icon, bar, store, toast, initials } = NJ;
  const D = NJData;
  const E = NJEngine;

  let result = null;
  try { result = await NJ.loadMl(); } catch (e) { result = null; }
  const PAGE = 20;
  const state = { type: 'Semua', q: '', min: 0, sort: 'score', saved: false, shown: PAGE };

  if (!result || !result.roles || !result.roles.length) {
    $('#empty').hidden = false;
    return;
  }
  $('#content').hidden = false;

  const baseOf = it => {
    return Object.assign({ id: it.id, d: 0 }, it.ext);
  };

  /* ---------- header ---------- */
  function renderHead() {
    const p = result.profile;
    const chips = [];
    if (p.jurusan) chips.push('<span class="chip">' + esc(p.jurusan) + '</span>');
    if (D.exp[p.exp]) chips.push('<span class="chip">' + esc(D.exp[p.exp].t) + '</span>');
    (p.skills || []).forEach(s => chips.push('<span class="chip chip-blue">' + esc(s) + '</span>'));
    $('#res-chips').innerHTML = chips.join('');

    $('#btn-copy').innerHTML = icon('copy') + 'Salin ringkasan';
    $('#btn-print').innerHTML = icon('print') + 'Cetak / PDF';
    $('#btn-import').innerHTML = icon('upload') + 'Impor JSON model';

    const hist = store.get('history', []);
    const sel = $('#history-select');
    sel.hidden = hist.length < 2;
    sel.innerHTML = hist.map(h => {
      const d = new Date(h.ts);
      const top = h.result.roles[0];
      return '<option value="' + h.id + '"' + (h.ts === result.ts ? ' selected' : '') + '>' + esc(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' · ' + (top ? top.title : 'Hasil')) + '</option>';
    }).join('');
  }

  /* ---------- posisi ---------- */
  function reasonsHtml(it) {
    const items = (it.reasons || []).map(r => '<li class="' + (r.ok ? 'ok' : 'no') + '">' + icon(r.ok ? 'check' : 'circle') + '<span>' + esc(r.text) + '</span></li>').join('');
    return '<ul class="checklist">' + items + '</ul>';
  }

  function roleHtml(r, i) {
    const top = i === 0;
    const chips = (r.matched || []).map(s => '<span class="chip chip-blue">' + icon('check') + esc(s) + '</span>').join('') +
      (r.missing || []).slice(0, 4).map(s => '<span class="chip chip-miss">' + esc(s) + '</span>').join('');
    return '<article class="card role' + (top ? ' role-top' : '') + ' reveal" style="--rd:' + (i * 0.07) + 's">' +
      '<div class="role-main"><span class="rank">' + (i + 1) + '</span>' +
      '<div class="role-info"><h3>' + esc(r.title) + '</h3>' + (r.blurb ? '<p class="muted small">' + esc(r.blurb) + '</p>' : '') + '</div>' +
      '<div class="score"><span class="num">' + r.score + '<small>%</small></span><span class="qual">' + (result.source === 'rf' ? 'Keyakinan model RF' : E.label(r.score)) + '</span></div></div>' +
      bar(r.score, i * 0.08) +
      (chips ? '<div class="chips">' + chips + '</div>' : '') +
      '<button class="why-toggle" type="button" aria-expanded="false">Kenapa cocok? ' + icon('chevron') + '</button>' +
      '<div class="collapse"><div>' + reasonsHtml(r) + '</div></div></article>';
  }

  function renderRoles() {
    const roles = result.roles.slice(0, 5);
    $('#roles').innerHTML = roles.map(roleHtml).join('');
    NJ.reveal($('#roles'));
  }

  /* ---------- skill gap ---------- */
  function renderGaps() {
    const g = result.gaps || [];
    $('#sec-gap').hidden = !g.length;
    $('#gaps').innerHTML = g.map((x, i) =>
      '<article class="card gap-card reveal" style="--rd:' + i * 0.06 + 's">' +
      '<div class="top"><h3>' + esc(x.skill) + '</h3><span class="cat">' + esc(x.cat) + '</span></div>' +
      bar(x.priority, i * 0.06) +
      '<span class="need">Dibutuhkan di ' + x.n + ' dari 3 posisi teratas</span>' +
      (x.tip ? '<p>' + esc(x.tip) + '</p>' : '') + '</article>'
    ).join('');
    NJ.reveal($('#gaps'));
  }

  /* ---------- perusahaan ---------- */
  function filtered() {
    const q = state.q.trim().toLowerCase();
    const out = [];
    result.listings.forEach(it => {
      const base = baseOf(it);
      if (!base) return;
      if (state.type !== 'Semua' && base.type !== state.type) return;
      if (it.score < state.min) return;
      if (state.saved && !NJ.saved.has(base.id)) return;
      if (q) {
        const hay = (base.company + ' ' + base.title + ' ' + (base.skills || []).join(' ') + ' ' + (base.loc || '')).toLowerCase();
        if (!hay.includes(q)) return;
      }
      out.push({ it, base });
    });
    if (state.sort === 'name') out.sort((a, b) => a.base.company.localeCompare(b.base.company));
    else if (state.sort === 'new') out.sort((a, b) => (a.base.d || 0) - (b.base.d || 0));
    else out.sort((a, b) => b.it.score - a.it.score);
    return out;
  }

  function rowHtml(x, i) {
    const { it, base } = x;
    const saved = NJ.saved.has(base.id);
    const applied = NJ.applied.has(base.id);
    const meta = [
      base.loc ? '<span>' + icon('pin') + esc(base.loc) + '</span>' : '',
      base.type ? '<span>' + esc(base.type) + '</span>' : '',
      base.level && base.level !== base.type ? '<span>' + esc(base.level) + '</span>' : ''
    ].join('');
    return '<li class="co-row" data-id="' + esc(base.id) + '" style="--rd:' + Math.min(i, 8) * 0.05 + 's">' +
      '<div class="co-main"><span class="avatar">' + esc(initials(base.company)) + '</span><div><strong>' + esc(base.company) + (applied ? '<span class="chip chip-blue">Dilamar</span>' : '') + '</strong><span class="sub">' + esc(base.title) + (base.kode ? ' · ' + esc(base.kode) : '') + '</span></div></div>' +
      '<div class="co-meta">' + meta + '</div>' +
      '<div class="co-score"><b>' + it.score + '%</b>' + bar(it.score, Math.min(i, 8) * 0.04) + '</div>' +
      '<div class="co-actions">' +
      '<button class="btn-icon' + (saved ? ' is-on' : '') + '" data-act="save" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Hapus dari simpanan' : 'Simpan lowongan') + '">' + icon('bookmark') + '</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="detail">Detail</button>' +
      '<button class="btn btn-primary btn-sm" data-act="apply">Lamar</button></div>' +
      '<div class="co-why"><button class="why-toggle" type="button" aria-expanded="false">Kenapa cocok? ' + icon('chevron') + '</button>' +
      '<div class="collapse"><div>' + reasonsHtml(it) + '</div></div></div></li>';
  }

  function renderJobs() {
    const all = filtered();
    const list = all.slice(0, state.shown);
    $('#co-list').innerHTML = list.map(rowHtml).join('');
    $('#co-empty').hidden = all.length > 0;
    $('#co-count').textContent = all.length ? 'Menampilkan ' + list.length + ' dari ' + all.length + ' lowongan' : '';
    const more = $('#btn-more');
    more.hidden = all.length <= state.shown;
    $('#f-saved').innerHTML = icon('bookmark') + 'Tersimpan (' + NJ.saved.all().length + ')';
    $('#f-saved').classList.toggle('btn-primary', state.saved);
    $('#f-saved').classList.toggle('btn-glass', !state.saved);
    $('#f-saved').setAttribute('aria-pressed', state.saved);
  }

  $('#f-type').innerHTML = E.LEVELS.map(t => '<button type="button" role="radio" data-v="' + t + '" aria-checked="' + (t === 'Semua') + '">' + (t === 'Semua' ? 'Semua tipe' : t) + '</button>').join('');
  $('#f-type').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    $$('#f-type button').forEach(x => x.setAttribute('aria-checked', x === b));
    state.type = b.dataset.v;
    state.shown = PAGE;
    renderJobs();
  });
  $('#f-q').addEventListener('input', e => { state.q = e.target.value; state.shown = PAGE; renderJobs(); });
  $('#f-min').addEventListener('input', e => { state.min = +e.target.value; $('#f-min-val').textContent = state.min + '%'; state.shown = PAGE; renderJobs(); });
  $('#f-sort').addEventListener('change', e => { state.sort = e.target.value; renderJobs(); });
  $('#f-saved').addEventListener('click', () => { state.saved = !state.saved; state.shown = PAGE; renderJobs(); });
  $('#btn-more').addEventListener('click', () => { state.shown += 8; renderJobs(); });

  document.addEventListener('click', e => {
    const tg = e.target.closest('.why-toggle');
    if (tg) {
      const c = tg.parentElement.querySelector('.collapse');
      const open = c.classList.toggle('open');
      tg.setAttribute('aria-expanded', open);
      return;
    }
    const btn = e.target.closest('#co-list [data-act]');
    if (!btn) return;
    const row = btn.closest('.co-row');
    const id = row.dataset.id;
    const it = result.listings.find(x => x.id === id);
    const base = baseOf(it);
    const act = btn.dataset.act;
    if (act === 'save') {
      const on = NJ.saved.toggle(id);
      toast(on ? 'Lowongan disimpan' : 'Dihapus dari simpanan');
    } else {
      NJ.openListing(base, it, { focusLetter: act === 'apply' });
    }
  });
  document.addEventListener('nj:change', renderJobs);

  /* ---------- aksi toolbar ---------- */
  $('#btn-copy').addEventListener('click', async () => {
    const p = result.profile;
    const lines = ['Hasil analisis NeuroJobs', 'Jurusan: ' + (p.jurusan || '-') + ' | Pengalaman: ' + (D.exp[p.exp] ? D.exp[p.exp].t : '-'), 'Skill: ' + (p.skills || []).join(', '), '', 'Posisi teratas:'];
    result.roles.slice(0, 3).forEach((r, i) => lines.push((i + 1) + '. ' + r.title + ' (' + r.score + '%, ' + E.label(r.score) + ')'));
    lines.push('', 'Perusahaan teratas:');
    result.listings.slice(0, 3).forEach((it, i) => { const b = baseOf(it); if (b) lines.push((i + 1) + '. ' + b.company + ' - ' + b.title + ' (' + it.score + '%)'); });
    if ((result.gaps || []).length) lines.push('', 'Skill untuk dipelajari: ' + result.gaps.slice(0, 4).map(g => g.skill).join(', '));
    const ok = await NJ.copy(lines.join('\n'));
    toast(ok ? 'Ringkasan disalin' : 'Gagal menyalin');
  });
  $('#btn-print').addEventListener('click', () => window.print());

  $('#btn-import').hidden = true;

  $('#history-select').addEventListener('change', e => {
    const h = store.get('history', []).find(x => x.id === +e.target.value);
    if (!h) return;
    store.set('profile', h.result.profile);
    NJ.analyzeProfile(h.result.profile).then(r => { result = r; resetAndRender(); });
  });

  function renderFootnote() {
    const m = result.ml || {};
    const mt = m.metrik || {};
    const miss = (m.unknown || []).length ? ' Skill yang tidak dikenali model (tidak ikut dihitung): ' + esc(m.unknown.join(', ')) + '.' : '';
    $('#footnote').innerHTML = icon('info') + '<span>Posisi diprediksi Random Forest hasil Colab (akurasi cross-validation top-1 ' + (mt.cv_top1_persen || '-') + '%, top-3 ' + (mt.cv_top3_persen || '-') + '%). Skor lowongan = cosine similarity skill kamu dengan skill lowongan. Semua ' + (m.total || result.listings.length) + ' lowongan dari job_dataset.csv ditampilkan.' + miss + '</span>';
  }

  function resetAndRender() {
    state.type = 'Semua'; state.q = ''; state.min = 0; state.sort = 'score'; state.saved = false; state.shown = PAGE;
    $('#f-q').value = ''; $('#f-min').value = 0; $('#f-min-val').textContent = '0%'; $('#f-sort').value = 'score';
    $$('#f-type button').forEach(x => x.setAttribute('aria-checked', x.dataset.v === 'Semua'));
    renderHead(); renderRoles(); renderGaps(); renderJobs(); renderFootnote();
  }

  resetAndRender();
})();
