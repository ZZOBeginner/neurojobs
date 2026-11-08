/* Dashboard data: muat CSV, KPI, grafik batang interaktif, panel kualitas, tabel (cari, filter, sort, halaman). */
(function () {
  'use strict';
  const { $, $$, esc, icon, toast } = NJ;
  const DS = NJDataset;

  const CSV_URL = 'data/job_dataset.csv';
  const fmt = n => Number(n).toLocaleString('id-ID');
  const pct = (n, t) => (t ? ((n / t) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '%' : '0%');

  const S = {
    ds: null,
    name: '',
    mode: 'raw',                       // 'raw' | 'clean'
    softHide: false,
    view: { title: 'chart', level: 'chart', years: 'chart', skill: 'chart' },
    f: { q: '', level: '', issue: '', title: '', years: '', skill: '' },   // skill & title disimpan sebagai key
    skillLabel: '',
    sort: { key: '', dir: 0 },        // dir: 1 naik, -1 turun, 0 asli
    page: 1,
    size: 20,
    open: new Set(),
    animate: true
  };

  /* ---------- akses nilai menurut mode ---------- */
  const val = {
    title: r => (S.mode === 'clean' ? r.titleClean : r.title),
    level: r => (S.mode === 'clean' ? r.levelClean : r.level),
    years: r => (S.mode === 'clean' ? r.yBucket : r.years),
    skills: r => (S.mode === 'clean' ? r.skillsClean : r.skillsRaw)
  };
  const skillKeyOf = s => (S.mode === 'clean' ? DS.skillKey(s) : s.toLowerCase());

  /* ---------- memuat data ---------- */
  function load(text, name) {
    const parsed = DS.parseCSV(text);
    if (!parsed.header.length || !parsed.rows.length) throw new Error('CSV kosong');
    const ds = DS.build(parsed);
    const m = ds.map;
    if (m.title == null && m.skills == null && m.level == null) {
      throw new Error('Kolom tidak dikenali. Kolom yang terbaca: ' + parsed.header.slice(0, 8).join(', '));
    }
    S.ds = ds;
    S.name = name;
    S.mode = 'raw';
    S.f = { q: '', level: '', issue: '', title: '', years: '', skill: '' };
    S.sort = { key: '', dir: 0 };
    S.page = 1;
    S.open.clear();
    S.animate = true;
    $('#state-empty').hidden = true;
    $('#dash').hidden = false;
    renderAll();
  }

  async function loadFile(file) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { toast('File harus berformat .csv'); return; }
    if (file.size > 25 * 1024 * 1024) { toast('Ukuran file maksimal 25 MB'); return; }
    try {
      load(await file.text(), file.name);
      toast(fmt(S.ds.recs.length) + ' baris dimuat dari ' + file.name);
    } catch (e) {
      toast(e.message || 'Gagal membaca CSV');
      if (!S.ds) showEmpty('Unggah file CSV dataset', e.message);
    }
  }

  function showEmpty(title, msg) {
    $('#state-empty').hidden = false;
    $('#dash').hidden = true;
    $('#empty-title').textContent = title;
    if (msg) $('#empty-text').textContent = msg;
  }

  /* ---------- tooltip ---------- */
  const tip = $('#tip');
  function showTip(e, el, strong, small) {
    tip.replaceChildren();
    const b = document.createElement('b'); b.textContent = strong;
    const s = document.createElement('span'); s.textContent = small;
    tip.append(b, s);
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const x = e && e.clientX != null && e.type !== 'focusin' ? e.clientX : r.left + r.width / 2;
    const y = e && e.clientY != null && e.type !== 'focusin' ? e.clientY : r.top;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14)) + 'px';
    tip.style.top = Math.max(8, y - h - 12 < 8 ? y + 18 : y - h - 12) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- header & KPI ---------- */
  function renderHeader() {
    const { ds } = S;
    $('#src-name').textContent = S.name;
    $('#src-meta').textContent = fmt(ds.recs.length) + ' baris · ' + ds.header.length + ' kolom';
    $('#btn-replace').innerHTML = icon('upload') + 'Ganti CSV';
    $('#btn-download').innerHTML = icon('download') + 'Unduh CSV rapi';
    $$('#mode button').forEach(b => b.setAttribute('aria-checked', b.dataset.v === S.mode));
    $('#mode-note').textContent = S.mode === 'raw'
      ? 'Menampilkan data persis seperti di file. Beralih ke "Sudah dirapikan" untuk melihat hasil penyeragaman penulisan.'
      : 'Penulisan level, tahun, nama skill, dan judul sudah diseragamkan hanya untuk tampilan ini. File aslimu tidak berubah.';
  }

  function renderKpis() {
    const { ds } = S;
    const st = ds.stats;
    const other = S.mode === 'raw' ? 'clean' : 'raw';
    const pair = (a, b) => (S.mode === 'raw' ? 'Setelah dirapikan: ' + fmt(b) : 'Data asli: ' + fmt(a));
    const flagged = ds.recs.filter(r => r.flags.length).length;
    const tiles = [];
    tiles.push({ cls: 'kpi-hero', label: 'Lowongan dalam dataset', v: fmt(st.total), cap: ds.header.length + ' kolom data' });
    if (ds.map.title != null) tiles.push({ label: 'Posisi unik', v: fmt(st.titles[S.mode].size), cap: pair(st.titles.raw.size, st.titles.clean.size) });
    if (ds.map.skills != null) {
      tiles.push({ label: 'Skill unik', v: fmt(st.skills[S.mode].length), cap: pair(st.skills.raw.length, st.skills.clean.length) });
      tiles.push({ label: 'Rata-rata skill per lowongan', v: st.avgSkills[S.mode].toLocaleString('id-ID', { maximumFractionDigits: 1 }), cap: 'dari kolom Skills' });
    }
    tiles.push({ label: 'Baris perlu dicek', v: fmt(flagged), cap: pct(flagged, st.total) + ' dari seluruh baris · ' + ds.issues.length + ' jenis masalah' });
    void other;
    $('#kpis').innerHTML = tiles.map(t =>
      '<div class="card kpi ' + (t.cls || '') + '"><span class="k-label">' + esc(t.label) + '</span><span class="k-val">' + esc(t.v) + '</span><span class="k-cap">' + esc(t.cap) + '</span></div>'
    ).join('');
  }

  /* ---------- grafik ---------- */
  function chartRows(type) {
    const st = S.ds.stats;
    const total = st.total;
    const byCount = m => Array.from(m.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
    if (type === 'title') {
      const all = byCount(st.titles[S.mode]);
      return { rows: all.slice(0, 10).map(([k, n]) => ({ key: k, label: k, n })), foot: 'Menampilkan 10 dari ' + fmt(all.length) + ' posisi unik.' };
    }
    if (type === 'level') {
      let rows;
      const m = st.levels[S.mode];
      if (S.mode === 'clean') rows = DS.LEVELS.filter(l => m.has(l)).map(l => ({ key: l, label: l, n: m.get(l) })).concat(byCount(m).filter(([k]) => !DS.LEVELS.includes(k)).map(([k, n]) => ({ key: k, label: k, n })));
      else rows = byCount(m).map(([k, n]) => ({ key: k, label: k, n }));
      return { rows, foot: S.mode === 'raw' ? fmt(m.size) + ' penulisan berbeda untuk level.' : 'Level diseragamkan jadi ' + fmt(m.size) + ' kelompok.' };
    }
    if (type === 'years') {
      const m = st.years[S.mode];
      if (S.mode === 'clean') return { rows: DS.BUCKETS.filter(b => m.has(b)).map(b => ({ key: b, label: b, n: m.get(b) })), foot: 'Dikelompokkan berdasarkan batas bawah pengalaman.' };
      const all = byCount(m);
      const top = all.slice(0, 10).map(([k, n]) => ({ key: k, label: k, n }));
      const restN = all.slice(10).reduce((s, x) => s + x[1], 0);
      return { rows: top, foot: 'Ada ' + fmt(all.length) + ' penulisan berbeda. Menampilkan 10 teratas; ' + fmt(restN) + ' lowongan lain memakai penulisan lain.' };
    }
    /* skill */
    let arr = st.skills[S.mode].slice();
    if (S.softHide) arr = arr.filter(s => !s.soft);
    arr.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return { rows: arr.slice(0, 12).map(s => ({ key: s.key, label: s.name, n: s.n })), foot: S.softHide ? 'Soft skill (komunikasi, kepemimpinan, dll.) disembunyikan.' : 'Termasuk soft skill seperti komunikasi dan kepemimpinan.' };
  }

  const CHARTS = [
    { id: 'title', need: 'title', title: 'Posisi terbanyak', sub: 'Jumlah lowongan per judul posisi', filter: 'title' },
    { id: 'level', need: 'level', title: 'Level pengalaman', sub: 'Jumlah lowongan per level', filter: 'level' },
    { id: 'years', need: 'years', title: 'Tahun pengalaman', sub: 'Jumlah lowongan per kebutuhan pengalaman', filter: 'years' },
    { id: 'skill', need: 'skills', title: 'Skill paling sering muncul', sub: 'Jumlah lowongan yang mensyaratkan skill', filter: 'skill' }
  ];

  function renderCharts() {
    const host = $('#charts');
    const vis = CHARTS.filter(c => S.ds.map[c.need] != null);
    $('#sec-charts').hidden = !vis.length;
    host.innerHTML = vis.map(c =>
      '<article class="card chart-card" data-chart="' + c.id + '"><div class="chart-head"><div><h3>' + c.title + '</h3><p>' + c.sub + '</p></div>' +
      '<div class="chart-tools">' +
      (c.id === 'skill' ? '<label class="toggle"><input type="checkbox" id="soft-toggle"' + (S.softHide ? ' checked' : '') + '> Sembunyikan soft skill</label>' : '') +
      '<div class="seg seg-sm" role="radiogroup" aria-label="Tampilan ' + c.title + '"><button type="button" role="radio" data-view="chart" aria-checked="' + (S.view[c.id] === 'chart') + '">Grafik</button><button type="button" role="radio" data-view="table" aria-checked="' + (S.view[c.id] === 'table') + '">Tabel</button></div>' +
      '</div></div><div class="chart-body"></div><p class="chart-foot"></p></article>'
    ).join('');
    vis.forEach(c => drawChart(c));
    S.animate = false;
  }

  function selKey(c) { return c.filter === 'skill' ? S.f.skill : S.f[c.filter]; }

  function drawChart(c) {
    const card = $('[data-chart="' + c.id + '"]');
    if (!card) return;
    const { rows, foot } = chartRows(c.id);
    const total = S.ds.stats.total;
    const body = $('.chart-body', card);
    $('.chart-foot', card).textContent = foot;
    const sel = selKey(c);

    if (!rows.length) { body.innerHTML = '<p class="muted small">Tidak ada data untuk ditampilkan.</p>'; return; }

    if (S.view[c.id] === 'table') {
      body.innerHTML = '<table class="mini"><thead><tr><th>' + c.title.split(' ')[0] + '</th><th>Lowongan</th><th>Persen</th></tr></thead><tbody>' +
        rows.map(r => '<tr><td>' + esc(r.label) + '</td><td>' + fmt(r.n) + '</td><td>' + pct(r.n, total) + '</td></tr>').join('') + '</tbody></table>';
      return;
    }

    const max = Math.max.apply(null, rows.map(r => r.n));
    const ul = document.createElement('ul');
    ul.className = 'hb-list' + (sel ? ' has-sel' : '');
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'hb' + (r.static ? ' static' : '') + (sel && sel === r.key ? ' sel' : '');
      li.tabIndex = r.static ? -1 : 0;
      li.dataset.key = r.key;
      li.dataset.label = r.label;
      li.dataset.n = r.n;
      if (!r.static) { li.setAttribute('role', 'button'); li.setAttribute('aria-pressed', sel === r.key ? 'true' : 'false'); }
      li.setAttribute('aria-label', r.label + ': ' + fmt(r.n) + ' lowongan');
      const w = (r.n / max) * 100;
      li.innerHTML = '<span class="hb-label" title="' + esc(r.label) + '">' + esc(r.label) + '</span><span class="hb-track" style="--w:' + w.toFixed(2) + '%"><span class="hb-fill" style="--d:' + (S.animate ? i * 0.04 : 0) + 's' + (S.animate ? '' : ';animation:none') + '"></span><span class="hb-val">' + fmt(r.n) + '</span></span>';
      ul.appendChild(li);
    });
    body.replaceChildren(ul);
  }

  $('#charts').addEventListener('pointerover', e => {
    const li = e.target.closest('.hb');
    if (li) showTip(e, li, fmt(li.dataset.n) + ' lowongan', li.dataset.label + ' · ' + pct(+li.dataset.n, S.ds.stats.total));
  });
  $('#charts').addEventListener('pointermove', e => {
    const li = e.target.closest('.hb');
    if (li) showTip(e, li, fmt(li.dataset.n) + ' lowongan', li.dataset.label + ' · ' + pct(+li.dataset.n, S.ds.stats.total));
    else hideTip();
  });
  $('#charts').addEventListener('pointerleave', hideTip);
  $('#charts').addEventListener('focusin', e => {
    const li = e.target.closest('.hb');
    if (li) showTip(e, li, fmt(li.dataset.n) + ' lowongan', li.dataset.label + ' · ' + pct(+li.dataset.n, S.ds.stats.total));
  });
  $('#charts').addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  function pickBar(li) {
    if (!li || li.classList.contains('static')) return;
    const card = li.closest('[data-chart]');
    const c = CHARTS.find(x => x.id === card.dataset.chart);
    const key = li.dataset.key;
    const cur = selKey(c);
    const next = cur === key ? '' : key;
    S.f[c.filter] = next;
    if (c.filter === 'skill') S.skillLabel = next ? li.dataset.label : '';
    S.page = 1;
    hideTip();
    drawChart(c);
    renderTable();
    if (next) {
      toast('Tabel disaring: ' + li.dataset.label);
      const t = $('#sec-table');
      const top = t.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.75) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  $('#charts').addEventListener('click', e => {
    const seg = e.target.closest('[data-view]');
    if (seg) {
      const c = CHARTS.find(x => x.id === seg.closest('[data-chart]').dataset.chart);
      S.view[c.id] = seg.dataset.view;
      $$('[data-view]', seg.parentElement).forEach(b => b.setAttribute('aria-checked', b === seg));
      drawChart(c);
      return;
    }
    pickBar(e.target.closest('.hb'));
  });
  $('#charts').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('hb')) { e.preventDefault(); pickBar(e.target); }
  });
  $('#charts').addEventListener('change', e => {
    if (e.target.id === 'soft-toggle') { S.softHide = e.target.checked; drawChart(CHARTS[3]); }
  });

  /* ---------- kualitas ---------- */
  function renderQuality() {
    const { ds } = S;
    const list = $('#qlist');
    $('#q-summary').textContent = ds.issues.length ? ds.issues.length + ' jenis masalah ditemukan' : '';
    if (!ds.issues.length) { list.innerHTML = '<li class="q-ok">Tidak ada masalah penulisan yang ditemukan di dataset ini.</li>'; return; }
    list.innerHTML = ds.issues.map(i =>
      '<li class="q-item' + (S.f.issue === i.key ? ' on' : '') + '" data-key="' + i.key + '"><span class="q-ic">' + icon('info') + '</span>' +
      '<div><strong>' + esc(i.label) + '</strong><p>' + esc(i.detail) + '</p></div>' +
      '<div class="q-act"><span class="q-count">' + fmt(i.count) + ' baris</span><button type="button" class="btn btn-glass btn-sm" data-issue="' + i.key + '">' + (S.f.issue === i.key ? 'Hapus filter' : 'Lihat baris') + '</button></div></li>'
    ).join('');
  }
  $('#qlist').addEventListener('click', e => {
    const b = e.target.closest('[data-issue]');
    if (!b) return;
    S.f.issue = S.f.issue === b.dataset.issue ? '' : b.dataset.issue;
    S.page = 1;
    renderQuality();
    renderTable();
    if (S.f.issue) $('#sec-table').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- tabel ---------- */
  const COL = { id: r => r.id, title: r => val.title(r), level: r => val.level(r), years: r => (r.yMin == null ? 9999 : r.yMin), skills: r => val.skills(r).length };

  function filteredRows() {
    const f = S.f;
    const q = f.q.trim().toLowerCase();
    const issue = f.issue ? S.ds.issues.find(i => i.key === f.issue) : null;
    const issueSet = issue ? new Set(issue.rows) : null;
    const out = S.ds.recs.filter(r => {
      if (issueSet && !issueSet.has(r.i)) return false;
      if (f.title && val.title(r) !== f.title) return false;
      if (f.level && val.level(r) !== f.level) return false;
      if (f.years && val.years(r) !== f.years) return false;
      if (f.skill && !val.skills(r).some(s => skillKeyOf(s) === f.skill)) return false;
      if (q) {
        const hay = (r.id + ' ' + val.title(r) + ' ' + val.level(r) + ' ' + val.skills(r).join(' ') + ' ' + r.keywords.join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (S.sort.dir) {
      const get = COL[S.sort.key];
      const d = S.sort.dir;
      out.sort((a, b) => {
        const x = get(a), y = get(b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'id', { numeric: true });
        return c * d || a.i - b.i;
      });
    }
    return out;
  }

  function renderFilterControls() {
    const lv = new Set();
    S.ds.recs.forEach(r => { const v = val.level(r); if (v) lv.add(v); });
    const order = S.mode === 'clean' ? DS.LEVELS.filter(l => lv.has(l)).concat(Array.from(lv).filter(l => !DS.LEVELS.includes(l))) : Array.from(lv).sort();
    $('#t-level').innerHTML = '<option value="">Semua level</option>' + order.map(l => '<option value="' + esc(l) + '"' + (S.f.level === l ? ' selected' : '') + '>' + esc(l) + '</option>').join('');
    $('#t-level').hidden = S.ds.map.level == null;
    $('#t-issue').innerHTML = '<option value="">Semua baris</option>' + S.ds.issues.map(i => '<option value="' + i.key + '"' + (S.f.issue === i.key ? ' selected' : '') + '>' + esc(i.label) + ' (' + fmt(i.count) + ')</option>').join('');
    $('#t-issue').hidden = !S.ds.issues.length;
  }

  function renderChips() {
    const chips = [];
    const add = (k, text) => chips.push('<button type="button" class="chip-x" data-clear="' + k + '">' + esc(text) + icon('x') + '</button>');
    if (S.f.title) add('title', 'Posisi: ' + S.f.title);
    if (S.f.years) add('years', 'Pengalaman: ' + S.f.years);
    if (S.f.skill) add('skill', 'Skill: ' + (S.skillLabel || S.f.skill));
    if (S.f.level) add('level', 'Level: ' + S.f.level);
    if (S.f.issue) { const i = S.ds.issues.find(x => x.key === S.f.issue); if (i) add('issue', 'Masalah: ' + i.label); }
    $('#t-chips').innerHTML = chips.join('');
  }

  function skillChips(list, max) {
    const shown = list.slice(0, max).map(s => '<span class="chip">' + esc(s) + '</span>').join('');
    return shown + (list.length > max ? '<span class="chip">+' + (list.length - max) + '</span>' : '');
  }

  function rowHtml(r) {
    const open = S.open.has(r.i);
    const ttl = val.title(r);
    const issues = r.flags.map(k => (S.ds.issues.find(i => i.key === k) || {}).label).filter(Boolean);
    let h = '<tr class="r" data-i="' + r.i + '"><td><div class="cell-id"><button type="button" class="row-btn" data-open="' + r.i + '" aria-expanded="' + open + '" aria-label="Detail baris ' + esc(r.id) + '">' + icon('chevron') + '</button>' +
      '<span>' + esc(r.id) + '</span>' + (r.flags.length ? '<span class="flag" title="' + esc(issues.join(', ')) + '" aria-label="Ada masalah data"></span>' : '') + '</div></td>' +
      '<td class="t-title">' + (ttl ? esc(ttl) : '<span class="t-none">(tanpa judul)</span>') + '</td>' +
      '<td>' + esc(val.level(r)) + '</td><td>' + esc(val.years(r)) + '</td>' +
      '<td><div class="t-skills">' + skillChips(val.skills(r), 4) + '</div></td></tr>';
    if (open) {
      h += '<tr class="x-row"><td colspan="5"><div class="x-grid">' +
        '<div><h4>Semua skill (' + val.skills(r).length + ')</h4><div class="chips">' + skillChips(val.skills(r), 99) + '</div></div>' +
        '<div><h4>Tanggung jawab</h4>' + (r.duties.length ? '<ul>' + r.duties.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul>' : '<p class="muted small">Kosong</p>') + '</div>' +
        '<div><h4>Keyword' + (issues.length ? ' dan catatan' : '') + '</h4><div class="chips">' + (r.keywords.length ? r.keywords.map(k => '<span class="chip">' + esc(k) + '</span>').join('') : '<span class="muted small">Kosong</span>') + '</div>' +
        (issues.length ? '<p class="muted small" style="margin-top:10px">Catatan: ' + esc(issues.join(', ')) + '.</p>' : '') + '</div></div></td></tr>';
    }
    return h;
  }

  function renderTable() {
    const rows = filteredRows();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / S.size));
    if (S.page > pages) S.page = pages;
    const start = (S.page - 1) * S.size;
    const slice = rows.slice(start, start + S.size);

    $('#dt-body').innerHTML = slice.map(rowHtml).join('');
    $('#dt').hidden = !total;
    $('#t-empty').hidden = total > 0;
    $('#pager').hidden = !total;
    $('#t-count').textContent = total ? 'Menampilkan ' + fmt(start + 1) + '–' + fmt(start + slice.length) + ' dari ' + fmt(total) + ' baris' + (total !== S.ds.recs.length ? ' (disaring dari ' + fmt(S.ds.recs.length) + ')' : '') : '';
    $('#pg-info').textContent = 'Halaman ' + fmt(S.page) + ' dari ' + fmt(pages);
    $('#pg-prev').disabled = S.page <= 1;
    $('#pg-next').disabled = S.page >= pages;
    $$('.th-btn').forEach(b => {
      if (b.dataset.sort === S.sort.key && S.sort.dir) b.setAttribute('aria-sort', S.sort.dir === 1 ? 'ascending' : 'descending');
      else b.removeAttribute('aria-sort');
    });
    renderChips();
    $('#t-level').value = S.f.level;
    $('#t-issue').value = S.f.issue;
  }

  /* kontrol tabel */
  $('#t-q').addEventListener('input', e => { S.f.q = e.target.value; S.page = 1; renderTable(); });
  $('#t-level').addEventListener('change', e => { S.f.level = e.target.value; S.page = 1; drawChartIf('level'); renderTable(); });
  $('#t-issue').addEventListener('change', e => { S.f.issue = e.target.value; S.page = 1; renderQuality(); renderTable(); });
  $('#t-size').addEventListener('change', e => { S.size = +e.target.value; S.page = 1; renderTable(); });
  $('#pg-prev').addEventListener('click', () => { S.page--; renderTable(); $('#sec-table').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#pg-next').addEventListener('click', () => { S.page++; renderTable(); $('#sec-table').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#t-reset').addEventListener('click', resetFilters);

  function drawChartIf(id) { const c = CHARTS.find(x => x.id === id); if (c) drawChart(c); }

  function resetFilters() {
    S.f = { q: '', level: '', issue: '', title: '', years: '', skill: '' };
    S.skillLabel = '';
    S.page = 1;
    $('#t-q').value = '';
    CHARTS.forEach(c => drawChart(c));
    renderQuality();
    renderTable();
  }

  $('#t-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-clear]');
    if (!b) return;
    const k = b.dataset.clear;
    S.f[k] = '';
    if (k === 'skill') S.skillLabel = '';
    S.page = 1;
    CHARTS.forEach(c => drawChart(c));
    renderQuality();
    renderTable();
  });

  $('#dt').addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) {
      const i = +o.dataset.open;
      if (S.open.has(i)) S.open.delete(i); else S.open.add(i);
      renderTable();
      return;
    }
    const th = e.target.closest('.th-btn');
    if (th) {
      const k = th.dataset.sort;
      if (S.sort.key !== k) S.sort = { key: k, dir: 1 };
      else S.sort.dir = S.sort.dir === 1 ? -1 : S.sort.dir === -1 ? 0 : 1;
      S.page = 1;
      renderTable();
    }
  });

  /* ---------- mode, unggah, unduh ---------- */
  $('#mode').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b || b.dataset.v === S.mode) return;
    const had = S.f.title || S.f.level || S.f.years || S.f.skill;
    S.mode = b.dataset.v;
    S.f.title = S.f.level = S.f.years = S.f.skill = '';
    S.skillLabel = '';
    S.page = 1;
    S.animate = true;
    if (had) toast('Filter dari grafik direset karena tampilan berubah');
    renderAll();
  });

  const fileIn = $('#csv-file');
  $('#btn-replace').addEventListener('click', () => fileIn.click());
  $('#empty-pick').addEventListener('click', () => fileIn.click());
  fileIn.addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; loadFile(f); });

  $('#btn-download').addEventListener('click', () => {
    const blob = new Blob(['﻿' + DS.cleanedCSV(S.ds)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = S.name.replace(/\.csv$/i, '') + '_rapi.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('CSV yang sudah dirapikan diunduh');
  });

  /* seret & lepas file ke mana saja di halaman */
  ['dragenter', 'dragover'].forEach(ev => window.addEventListener(ev, e => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); $('#state-empty').classList.add('drag'); }
  }));
  ['dragleave', 'drop'].forEach(ev => window.addEventListener(ev, e => { if (ev === 'drop' || !e.relatedTarget) $('#state-empty').classList.remove('drag'); }));
  window.addEventListener('drop', e => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    loadFile(e.dataTransfer.files[0]);
  });

  /* ---------- render menyeluruh ---------- */
  function renderAll() {
    renderHeader();
    renderKpis();
    renderCharts();
    renderQuality();
    renderFilterControls();
    renderTable();
    NJ.reveal();
  }

  /* ---------- awal: muat dataset bawaan lewat server ---------- */
  (async function init() {
    if (location.protocol.indexOf('http') === 0) {
      try {
        const r = await fetch(CSV_URL, { cache: 'no-cache' });
        if (!r.ok) throw new Error('http ' + r.status);
        load(await r.text(), 'job_dataset.csv');
        return;
      } catch (e) { /* tampilkan layar unggah */ }
      showEmpty('Unggah file CSV dataset', 'Dataset bawaan (data/job_dataset.csv) tidak ditemukan. Tarik file .csv ke sini atau pilih dari komputer kamu.');
    } else {
      showEmpty('Unggah file CSV dataset', 'Halaman dibuka langsung dari file, jadi dataset bawaan tidak bisa dimuat otomatis. Tarik file .csv ke sini atau pilih dari komputer kamu, atau jalankan lewat server (start.bat).');
    }
  })();
})();
