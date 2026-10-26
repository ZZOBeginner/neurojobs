NeuroJobs
=========

Struktur
  index.html, analisis.html, hasil.html, lowongan.html, tentang.html
  css/   base.css (token, tipografi), components.css (komponen), pages.css (per halaman)
  js/    theme.js, data.js (skill, posisi, lowongan contoh), engine.js (pencocokan),
         common.js (nav, drawer, simpan, toast) + satu file JS per halaman
  server.js            server Node + endpoint POST /api/analyze
  hasil_rekomendasi.json  contoh keluaran model ML (bisa diimpor di halaman hasil)

Menjalankan
  Windows : double-click start.bat
  Terminal: node server.js    lalu buka http://localhost:3000
  (Butuh Node.js. Tanpa server pun situs tetap jalan: buka index.html langsung,
   analisis dihitung engine lokal di browser. Hanya pembaca CV PDF yang butuh internet.)

Fitur
  - Analisis: jurusan, pengalaman, tag skill + autocomplete, baca CV PDF, preferensi
  - Hasil: peringkat posisi + "Kenapa cocok?", skill gap, perusahaan dengan filter,
    simpan, detail, draf pesan lamaran, salin ringkasan, cetak/PDF
  - Riwayat 5 analisis terakhir, mode gelap, impor hasil_rekomendasi.json

Menyambungkan model Random Forest kamu
  1. Buka server.js, ubah fungsi analyze(profile) supaya memanggil model kamu.
  2. Ubah keluarannya dengan engine.fromMlJson(...) atau kembalikan format yang sama
     dengan engine.analyze().
  Atau cukup impor file JSON model lewat tombol "Impor JSON model" di halaman hasil.

Catatan: perusahaan dan lowongan adalah data contoh (fiktif).
