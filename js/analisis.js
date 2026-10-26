/* Halaman analisis: form, tag input + autocomplete, baca CV PDF, preview langsung, riwayat. */
(function () {
  'use strict';
  const { $, $$, esc, icon, store, toast } = NJ;
  const D = NJData;
  const E = NJEngine;

  const state = { jurusan: '', exp: null, skills: [], prefType: 'Semua', prefLoc: 'Semua', cvName: '' };
  const MAX_SKILLS = 20;
  let sugIndex = -1;

  /* ---------- form dasar ---------- */
  $('#f-jurusan').innerHTML = '<option value="">Pilih jurusan</option>' + D.jurusan.map(j => '<option value="' + esc(j.v) + '">' + esc(j.l) + '</option>').join('');
  $('#pref-loc').innerHTML = D.locations.map(l => '<option value="' + esc(l) + '">' + (l === 'Semua' ? 'Semua lokasi' : esc(l)) + '</option>').join('');

  function renderSeg(el, items, getVal, getLabel, current, onPick) {
    el.innerHTML = items.map(it => '<button type="button" role="radio" data-v="' + esc(getVal(it)) + '" aria-checked="' + (String(getVal(it)) === String(current) ? 'true' : 'false') + '">' + esc(getLabel(it)) + '</button>').join('');
    el.onclick = e => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      $$('button', el).forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
      onPick(b.dataset.v);
    };
  }
  renderSeg($('#f-exp'), D.exp, x => x.v, x => x.l, state.exp, v => { state.exp = +v; clearError('exp'); update(); });
  renderSeg($('#pref-type'), D.types, x => x, x => (x === 'Semua' ? 'Semua tipe' : x), state.prefType, v => { state.prefType = v; update(); });
  $('#f-jurusan').addEventListener('change', e => { state.jurusan = e.target.value; clearError('jurusan'); update(); });
  $('#pref-loc').addEventListener('change', e => { state.prefLoc = e.target.value; update(); });

  /* ---------- error ---------- */
  function setError(field, msg) {
    const f = $('[data-field="' + field + '"]');
    f.classList.add('has-error');
    const p = $('.field-error', f);
    p.textContent = msg;
    p.hidden = false;
  }
  function clearError(field) {
    const f = $('[data-field="' + field + '"]');
    f.classList.remove('has-error');
    $('.field-error', f).hidden = true;
  }

  /* ---------- tag input ---------- */
  const box = $('#skill-box');
  const input = $('#skill-input');
  const sug = $('#skill-suggest');

  function addSkill(raw) {
    const s = E.canonical(raw);
    if (!s) return false;
    if (state.skills.some(x => x.toLowerCase() === s.toLowerCase())) { toast(s + ' sudah ada'); return false; }
    if (state.skills.length >= MAX_SKILLS) { toast('Maksimal ' + MAX_SKILLS + ' skill'); return false; }
    state.skills.push(s);
    clearError('skills');
    renderTags();
    return true;
  }
  function removeSkill(i) { state.skills.splice(i, 1); renderTags(); }

  function renderTags() {
    $$('.tag', box).forEach(t => t.remove());
    state.skills.forEach((s, i) => {
      const t = document.createElement('span');
      t.className = 'tag';
      t.innerHTML = esc(s) + '<button type="button" aria-label="Hapus ' + esc(s) + '">' + icon('x') + '</button>';
      t.querySelector('button').addEventListener('click', ev => { ev.stopPropagation(); removeSkill(i); input.focus(); });
      box.insertBefore(t, input);
    });
    renderPopular();
    update();
  }

  function renderPopular() {
    const left = D.popular.filter(s => !state.skills.includes(s)).slice(0, 8);
    $('#popular-skills').innerHTML = left.map(s => '<button type="button" class="chip" data-s="' + esc(s) + '">+ ' + esc(s) + '</button>').join('');
  }
  $('#popular-skills').addEventListener('click', e => {
    const b = e.target.closest('button[data-s]');
    if (b) addSkill(b.dataset.s);
  });

  function suggestions(q) {
    const k = q.trim().toLowerCase();
    if (!k) return [];
    const have = new Set(state.skills.map(s => s.toLowerCase()));
    const starts = [];
    const contains = [];
    D.skills.forEach(s => {
      if (have.has(s.n.toLowerCase())) return;
      const hay = [s.n].concat(s.a || []).map(x => x.toLowerCase());
      if (hay.some(h => h.startsWith(k))) starts.push(s);
      else if (hay.some(h => h.includes(k))) contains.push(s);
    });
    return starts.concat(contains).slice(0, 6);
  }
  function showSuggest() {
    const list = suggestions(input.value);
    sugIndex = -1;
    if (!list.length) { hideSuggest(); return; }
    sug.innerHTML = list.map((s, i) => '<li role="option" data-s="' + esc(s.n) + '" data-i="' + i + '"><span>' + esc(s.n) + '</span><small>' + esc(s.c) + '</small></li>').join('');
    sug.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function hideSuggest() { sug.hidden = true; input.setAttribute('aria-expanded', 'false'); sugIndex = -1; }
  function moveSuggest(d) {
    const items = $$('li', sug);
    if (!items.length) return;
    sugIndex = (sugIndex + d + items.length) % items.length;
    items.forEach((li, i) => li.classList.toggle('active', i === sugIndex));
  }

  input.addEventListener('input', showSuggest);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
    else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const items = $$('li', sug);
      let pick = input.value.replace(/,/g, '');
      if (sugIndex >= 0 && items[sugIndex]) pick = items[sugIndex].dataset.s;
      else if (items.length && !D.skills.some(s => s.n.toLowerCase() === pick.trim().toLowerCase() || (s.a || []).includes(pick.trim().toLowerCase()))) pick = items[0].dataset.s;
      if (pick.trim() && addSkill(pick)) { input.value = ''; hideSuggest(); }
    } else if (e.key === 'Backspace' && !input.value && state.skills.length) {
      removeSkill(state.skills.length - 1);
    } else if (e.key === 'Escape') hideSuggest();
  });
  input.addEventListener('paste', e => {
    const txt = (e.clipboardData || window.clipboardData).getData('text');
    if (/[,;\n]/.test(txt)) {
      e.preventDefault();
      txt.split(/[,;\n]/).forEach(t => { if (t.trim()) addSkill(t); });
    }
  });
  sug.addEventListener('mousedown', e => {
    const li = e.target.closest('li[data-s]');
    if (!li) return;
    e.preventDefault();
    addSkill(li.dataset.s);
    input.value = '';
    hideSuggest();
    input.focus();
  });
  box.addEventListener('click', () => input.focus());
  input.addEventListener('blur', () => setTimeout(hideSuggest, 120));

  /* ---------- CV PDF ---------- */
  const dz = $('#dropzone');
  const fileIn = $('#cv-file');
  let pdfReady = null;

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    if (pdfReady) return pdfReady;
    pdfReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      s.onerror = () => { pdfReady = null; reject(new Error('pdfjs')); };
      document.head.appendChild(s);
    });
    return pdfReady;
  }

  async function extractPdfText(file) {
    await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    const pages = Math.min(pdf.numPages, 6);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const c = await page.getTextContent();
      text += c.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { toast('Format harus PDF'); return; }
    if (file.size > 8 * 1024 * 1024) { toast('Ukuran CV maksimal 8 MB'); return; }
    const status = $('#cv-status');
    status.textContent = 'Membaca CV…';
    dz.classList.add('has-file');
    $('#dz-text').innerHTML = '<strong>' + esc(file.name) + '</strong>';
    state.cvName = file.name;
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        status.textContent = 'Teks tidak terbaca. CV mungkin hasil scan, isi skill secara manual ya.';
        toast('CV tidak berisi teks yang bisa dibaca');
        update();
        return;
      }
      const found = E.extractFromText(text);
      let added = 0;
      found.forEach(s => {
        if (!state.skills.includes(s) && state.skills.length < MAX_SKILLS) { state.skills.push(s); added++; }
      });
      const jur = E.detectJurusan(text);
      if (jur && !state.jurusan) {
        state.jurusan = jur;
        $('#f-jurusan').value = jur;
      }
      renderTags();
      status.textContent = added ? 'Ditemukan ' + added + ' skill baru dari CV' + (jur && state.jurusan === jur ? ' dan jurusan ' + jur : '') + '. Cek lagi sebelum menganalisis.' : 'Tidak ada skill baru yang dikenali dari CV.';
      toast(added ? added + ' skill ditambahkan dari CV' : 'Tidak ada skill baru terdeteksi');
    } catch (err) {
      status.textContent = 'Gagal membaca PDF. Pastikan internet aktif (pembaca PDF dimuat dari CDN) atau isi skill manual.';
      toast('Gagal membaca CV');
    }
    update();
  }

  dz.addEventListener('click', () => fileIn.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
  fileIn.addEventListener('change', e => handleFile(e.target.files[0]));
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  /* ---------- preview ---------- */
  let estTimer = null;
  function update() {
    const jur = D.jurusan.find(j => j.v === state.jurusan);
    $('#pv-jurusan').textContent = jur ? jur.v : '—';
    $('#pv-exp').textContent = state.exp == null ? '—' : D.exp[state.exp].t;
    $('#pv-cv').textContent = state.cvName || 'Belum diunggah';
    $('#pv-count').textContent = state.skills.length;
    $('#pv-skills').innerHTML = state.skills.length
      ? state.skills.map(s => '<span class="chip chip-blue">' + esc(s) + '</span>').join('')
      : '<span class="muted small">Belum ada skill ditambahkan</span>';
    const pct = (state.jurusan ? 25 : 0) + (state.exp != null ? 20 : 0) + Math.min(state.skills.length, 5) * 11;
    $('#pv-pct').textContent = pct + '%';
    $('#pv-bar').style.setProperty('--w', pct + '%');

    clearTimeout(estTimer);
    estTimer = setTimeout(() => {
      const box2 = $('#pv-estimate');
      if (!state.skills.length) { box2.hidden = true; return; }
      const r = E.analyze(state);
      $('#pv-est-list').innerHTML = r.roles.slice(0, 3).map(x =>
        '<div class="est-row"><span>' + esc(x.title) + '</span><b>' + x.score + '%</b>' + NJ.bar(x.score) + '</div>'
      ).join('');
      box2.hidden = false;
    }, 200);
  }

  /* ---------- riwayat ---------- */
  function renderHistory() {
    const h = store.get('history', []);
    const card = $('#history-card');
    card.hidden = !h.length;
    $('#history-list').innerHTML = h.map(it => {
      const top = it.result.roles[0];
      const d = new Date(it.ts);
      const when = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return '<li data-id="' + it.id + '"><div class="meta"><strong>' + esc(top ? top.title : 'Hasil') + (top ? ' · ' + top.score + '%' : '') + '</strong><span>' + when + ' · ' + it.result.profile.skills.length + ' skill</span></div>' +
        '<div class="acts"><button type="button" class="btn btn-glass btn-sm" data-act="open">Buka</button><button type="button" class="btn-icon" data-act="load" aria-label="Muat profil ini" title="Muat profil ini">' + icon('history') + '</button></div></li>';
    }).join('');
  }
  $('#history-list').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = +b.closest('li').dataset.id;
    const it = store.get('history', []).find(x => x.id === id);
    if (!it) return;
    if (b.dataset.act === 'open') { store.set('result', it.result); location.href = 'hasil.html'; }
    else { applyProfile(it.result.profile); toast('Profil dimuat dari riwayat'); }
  });
  $('#history-clear').addEventListener('click', () => { store.del('history'); renderHistory(); toast('Riwayat dihapus'); });

  function applyProfile(p) {
    state.jurusan = p.jurusan || '';
    state.exp = p.exp == null ? null : +p.exp;
    state.skills = (p.skills || []).slice(0, MAX_SKILLS);
    state.prefType = p.prefType || 'Semua';
    state.prefLoc = p.prefLoc || 'Semua';
    $('#f-jurusan').value = state.jurusan;
    $('#pref-loc').value = state.prefLoc;
    renderSeg($('#f-exp'), D.exp, x => x.v, x => x.l, state.exp, v => { state.exp = +v; clearError('exp'); update(); });
    renderSeg($('#pref-type'), D.types, x => x, x => (x === 'Semua' ? 'Semua tipe' : x), state.prefType, v => { state.prefType = v; update(); });
    renderTags();
  }

  /* ---------- kirim & analisis ---------- */
  const stepsText = ['Membaca profil dan skill', 'Memetakan skill ke posisi karier', 'Menghitung kecocokan perusahaan', 'Menyusun rekomendasi dan skill gap'];

  async function runAnalysis(profile) {
    if (location.protocol.indexOf('http') === 0) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile), signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) { const res = await r.json(); res.source = 'server'; return res; }
      } catch (e) { /* jatuh ke engine lokal */ }
    }
    const res = E.analyze(profile);
    res.source = 'lokal';
    return res;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  $('#form').addEventListener('submit', async e => {
    e.preventDefault();
    let bad = false;
    if (!state.jurusan) { setError('jurusan', 'Pilih jurusan kamu dulu.'); bad = true; }
    if (state.exp == null) { setError('exp', 'Pilih pengalaman kerja kamu.'); bad = true; }
    if (!state.skills.length) { setError('skills', 'Tambahkan minimal satu skill.'); bad = true; }
    if (bad) {
      const first = $('.has-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const overlay = $('#overlay');
    const list = $('#steps');
    list.innerHTML = stepsText.map(t => '<li><span class="dot">' + icon('check') + '</span>' + esc(t) + '</li>').join('');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    $('#btn-analyze').disabled = true;
    const items = $$('li', list);
    const ovBar = $('#ov-bar');

    const work = runAnalysis(Object.assign({}, state));
    for (let i = 0; i < items.length; i++) {
      items[i].classList.add('active');
      ovBar.style.setProperty('--w', Math.round(((i + 0.5) / items.length) * 100) + '%');
      await sleep(620);
      items[i].classList.remove('active');
      items[i].classList.add('done');
    }
    const res = await work;
    ovBar.style.setProperty('--w', '100%');

    res.profile.cvName = state.cvName;
    store.set('result', res);
    const hist = store.get('history', []);
    hist.unshift({ id: Date.now(), ts: Date.now(), result: res });
    store.set('history', hist.slice(0, 5));
    await sleep(350);
    location.href = 'hasil.html';
  });

  /* ---------- awal ---------- */
  const pre = store.get('prefill', null);
  if (pre) { store.del('prefill'); applyProfile(pre); toast('Skill dari beranda sudah dimasukkan'); }
  else { renderTags(); }
  renderHistory();
  window.addEventListener('pageshow', e => {
    if (e.persisted) { $('#overlay').classList.remove('open'); $('#btn-analyze').disabled = false; }
  });
})();
