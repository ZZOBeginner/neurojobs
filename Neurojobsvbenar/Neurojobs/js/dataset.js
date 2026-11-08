/* Dataset NeuroJobs: baca CSV, rapikan nilai, dan buat profil kualitas data.
   Murni logika (tanpa DOM) supaya bisa diuji di Node dan dipakai di browser (window.NJDataset). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NJDataset = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- parser CSV (RFC 4180: kutip, koma & baris baru di dalam sel, BOM) ---------- */
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); if (row.length > 1 || row[0] !== '') rows.push(row); }
    if (!rows.length) return { header: [], rows: [] };
    const header = rows[0].map(h => h.trim());
    return { header, rows: rows.slice(1) };
  }

  function toCSV(header, rows) {
    const esc = v => {
      const s = String(v == null ? '' : v);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [header.map(esc).join(',')].concat(rows.map(r => r.map(esc).join(','))).join('\r\n') + '\r\n';
  }

  /* ---------- pemetaan kolom ---------- */
  const ALIASES = {
    id: ['jobid', 'id', 'kode', 'job id'],
    title: ['title', 'judul', 'posisi', 'jobtitle', 'job title', 'position'],
    level: ['experiencelevel', 'level', 'experience level', 'seniority'],
    years: ['yearsofexperience', 'years', 'pengalaman', 'years of experience', 'experience'],
    skills: ['skills', 'skill', 'keahlian', 'requirements'],
    duties: ['responsibilities', 'tanggung jawab', 'tugas', 'duties'],
    keywords: ['keywords', 'keyword', 'kata kunci', 'tags']
  };
  function mapColumns(header) {
    const map = {};
    const low = header.map(h => h.toLowerCase().replace(/[_\s]+/g, ' ').trim());
    Object.keys(ALIASES).forEach(k => {
      const i = low.findIndex(h => ALIASES[k].includes(h) || ALIASES[k].includes(h.replace(/ /g, '')));
      if (i >= 0) map[k] = i;
    });
    return map;
  }

  /* ---------- normalisasi ---------- */
  const LEVELS = ['Fresher / Entry', 'Mid-Level', 'Experienced', 'Senior', 'Lead'];
  function normLevel(raw) {
    const s = String(raw || '').toLowerCase().replace(/[\s_]+/g, ' ').trim();
    if (!s) return '';
    if (/^(fresher|entry[- ]?level|entry|junior)$/.test(s)) return LEVELS[0];
    if (/^mid[- ]?level$/.test(s) || s === 'mid') return LEVELS[1];
    if (s === 'experienced') return LEVELS[2];
    if (/^(senior|senior[- ]?level|mid[- ]?senior( level)?)$/.test(s)) return LEVELS[3];
    if (s === 'lead') return LEVELS[4];
    return String(raw).trim();
  }

  const BUCKETS = ['0–1 thn', '2–3 thn', '4–5 thn', '6–9 thn', '10+ thn'];
  function normYears(raw) {
    const s = String(raw || '');
    const nums = (s.match(/\d+/g) || []).map(Number);
    if (!nums.length) return { min: null, max: null, label: '', bucket: '' };
    const min = nums[0];
    let max = nums.length > 1 ? nums[1] : null;
    const open = /\+/.test(s);
    let label;
    if (open) label = min + '+ thn';
    else if (max != null && max !== min) label = min + '–' + max + ' thn';
    else { max = min; label = min + ' thn'; }
    const bucket = min <= 1 ? BUCKETS[0] : min <= 3 ? BUCKETS[1] : min <= 5 ? BUCKETS[2] : min <= 9 ? BUCKETS[3] : BUCKETS[4];
    return { min, max: open ? null : max, label, bucket };
  }

  const SKILL_SUFFIX = /\s*(\((basic|basics|basic knowledge|fundamentals?)\)|\b(basics?|fundamentals?|basic knowledge))\s*$/i;
  function skillKey(raw) {
    return String(raw).replace(SKILL_SUFFIX, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function skillHasVariant(raw) { return SKILL_SUFFIX.test(String(raw)); }

  const SOFT = new Set(['communication', 'leadership', 'problem solving', 'teamwork', 'collaboration', 'time management', 'adaptability',
    'critical thinking', 'creativity', 'attention to detail', 'presentation skills', 'presentation', 'team management', 'decision making',
    'interpersonal skills', 'negotiation', 'stakeholder management', 'mentoring', 'analytical thinking', 'analytical skills', 'work ethic',
    'project management', 'strategic thinking', 'conflict resolution', 'emotional intelligence', 'customer service', 'storytelling', 'organization']);

  const TITLE_SUFFIX = /\s*[-–—]\s*(entry[- ]?level|fresher|experienced|junior|senior|mid[- ]?level|lead)\s*$/i;
  function normTitle(raw) { return String(raw || '').replace(TITLE_SUFFIX, '').replace(/\s+/g, ' ').trim(); }

  const splitList = s => String(s || '').split(';').map(x => x.trim()).filter(Boolean);

  /* ---------- bangun catatan & profil ---------- */
  function build(parsed) {
    const { header, rows } = parsed;
    const map = mapColumns(header);
    const get = (r, k) => (map[k] != null ? (r[map[k]] || '').trim() : '');

    const recs = rows.map((r, i) => {
      const skillsRaw = splitList(get(r, 'skills'));
      const seen = new Set();
      const skillsClean = [];
      skillsRaw.forEach(s => {
        const k = skillKey(s);
        if (k && !seen.has(k)) { seen.add(k); skillsClean.push(s.replace(SKILL_SUFFIX, '').trim()); }
      });
      const y = normYears(get(r, 'years'));
      return {
        i,
        cells: r,
        id: get(r, 'id'),
        title: get(r, 'title'),
        titleClean: normTitle(get(r, 'title')),
        level: get(r, 'level'),
        levelClean: normLevel(get(r, 'level')),
        years: get(r, 'years'),
        yLabel: y.label,
        yBucket: y.bucket,
        yMin: y.min,
        yMax: y.max,
        skillsRaw,
        skillsClean,
        duties: splitList(get(r, 'duties')),
        keywords: splitList(get(r, 'keywords')),
        flags: []
      };
    });

    /* kualitas data */
    const idCount = {};
    recs.forEach(r => { if (r.id) idCount[r.id] = (idCount[r.id] || 0) + 1; });
    const dupIds = Object.keys(idCount).filter(k => idCount[k] > 1);
    const comboCount = {};
    recs.forEach(r => { r._combo = (r.titleClean + '|' + r.skillsClean.map(s => s.toLowerCase()).sort().join(',')).toLowerCase(); comboCount[r._combo] = (comboCount[r._combo] || 0) + 1; });

    /* penulisan dominan per kelompok: hanya baris yang menyimpang dari itu yang dianggap perlu dirapikan */
    const dominant = (rawField, groupField) => {
      const c = {};
      recs.forEach(r => {
        const g = r[groupField];
        if (!g || !r[rawField]) return;
        c[g] = c[g] || {};
        c[g][r[rawField]] = (c[g][r[rawField]] || 0) + 1;
      });
      const d = {};
      Object.keys(c).forEach(g => { d[g] = Object.entries(c[g]).sort((a, b) => b[1] - a[1])[0][0]; });
      return d;
    };
    const domLevel = dominant('level', 'levelClean');
    const domYears = dominant('years', 'yLabel');

    const issues = [];
    const add = (key, label, detail, test) => {
      const idx = [];
      recs.forEach(r => { if (test(r)) { idx.push(r.i); r.flags.push(key); } });
      if (idx.length) issues.push({ key, label, detail, count: idx.length, rows: idx });
    };

    if (map.id != null) add('dupId', 'ID lowongan tidak unik', dupIds.length + ' ID dipakai lebih dari satu kali. Sulit dipakai sebagai kunci data.', r => r.id && idCount[r.id] > 1);
    if (map.title != null) add('noTitle', 'Judul posisi kosong', 'Baris tanpa judul tidak bisa dikelompokkan ke posisi.', r => !r.title);
    if (map.level != null) {
      const rawN = new Set(recs.map(r => r.level).filter(Boolean)).size;
      const cleanN = new Set(recs.map(r => r.levelClean).filter(Boolean)).size;
      add('levelVar', 'Level pengalaman ditulis tidak seragam', rawN + ' penulisan berbeda, bisa dirapikan jadi ' + cleanN + ' kelompok (mis. Entry-Level dan Fresher).', r => r.level && domLevel[r.levelClean] && r.level !== domLevel[r.levelClean]);
    }
    if (map.years != null) {
      const rawN = new Set(recs.map(r => r.years).filter(Boolean)).size;
      const cleanN = new Set(recs.map(r => r.yLabel).filter(Boolean)).size;
      add('yearsVar', 'Format tahun pengalaman beragam', rawN + ' penulisan berbeda (mis. "0-1", "0–1 year", "0-1 Years"), bisa dirapikan jadi ' + cleanN + ' format.', r => r.years && domYears[r.yLabel] && r.years !== domYears[r.yLabel]);
    }
    if (map.skills != null) {
      add('skillVar', 'Nama skill punya varian', 'Skill seperti "Python basics" dan "Python" dihitung terpisah.', r => r.skillsRaw.some(skillHasVariant));
      add('skillEmpty', 'Skill kosong', 'Baris tanpa skill tidak bisa dicocokkan.', r => !r.skillsRaw.length);
    }
    if (map.title != null && map.skills != null) {
      add('maybeDup', 'Kemungkinan duplikat', 'Judul dan daftar skill sama dengan baris lain setelah dirapikan.', r => r.title && r.skillsClean.length && comboCount[r._combo] > 1);
    }
    ['duties', 'keywords'].forEach(k => {
      if (map[k] != null) {
        const nm = k === 'duties' ? 'Tanggung jawab kosong' : 'Keyword kosong';
        add(k + 'Empty', nm, 'Sel kosong pada kolom ' + header[map[k]] + '.', r => !r[k].length);
      }
    });

    /* hitungan untuk grafik */
    const tally = (arr, fn) => {
      const m = new Map();
      arr.forEach(r => { const k = fn(r); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return m;
    };
    const skillTally = (field) => {
      const m = new Map();
      recs.forEach(r => {
        const seen = new Set();
        r[field].forEach(s => {
          const k = field === 'skillsClean' ? skillKey(s) : s.toLowerCase();
          if (seen.has(k)) return;
          seen.add(k);
          const e = m.get(k) || { key: k, n: 0, names: {} };
          e.n++;
          e.names[s] = (e.names[s] || 0) + 1;
          m.set(k, e);
        });
      });
      return Array.from(m.values()).map(e => ({
        key: e.key,
        name: Object.entries(e.names).sort((a, b) => b[1] - a[1])[0][0],
        n: e.n,
        soft: SOFT.has(skillKey(e.key))
      }));
    };

    const avg = f => (recs.length ? recs.reduce((s, r) => s + r[f].length, 0) / recs.length : 0);
    const sRaw = skillTally('skillsRaw');
    const sClean = skillTally('skillsClean');

    const stats = {
      total: recs.length,
      titles: { raw: tally(recs, r => r.title), clean: tally(recs, r => r.titleClean) },
      levels: { raw: tally(recs, r => r.level), clean: tally(recs, r => r.levelClean) },
      years: { raw: tally(recs, r => r.years), clean: tally(recs, r => r.yBucket) },
      yearsLabels: new Set(recs.map(r => r.yLabel).filter(Boolean)).size,
      skills: { raw: sRaw, clean: sClean },
      avgSkills: { raw: avg('skillsRaw'), clean: avg('skillsClean') }
    };

    return { header, map, recs, issues, stats };
  }

  /* ---------- ekspor CSV yang sudah dirapikan ---------- */
  function cleanedCSV(ds) {
    const h = ['JobID', 'Title', 'ExperienceLevel', 'YearsMin', 'YearsMax', 'YearsLabel', 'Skills', 'Responsibilities', 'Keywords'];
    const rows = ds.recs.map(r => [r.id, r.titleClean, r.levelClean, r.yMin == null ? '' : r.yMin, r.yMax == null ? '' : r.yMax, r.yLabel, r.skillsClean.join('; '), r.duties.join('; '), r.keywords.join('; ')]);
    return toCSV(h, rows);
  }

  return { parseCSV, toCSV, mapColumns, build, cleanedCSV, normLevel, normYears, normTitle, skillKey, LEVELS, BUCKETS };
});
