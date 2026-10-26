/* Engine pencocokan NeuroJobs.
   - Posisi  : skor berbobot (skill inti lebih berat) + kemiripan kosinus + bonus jurusan.
   - Perusahaan: Cosine Similarity antara set skill user dan set skill lowongan.
   Berjalan di browser (window.NJEngine) dan di server Node (require).
   Untuk memakai model Random Forest sungguhan, ganti pemanggilan analyze() di server.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.NJEngine = factory(root.NJData);
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  const norm = s => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const listText = a => (a.length <= 2 ? a.join(' & ') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]);

  const aliasMap = {};
  D.skills.forEach(s => {
    aliasMap[norm(s.n)] = s.n;
    (s.a || []).forEach(a => { aliasMap[norm(a)] = s.n; });
  });
  const matchers = Object.keys(aliasMap)
    .filter(k => k.length >= 2)
    .map(term => ({ canon: aliasMap[term], re: new RegExp('(^|[^a-z0-9+#.])' + esc(term) + '($|[^a-z0-9+#])', 'i') }));

  function canonical(raw) {
    const k = norm(raw);
    if (!k) return '';
    if (aliasMap[k]) return aliasMap[k];
    return String(raw).trim().replace(/\s+/g, ' ').slice(0, 40);
  }

  function uniqSkills(list) {
    const seen = new Set();
    const out = [];
    (list || []).forEach(r => {
      const c = canonical(r);
      if (c && !seen.has(c.toLowerCase())) { seen.add(c.toLowerCase()); out.push(c); }
    });
    return out;
  }

  function extractFromText(text) {
    const t = ' ' + String(text || '').toLowerCase() + ' ';
    const found = [];
    matchers.forEach(m => { if (m.re.test(t) && !found.includes(m.canon)) found.push(m.canon); });
    return found;
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

  function label(s) {
    return s >= 75 ? 'Sangat Cocok' : s >= 55 ? 'Cocok' : s >= 35 ? 'Cukup Cocok' : 'Perlu Dikembangkan';
  }

  const clamp = n => Math.round(Math.min(98, Math.max(0, n)));

  function scoreRole(user, role, jurusan) {
    const matched = [];
    const missing = [];
    let wsum = 0;
    let wmatch = 0;
    role.skills.forEach((s, i) => {
      const w = i < 3 ? 1 : i < 6 ? 0.75 : 0.5;
      wsum += w;
      if (user.has(s)) { wmatch += w; matched.push(s); } else missing.push(s);
    });
    const cov = wmatch / wsum;
    const cos = matched.length / Math.sqrt(Math.max(user.size, 1) * role.skills.length);
    let sc = 100 * (0.7 * cov + 0.3 * cos) * 1.2;
    if (matched.length && role.aff.includes(jurusan)) sc += 6;
    return { score: clamp(sc), matched, missing };
  }

  function roleReasons(role, x, jurusan) {
    const out = [];
    if (x.matched.length) out.push({ ok: true, text: 'Skill ' + listText(x.matched) + ' kamu sudah sesuai dengan requirement posisi ini.' });
    if (x.matched.length && role.aff.includes(jurusan)) out.push({ ok: true, text: 'Jurusan ' + jurusan + ' umum menjadi jalur masuk ke posisi ' + role.title + '.' });
    if (x.missing.length) out.push({ ok: false, text: 'Belum terlihat di profilmu: ' + listText(x.missing.slice(0, 4)) + '.' });
    if (!x.matched.length) out.push({ ok: false, text: 'Belum ada skill kamu yang cocok dengan requirement inti posisi ini.' });
    return out;
  }

  function levelAdjust(level, exp) {
    const idx = { Magang: 0, Entry: 0, Junior: 1, Mid: 2 }[level];
    if (idx == null) return { adj: 0 };
    if (level === 'Magang' && exp >= 2) return { adj: -10, ok: false, text: 'Program magang biasanya untuk yang belum berpengalaman.' };
    if (level === 'Magang' && exp === 1) return { adj: -4 };
    const d = idx - exp;
    if (d >= 2) return { adj: -12, ok: false, text: 'Level ' + level + ' menuntut pengalaman lebih dari yang kamu punya saat ini.' };
    if (d === 1 && exp === 0) return { adj: -3 };
    if (d <= 0) return { adj: 0, ok: true, text: 'Level ' + level + ' sesuai dengan pengalamanmu.' };
    return { adj: 0 };
  }

  function analyze(profile) {
    profile = profile || {};
    const skills = uniqSkills(profile.skills);
    const user = new Set(skills);
    const jurusan = profile.jurusan || '';
    const exp = Number.isFinite(+profile.exp) ? +profile.exp : 0;
    const prefType = profile.prefType || 'Semua';
    const prefLoc = profile.prefLoc || 'Semua';

    const roleScores = {};
    const roles = D.roles.map(r => {
      const x = scoreRole(user, r, jurusan);
      const o = { id: r.id, title: r.title, score: x.score, matched: x.matched, missing: x.missing, reasons: roleReasons(r, x, jurusan) };
      roleScores[r.id] = x.score;
      return o;
    }).sort((a, b) => b.score - a.score);

    const listings = D.listings.map(l => {
      const matched = l.skills.filter(s => user.has(s));
      const missing = l.skills.filter(s => !user.has(s));
      const cos = matched.length / Math.sqrt(Math.max(user.size, 1) * l.skills.length);
      const cov = matched.length / l.skills.length;
      let sc = 100 * (0.55 * cos + 0.45 * cov) * 1.15 + 0.08 * (roleScores[l.role] || 0);
      const la = levelAdjust(l.level, exp);
      sc += la.adj;
      const reasons = [];
      if (matched.length) reasons.push({ ok: true, text: 'Skill ' + listText(matched) + ' kamu sesuai dengan requirement perusahaan ini.' });
      if (la.text) reasons.push({ ok: !!la.ok, text: la.text });
      if (prefType !== 'Semua') {
        if (l.type === prefType) reasons.push({ ok: true, text: 'Tipe ' + l.type + ' sesuai preferensimu.' });
        else { sc -= 10; reasons.push({ ok: false, text: 'Tipe ' + l.type + ' berbeda dari preferensimu (' + prefType + ').' }); }
      }
      if (prefLoc !== 'Semua') {
        if (l.loc === prefLoc) reasons.push({ ok: true, text: 'Lokasi ' + l.loc + ' sesuai preferensimu.' });
        else if (l.loc === 'Remote') reasons.push({ ok: true, text: 'Posisi remote bisa dikerjakan dari ' + prefLoc + '.' });
        else { sc -= 6; reasons.push({ ok: false, text: 'Lokasi ' + l.loc + ' berbeda dari preferensimu (' + prefLoc + ').' }); }
      }
      if (missing.length) reasons.push({ ok: false, text: 'Belum terlihat di profilmu: ' + listText(missing.slice(0, 4)) + '.' });
      return { id: l.id, score: clamp(sc), matched, missing, reasons };
    }).sort((a, b) => b.score - a.score);

    const agg = {};
    roles.slice(0, 3).forEach(r => {
      r.missing.forEach(s => {
        agg[s] = agg[s] || { skill: s, w: 0, n: 0 };
        agg[s].w += Math.max(r.score, 10) / 100;
        agg[s].n++;
      });
    });
    const arr = Object.values(agg).sort((a, b) => b.w - a.w).slice(0, 6);
    const maxW = arr.length ? arr[0].w : 1;
    const gaps = arr.map(g => {
      const meta = D.skills.find(s => s.n === g.skill) || {};
      return { skill: g.skill, cat: meta.c || 'Skill', tip: meta.tip || '', n: g.n, priority: Math.round((g.w / maxW) * 100) };
    });

    return {
      v: 1,
      ts: Date.now(),
      profile: { jurusan, exp, skills, prefType, prefLoc, cvName: profile.cvName || '' },
      roles,
      listings,
      gaps
    };
  }

  /* Ubah keluaran model ML eksternal (format hasil_rekomendasi.json) ke bentuk hasil NeuroJobs. */
  function fromMlJson(j, base) {
    if (!j || !j.prediksi_utama || !Array.isArray(j.rekomendasi_perusahaan)) throw new Error('Format JSON tidak dikenali');
    const skills = uniqSkills(extractFromText(j.input_user || ''));
    const user = new Set(skills);
    const keyakinan = Math.round(+j.prediksi_utama.keyakinan_persen || 0);
    const title = String(j.prediksi_utama.posisi || 'Posisi');
    const role = D.roles.find(r => norm(r.title) === norm(title));
    const x = role ? scoreRole(user, role, '') : { matched: [], missing: [] };
    const top = {
      id: role ? role.id : 'ml-0',
      title,
      score: keyakinan,
      matched: x.matched,
      missing: x.missing,
      reasons: [{ ok: true, text: 'Model Random Forest memberi keyakinan ' + keyakinan + '% untuk posisi ini.' }]
        .concat(x.matched.length ? [{ ok: true, text: 'Skill ' + listText(x.matched) + ' kamu terdeteksi relevan.' }] : [])
        .concat(x.missing.length ? [{ ok: false, text: 'Belum terlihat di profilmu: ' + listText(x.missing.slice(0, 4)) + '.' }] : [])
    };
    const seen = new Set();
    const listings = [];
    j.rekomendasi_perusahaan.forEach((c, i) => {
      const reqs = String(c.skills_dibutuhkan || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
      const key = c.posisi + '|' + reqs.join(',') + '|' + c.skor_kecocokan;
      if (seen.has(key)) return;
      seen.add(key);
      const matched = reqs.filter(s => user.has(canonical(s)));
      const missing = reqs.filter(s => !user.has(canonical(s)));
      listings.push({
        id: 'ml-' + i,
        score: Math.round(+c.skor_kecocokan || 0),
        matched: matched.map(canonical),
        missing: missing.map(canonical),
        reasons: [{ ok: true, text: 'Cosine Similarity antara skill kamu dan requirement posisi ini: ' + (+c.skor_kecocokan || 0) + '%.' }]
          .concat(matched.length ? [{ ok: true, text: 'Skill ' + listText(matched) + ' kamu sesuai requirement.' }] : [])
          .concat(missing.length ? [{ ok: false, text: 'Belum terlihat di profilmu: ' + listText(missing.slice(0, 4)) + '.' }] : []),
        ext: {
          company: c.perusahaan || c.company || 'Perusahaan dari model',
          title: String(c.posisi || 'Posisi'),
          role: role ? role.id : '',
          loc: c.lokasi || '',
          type: '',
          level: '',
          salary: '',
          skills: reqs
        }
      });
    });
    listings.sort((a, b) => b.score - a.score);
    return {
      v: 1,
      ts: Date.now(),
      profile: Object.assign({ jurusan: '', exp: 0, prefType: 'Semua', prefLoc: 'Semua', cvName: '' }, base || {}, { skills }),
      roles: [top],
      listings,
      gaps: [],
      source: 'ml'
    };
  }

  return { analyze, fromMlJson, canonical, uniqSkills, extractFromText, detectJurusan, label, listText };
});
