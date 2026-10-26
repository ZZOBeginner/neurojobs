/* Fungsi bersama: navigasi, tema, ikon, penyimpanan, toast, drawer detail lowongan. */
(function () {
  'use strict';
  const NJ = (window.NJ = {});
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  NJ.$ = $;
  NJ.$$ = $$;
  NJ.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = NJ.esc;

  /* ---------- penyimpanan ---------- */
  NJ.store = {
    get(k, d) {
      try { const v = localStorage.getItem('nj.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('nj.' + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    del(k) { try { localStorage.removeItem('nj.' + k); } catch (e) { /* abaikan */ } }
  };

  function listStore(key) {
    return {
      all() { return NJ.store.get(key, []); },
      has(id) { return this.all().includes(id); },
      toggle(id) {
        const a = this.all();
        const i = a.indexOf(id);
        if (i >= 0) a.splice(i, 1); else a.push(id);
        NJ.store.set(key, a);
        document.dispatchEvent(new CustomEvent('nj:change'));
        return i < 0;
      },
      add(id) {
        const a = this.all();
        if (!a.includes(id)) { a.push(id); NJ.store.set(key, a); }
        document.dispatchEvent(new CustomEvent('nj:change'));
      }
    };
  }
  NJ.saved = listStore('saved');
  NJ.applied = listStore('applied');

  /* ---------- ikon (line, satu gaya) ---------- */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    circle: '<circle cx="12" cy="12" r="7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    file: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    building: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2"/>',
    gap: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 4v12m0 0-4-4m4 4 4-4"/><path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    send: '<path d="m4 12 16-8-6 16-3-6z"/>'
  };
  NJ.icon = (n, cls) =>
    '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  NJ.bar = (score, delay) =>
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + score + '"><span style="--w:' + score + '%;--d:' + (delay || 0) + 's"></span></div>';

  NJ.initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  NJ.fmtDays = d => (d === 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : d + ' hari lalu');

  NJ.copy = async function (text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* lanjut ke fallback */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  };

  /* ---------- toast ---------- */
  NJ.toast = function (msg) {
    let root = $('#toast-root');
    if (!root) { root = document.createElement('div'); root.id = 'toast-root'; document.body.appendChild(root); }
    const t = document.createElement('div');
    t.className = 'toast glass';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3000);
  };

  /* ---------- reveal & hitung angka ---------- */
  let revealIO = null;
  NJ.reveal = function (root) {
    const els = $$('.reveal:not(.in)', root || document);
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    els.forEach(e => revealIO.observe(e));
  };

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = +el.dataset.count || 0;
    const dur = 1300;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('id-ID');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  NJ.observeCounts = function () {
    const els = $$('[data-count]:not([data-counted])');
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(e => io.observe(e));
  };

  /* ---------- drawer ---------- */
  NJ.drawer = {
    el: null,
    bd: null,
    open(html, onMount) {
      NJ.drawer.close(true);
      const bd = document.createElement('div');
      bd.className = 'backdrop';
      const dr = document.createElement('aside');
      dr.className = 'drawer glass';
      dr.setAttribute('role', 'dialog');
      dr.setAttribute('aria-modal', 'true');
      dr.innerHTML = html;
      document.body.append(bd, dr);
      document.body.classList.add('no-scroll');
      requestAnimationFrame(() => { bd.classList.add('open'); dr.classList.add('open'); });
      bd.addEventListener('click', () => NJ.drawer.close());
      dr.addEventListener('click', e => { if (e.target.closest('[data-close]')) NJ.drawer.close(); });
      NJ.drawer._esc = e => { if (e.key === 'Escape') NJ.drawer.close(); };
      document.addEventListener('keydown', NJ.drawer._esc);
      NJ.drawer.el = dr;
      NJ.drawer.bd = bd;
      if (onMount) onMount(dr);
      const f = dr.querySelector('[data-close]');
      if (f) f.focus();
    },
    close(instant) {
      const { el, bd } = NJ.drawer;
      if (!el) return;
      document.removeEventListener('keydown', NJ.drawer._esc);
      document.body.classList.remove('no-scroll');
      NJ.drawer.el = null;
      NJ.drawer.bd = null;
      if (instant) { el.remove(); bd.remove(); return; }
      el.classList.remove('open');
      bd.classList.remove('open');
      setTimeout(() => { el.remove(); bd.remove(); }, 420);
    }
  };

  /* ---------- draf surat lamaran ---------- */
  NJ.letter = function (base, info, profile) {
    const D = NJData;
    const jur = profile && profile.jurusan && profile.jurusan !== 'Lainnya' ? 'lulusan ' + profile.jurusan : 'fresh graduate bidang IT';
    const have = info && info.matched && info.matched.length ? info.matched : (profile && profile.skills ? profile.skills : []);
    const miss = info && info.missing ? info.missing : [];
    const skillLine = have.length ? 'Saya memiliki dasar di ' + NJEngine.listText(have.slice(0, 5)) + (miss.length ? ', dan sedang mendalami ' + NJEngine.listText(miss.slice(0, 2)) : '') + '.' : 'Saya antusias untuk terus belajar dan berkembang.';
    void D;
    return 'Yth. Tim Rekrutmen ' + base.company + ',\n\n' +
      'Saya ' + jur + ' yang tertarik pada posisi ' + base.title + '. ' + skillLine + '\n\n' +
      'Saya terbiasa belajar mandiri, terbuka pada masukan, dan siap berkontribusi serta berkembang bersama tim. CV saya terlampir untuk bahan pertimbangan.\n\n' +
      'Terima kasih atas waktu dan kesempatannya.\n\nHormat saya,\n[Nama kamu]';
  };

  /* ---------- drawer detail lowongan ---------- */
  NJ.openListing = function (base, info, opt) {
    opt = opt || {};
    const D = NJData;
    const role = D.roles.find(r => r.id === base.role);
    const res = NJ.store.get('result', null);
    const profile = res ? res.profile : {};
    const matched = info ? info.matched : [];
    const missing = info ? info.missing : [];
    const skills = base.skills || [];
    const score = info ? info.score : null;
    const metaChips = [
      base.loc ? '<span class="chip">' + NJ.icon('pin') + esc(base.loc) + '</span>' : '',
      base.type ? '<span class="chip">' + NJ.icon('briefcase') + esc(base.type) + '</span>' : '',
      base.level && base.level !== base.type ? '<span class="chip">' + esc(base.level) + '</span>' : '',
      base.salary ? '<span class="chip">' + esc(base.salary) + '</span>' : ''
    ].join('');
    const html =
      '<div class="dr-head"><div class="dr-id"><span class="avatar">' + esc(NJ.initials(base.company)) + '</span><div><h2>' + esc(base.title) + '</h2><p class="muted">' + esc(base.company) + '</p></div></div>' +
      '<button class="btn-icon" data-close aria-label="Tutup">' + NJ.icon('x') + '</button></div>' +
      '<div class="dr-body">' +
      (metaChips ? '<div class="chips">' + metaChips + '</div>' : '') +
      (score != null
        ? '<div class="dr-score"><div class="score-line"><span class="num">' + score + '<small>%</small></span><span class="qual">' + NJEngine.label(score) + '</span></div>' + NJ.bar(score) + '</div>'
        : '<p class="muted small">Jalankan analisis untuk melihat kecocokan kamu dengan posisi ini.</p>') +
      (role
        ? '<div class="dr-sec"><h4>Tentang posisi</h4><p class="muted">' + esc(role.blurb) + '</p><ul class="bullets">' + role.duties.map(d => '<li>' + esc(d) + '</li>').join('') + '</ul></div>'
        : '') +
      '<div class="dr-sec"><h4>Skill yang dibutuhkan</h4><div class="chips">' +
      skills.map(s => {
        const hit = matched.includes(s);
        return '<span class="chip ' + (hit ? 'chip-blue' : info ? 'chip-miss' : '') + '">' + (hit ? NJ.icon('check') : '') + esc(s) + '</span>';
      }).join('') + '</div>' +
      (info && missing.length ? '<p class="muted small">Garis putus-putus berarti skill itu belum ada di profilmu.</p>' : '') + '</div>' +
      '<div class="dr-sec"><h4>Draf pesan lamaran</h4><textarea class="input textarea" id="dr-letter" rows="9"></textarea>' +
      '<p class="muted small">Edit sesuai kebutuhan, lalu salin dan kirim lewat kanal lamaran perusahaan. Ini lowongan contoh, jadi belum ada tombol kirim sungguhan.</p></div>' +
      '</div>' +
      '<div class="dr-foot"><button class="btn btn-glass" id="dr-save"></button><button class="btn btn-primary" id="dr-apply"></button></div>';

    NJ.drawer.open(html, dr => {
      const letter = $('#dr-letter', dr);
      letter.value = NJ.letter(base, info, profile);
      const saveBtn = $('#dr-save', dr);
      const applyBtn = $('#dr-apply', dr);
      const paint = () => {
        saveBtn.innerHTML = NJ.icon('bookmark') + (NJ.saved.has(base.id) ? 'Tersimpan' : 'Simpan');
        applyBtn.innerHTML = NJ.applied.has(base.id) ? NJ.icon('check') + 'Sudah dilamar' : NJ.icon('send') + 'Salin draf &amp; tandai dilamar';
      };
      paint();
      saveBtn.addEventListener('click', () => {
        const on = NJ.saved.toggle(base.id);
        NJ.toast(on ? 'Lowongan disimpan' : 'Dihapus dari simpanan');
        paint();
      });
      applyBtn.addEventListener('click', async () => {
        const ok = await NJ.copy(letter.value);
        NJ.applied.add(base.id);
        NJ.toast(ok ? 'Draf disalin. Lowongan ditandai sudah dilamar.' : 'Lowongan ditandai sudah dilamar.');
        paint();
      });
      if (opt.focusLetter) letter.focus();
    });
  };

  /* ---------- navigasi & footer ---------- */
  const LINKS = [
    ['home', 'index.html', 'Beranda'],
    ['jobs', 'lowongan.html', 'Cari Lowongan'],
    ['about', 'tentang.html', 'Tentang Kami']
  ];

  function renderNav() {
    const el = $('#site-nav');
    if (!el) return;
    const page = document.body.dataset.page;
    const links = LINKS.map(l => '<a href="' + l[1] + '"' + (l[0] === page ? ' class="active" aria-current="page"' : '') + '>' + l[2] + '</a>').join('');
    el.innerHTML =
      '<div class="nav-wrap"><div class="nav glass">' +
      '<a class="logo" href="index.html" aria-label="NeuroJobs">Neuro<b>Jobs</b></a>' +
      '<nav class="nav-links" aria-label="Utama">' + links + '</nav>' +
      '<div class="nav-actions">' +
      '<button class="btn-icon" id="theme-toggle" aria-label="Ganti tema"></button>' +
      '<a class="btn btn-primary btn-sm nav-cta" href="analisis.html">Mulai Analisis</a>' +
      '<button class="btn-icon nav-burger" id="nav-burger" aria-label="Menu" aria-expanded="false">' + NJ.icon('menu') + '</button>' +
      '</div></div>' +
      '<div class="nav-sheet glass" id="nav-sheet">' + links + '<a class="btn btn-primary" href="analisis.html">Mulai Analisis</a></div></div>';

    const tt = $('#theme-toggle');
    const paint = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      tt.innerHTML = NJ.icon(dark ? 'sun' : 'moon');
      tt.setAttribute('aria-label', dark ? 'Pakai mode terang' : 'Pakai mode gelap');
    };
    paint();
    tt.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('nj.theme', next); } catch (e) { /* abaikan */ }
      paint();
    });
    const burger = $('#nav-burger');
    const sheet = $('#nav-sheet');
    burger.addEventListener('click', () => {
      const open = sheet.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-wrap')) { sheet.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  function renderFooter() {
    const el = $('#site-footer');
    if (!el) return;
    el.innerHTML =
      '<div class="container foot">' +
      '<div><a class="logo" href="index.html">Neuro<b>Jobs</b></a><p class="muted small">Rekomendasi karier pertama untuk fresh graduate IT.</p></div>' +
      '<div class="foot-links"><a href="analisis.html">Mulai Analisis</a><a href="lowongan.html">Cari Lowongan</a><a href="tentang.html">Tentang Kami</a></div>' +
      '<p class="muted small foot-note">Lowongan dan perusahaan di situs ini adalah data contoh untuk demo.</p></div>';
  }

  renderNav();
  renderFooter();
  NJ.reveal();
  NJ.observeCounts();
})();
