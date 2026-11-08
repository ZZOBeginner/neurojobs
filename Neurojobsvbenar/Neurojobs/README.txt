NeuroJobs
=========

Struktur
  index.html, analisis.html, hasil.html, lowongan.html, tentang.html
  css/   base.css (token, tipografi), components.css (komponen), pages.css (per halaman)
  js/    theme.js, data.js (opsi jurusan & pengalaman di form), engine.js (pencocokan),
         common.js (nav, drawer, simpan, toast) + satu file JS per halaman
  dashboard.html + js/dashboard.js + js/dataset.js + css/dashboard.css
                       Dashboard data: lihat isi dan kualitas dataset CSV sebelum dianalisis
  data/job_dataset.csv dataset bawaan yang dimuat otomatis oleh dashboard
  server.js            server Node + endpoint POST /api/analyze
  hasil_rekomendasi.json  contoh hasil Colab (profil awal web)

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

Dashboard data
  Buka menu "Dashboard Data". Dataset bawaan (data/job_dataset.csv) dimuat otomatis lewat server.
  Mau pakai CSV lain? Klik "Ganti CSV" atau tarik file .csv ke halaman.
  Kolom yang dikenali: JobID, Title, ExperienceLevel, YearsOfExperience, Skills,
  Responsibilities, Keywords (Skills dan Responsibilities dipisah titik koma).
  "Sudah dirapikan" hanya mengubah tampilan; file asli tidak diubah.
  "Unduh CSV rapi" menyimpan versi yang sudah diseragamkan.
  Catatan: dashboard ini terpisah dari engine rekomendasi; engine belum memakai CSV ini.

Random Forest (dari Google Colab)
  Notebook: neurojobs_random_forest.ipynb (jalankan di Colab, upload data/job_dataset.csv)
  Keluarannya 3 file:
    data/rf_model.json      pohon-pohon Random Forest + daftar skill
    data/jobs.json          SEMUA lowongan yang sudah dirapikan + ringkasan skill per posisi
    hasil_rekomendasi.json  contoh hasil 1 input; input_skills di dalamnya jadi profil awal web
  Web menjalankan Random Forest itu langsung di browser (js/engine.js -> rfAnalyze),
  jadi skill yang diisi di halaman Analisis ikut memengaruhi hasil.
  Update data: jalankan ulang notebook, timpa ketiga file di atas, refresh halaman.
  Wajib lewat server (node server.js), karena web membaca file JSON dengan fetch.

Semua halaman (beranda, analisis, hasil, lowongan) memakai data dari JSON di atas, tidak ada data demo.
Catatan: dataset tidak punya perusahaan/lokasi/gaji, jadi bagian itu memang tidak ditampilkan.
