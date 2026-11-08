/* Engine NeuroJobs. Semua datanya dari JSON hasil Colab:
   - data/rf_model.json : pohon Random Forest (prediksi posisi)
   - data/jobs.json     : semua lowongan + ringkasan skill per posisi
   Berjalan di browser (window.NJEngine) dan di server Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NJEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const listText = a => (a.length <= 2 ? a.join(' & ') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]);

  function label(s) {
    return s >= 75 ? 'Sangat Cocok' : s >= 55 ? 'Cocok' : s >= 35 ? 'Cukup Cocok' : 'Perlu Dikembangkan';
  }

  function detectJurusan(text) {
    const t = String(text || '');
    const map = [
      ['SIJA', /\bSIJA\b/i], ['PPLG', /\bPPLG\b/i], ['RPL', /\bRPL\b/i],
      ['TJKT', /\b(TJKT|TKJ)\b/i], ['Sistem Informasi', /sistem informasi/i],
      ['Teknik Komputer', /teknik komputer/i], ['Informatika', /informatika|ilmu komputer|computer science/i]
    ];
    for (const [name, re] of map) if (re.test(t)) return name;
    return '';
  }

  /* ---------- Random Forest (model dari Colab, dijalankan di sini) ---------- */
  /* normSkill harus SAMA dengan norm_skill() di notebook Colab. */
  function normSkill(s) {
    s = String(s == null ? '' : s).toLowerCase().trim();
    s = s.replace(/\(.*?\)/g, '');
    s = s.replace(/\b(basics?|fundamentals?|knowledge|familiarity|understanding|exposure|proficiency|experience|skills?)\b( of| with| in)?/g, '');
    return s.replace(/\s+/g, ' ').replace(/^[ \-–]+|[ \-–]+$/g, '');
  }

  const LEVELS = ['Semua', 'Entry/Fresher', 'Mid-Level', 'Experienced', 'Senior'];

  function rfProba(model, x) {
    const proba = new Float64Array(model.classes.length);
    model.trees.forEach(t => {
      let n = 0;
      while (t.f[n] >= 0) n = x[t.f[n]] ? t.r[n] : t.l[n];
      const v = t.v[n];
      if (typeof v === 'number') proba[v] += 1;
      else v.forEach(cp => { proba[cp[0]] += cp[1]; });
    });
    for (let i = 0; i < proba.length; i++) proba[i] /= model.trees.length;
    return proba;
  }

  function rfAnalyze(profile, model, jdata) {
    profile = profile || {};
    const inputSkills = [];
    const seenIn = new Set();
    (profile.skills || []).forEach(s => {
      const t = String(s).trim();
      if (t && !seenIn.has(t.toLowerCase())) { seenIn.add(t.toLowerCase()); inputSkills.push(t); }
    });
    const userNorm = new Set();
    inputSkills.forEach(s => { const n = normSkill(s); if (n) userNorm.add(n); });

    if (!model._vidx) model._vidx = new Map(model.vocab.map((s, i) => [s, i]));
    const x = new Uint8Array(model.vocab.length);
    const known = [];
    const unknown = [];
    userNorm.forEach(n => { if (model._vidx.has(n)) { x[model._vidx.get(n)] = 1; known.push(n); } else unknown.push(n); });

    const proba = known.length ? rfProba(model, x) : new Float64Array(model.classes.length);
    const rs = jdata.ringkasan_posisi || {};
    const order = Array.from(proba.keys()).sort((a, b) => proba[b] - proba[a]);
    const rfPct = {};
    order.forEach(i => { rfPct[model.classes[i]] = proba[i] * 100; });

    const roles = order.slice(0, 5).filter(i => proba[i] > 0).map(i => {
      const role = model.classes[i];
      const info = rs[role] || { jumlah: 0, skill_inti: [] };
      const matched = info.skill_inti.filter(s => userNorm.has(s.n)).map(s => s.d);
      const missing = info.skill_inti.filter(s => !userNorm.has(s.n)).map(s => s.d);
      const pct = Math.round(proba[i] * 1000) / 10;
      const reasons = [{ ok: true, text: 'Random Forest (' + model.n_pohon + ' pohon) memberi keyakinan ' + pct + '% untuk posisi ini.' }];
      if (matched.length) reasons.push({ ok: true, text: 'Skill ' + listText(matched) + ' kamu termasuk skill yang paling sering diminta untuk posisi ini.' });
      if (missing.length) reasons.push({ ok: false, text: 'Skill inti yang belum terlihat di profilmu: ' + listText(missing.slice(0, 4)) + '.' });
      reasons.push({ ok: true, text: 'Di dataset ada ' + info.jumlah + ' lowongan untuk posisi ' + role + '.' });
      return { id: 'rf-' + i, title: role, score: pct, matched, missing: missing.slice(0, 6), blurb: info.jumlah + ' lowongan di dataset', reasons };
    });

    const listings = jdata.jobs.map(j => {
      const nj = new Set(j.skills_norm.filter(Boolean));
      let hit = 0;
      userNorm.forEach(n => { if (nj.has(n)) hit++; });
      const cos = hit / Math.sqrt(Math.max(userNorm.size, 1) * Math.max(nj.size, 1));
      const matched = [];
      const missing = [];
      j.skills.forEach((d, i) => {
        const k = j.skills_norm[i];
        if (!k) return;
        if (userNorm.has(k)) matched.push(d); else missing.push(d);
      });
      const score = Math.round(cos * 10000) / 100;
      const reasons = [{ ok: true, text: 'Kemiripan skill (cosine similarity) kamu dengan lowongan ini: ' + score + '%.' }];
      if (matched.length) reasons.push({ ok: true, text: 'Skill ' + listText(matched) + ' kamu sesuai dengan requirement lowongan ini.' });
      else reasons.push({ ok: false, text: 'Belum ada skill kamu yang cocok dengan requirement lowongan ini.' });
      if (rfPct[j.role] > 0) reasons.push({ ok: true, text: 'Random Forest menilai posisi ' + j.role + ' dengan keyakinan ' + (Math.round(rfPct[j.role] * 10) / 10) + '%.' });
      if (missing.length) reasons.push({ ok: false, text: 'Belum terlihat di profilmu: ' + listText(missing.slice(0, 4)) + '.' });
      return {
        id: j.id, score, matched, missing, reasons,
        ext: { company: j.role, title: j.title, role: j.role, loc: '', type: j.level, level: j.pengalaman ? j.pengalaman + ' tahun' : '', salary: '', skills: j.skills, tugas: j.tugas || [], kode: j.kode_asal }
      };
    }).sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : 1));

    const agg = {};
    roles.slice(0, 3).forEach(r => {
      const info = rs[r.title] || { skill_inti: [] };
      info.skill_inti.forEach(s => {
        if (userNorm.has(s.n)) return;
        const a = agg[s.n] = agg[s.n] || { skill: s.d, w: 0, n: 0, persen: s.persen, role: r.title };
        a.w += (r.score / 100) * (s.persen / 100);
        a.n++;
      });
    });
    const arr = Object.values(agg).sort((a, b) => b.w - a.w).slice(0, 6);
    const maxW = arr.length ? arr[0].w : 1;
    const gaps = arr.map(g => ({ skill: g.skill, cat: 'Skill inti posisi', tip: 'Muncul di ' + g.persen + '% lowongan ' + g.role + '.', n: g.n, priority: Math.round((g.w / maxW) * 100) }));

    return {
      v: 2, ts: Date.now(), source: 'rf',
      profile: { jurusan: profile.jurusan || '', exp: profile.exp == null || profile.exp === '' ? null : +profile.exp, skills: inputSkills, cvName: profile.cvName || '' },
      roles, listings, gaps,
      ml: { input: inputSkills.join(', '), known, unknown, metrik: model.metrik || {}, total: jdata.jobs.length }
    };
  }


  /* ---------- Katalog skill: dibangun dari jobs.json, hanya skill yang dikenal model ---------- */
  let catalog = [];
  let catByNorm = new Map();
  let matchers = [];

  function buildCatalog(model, jdata) {
    const known = new Set(model.vocab);
    const agg = new Map();
    jdata.jobs.forEach(j => {
      const seen = new Set();
      j.skills.forEach((d, i) => {
        const k = j.skills_norm[i];
        if (!k || seen.has(k)) return;
        seen.add(k);
        let a = agg.get(k);
        if (!a) agg.set(k, a = { k, n: 0, d: new Map() });
        a.n++;
        a.d.set(d, (a.d.get(d) || 0) + 1);
      });
    });
    const out = [];
    agg.forEach(a => {
      if (!known.has(a.k)) return;
      let best = null;
      let bn = -1;
      a.d.forEach((n, d) => { if (n > bn || (n === bn && d.length < best.length)) { best = d; bn = n; } });
      out.push({ n: best, k: a.k, count: a.n });
    });
    return out.sort((x, y) => (y.count - x.count) || x.n.localeCompare(y.n));
  }

  function setCatalog(cat) {
    catalog = cat;
    catByNorm = new Map(cat.map(c => [c.k, c]));
    matchers = cat
      .filter(c => c.k.length >= 3 || (c.k.length === 2 && /[^a-z]/.test(c.k)))
      .map(c => ({ canon: c.n, re: new RegExp('(^|[^a-z0-9+#.])' + esc(c.k) + '($|[^a-z0-9+#])', 'i') }));
  }
  const getCatalog = () => catalog;

  /* Samakan tulisan skill dengan nama yang dipakai di dataset (mis. "javascript" -> "JavaScript"). */
  function canonical(raw) {
    const k = normSkill(raw);
    if (!k) return '';
    const c = catByNorm.get(k);
    return c ? c.n : String(raw).trim().replace(/\s+/g, ' ').slice(0, 40);
  }

  function extractFromText(text) {
    const t = ' ' + String(text || '').toLowerCase() + ' ';
    const found = [];
    matchers.forEach(m => { if (m.re.test(t) && !found.includes(m.canon)) found.push(m.canon); });
    return found;
  }

  return { rfAnalyze, normSkill, LEVELS, buildCatalog, setCatalog, getCatalog, canonical, extractFromText, detectJurusan, label, listText };
});
