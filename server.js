// Server NeuroJobs, tanpa dependency (cukup Node.js 16+).
// Menyajikan file statis dan endpoint POST /api/analyze.
// Jalankan: node server.js  lalu buka http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const engine = require('./js/engine.js');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const BLOCKED = new Set(['server.js', 'start.bat', 'start.sh', 'README.txt', 'package.json']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ------------------------------------------------------------------
   Titik sambung model ML (Sudah di-upgrade ke file JSON lokal):
   Membaca file 'hasil_prediksi.json' dari hasil export Google Colab,
   lalu menerjemahkannya menggunakan engine.fromMlJson().
------------------------------------------------------------------- */
async function analyze(profile) {
  try {
    const jsonPath = path.join(ROOT, 'hasil_prediksi.json');
    
    // Cek apakah file hasil prediksi ada di direktori
    if (fs.existsSync(jsonPath)) {
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const hasilJson = JSON.parse(rawData);
      
      // Mengubah format JSON Python/Colab agar sinkron dengan frontend NeuroJobs
      return engine.fromMlJson(hasilJson, profile);
    }
  } catch (error) {
    console.error("Gagal membaca file hasil_prediksi.json, fallback ke engine bawaan:", error);
  }
  
  // Jika file belum ada, otomatis pakai engine bawaan
  return engine.analyze(profile);
}

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);

  if (url === '/api/analyze') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Gunakan POST' });
    try {
      const raw = await readBody(req, 100 * 1024);
      const body = JSON.parse(raw || '{}');
      if (!Array.isArray(body.skills) || !body.skills.length) return sendJson(res, 400, { error: 'skills wajib diisi' });
      body.skills = body.skills.slice(0, 30).map(s => String(s).slice(0, 50));
      return sendJson(res, 200, await analyze(body));
    } catch (e) {
      return sendJson(res, 400, { error: 'Permintaan tidak valid' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }

  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT + path.sep) || BLOCKED.has(rel) || rel.startsWith('.')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 - Dilarang');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Tidak ditemukan: ' + url);
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.listen(PORT, () => {
  console.log('NeuroJobs jalan di http://localhost:' + PORT);
  console.log('Tekan Ctrl+C untuk berhenti.');
});