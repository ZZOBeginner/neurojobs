/* Data referensi NeuroJobs: skill, posisi, dan lowongan CONTOH (perusahaan fiktif).
   Dipakai di browser (window.NJData) maupun di server Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NJData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const S = (n, c, tip, a) => ({ n, c, tip, a: a || [] });

  const skills = [
    S('Python', 'Bahasa pemrograman', 'Mulai dari sintaks dasar, lalu buat skrip kecil: otomasi file atau scraping sederhana.', ['py']),
    S('SQL', 'Database', 'Latih SELECT, JOIN, dan GROUP BY di dataset nyata. Ini skill dasar yang dicari hampir semua posisi data dan backend.', ['sql server', 't-sql']),
    S('JavaScript', 'Bahasa pemrograman', 'Pahami DOM, fetch API, dan async/await lewat proyek kecil seperti aplikasi to-do.', ['js', 'es6', 'javascript es6']),
    S('TypeScript', 'Bahasa pemrograman', 'Tambahkan tipe ke proyek JavaScript yang sudah kamu punya.', ['ts']),
    S('HTML', 'Web', 'Kuasai elemen semantik dan aksesibilitas dasar.', ['html5']),
    S('CSS', 'Web', 'Fokus ke Flexbox, Grid, dan layout responsif.', ['css3']),
    S('Tailwind CSS', 'Web', 'Pelajari utility class dan cara menyusun komponen yang konsisten.', ['tailwind']),
    S('React', 'Framework', 'Mulai dari komponen, props, dan state, lalu lanjut ke hooks.', ['react.js', 'reactjs']),
    S('Vue.js', 'Framework', 'Pelajari reaktivitas dan Composition API.', ['vue', 'vuejs']),
    S('Next.js', 'Framework', 'Pelajari routing dan rendering di atas dasar React.', ['nextjs']),
    S('Node.js', 'Backend', 'Bangun REST API sederhana dengan Express.', ['node', 'nodejs', 'express', 'express.js']),
    S('PHP', 'Bahasa pemrograman', 'Pahami dasar OOP di PHP dan koneksi ke database.', []),
    S('Laravel', 'Framework', 'Pelajari routing, Eloquent ORM, dan migration.', []),
    S('Java', 'Bahasa pemrograman', 'Kuasai OOP dan collections sebagai fondasi.', []),
    S('Kotlin', 'Mobile', 'Pelajari sintaks dasar dan Jetpack Compose.', []),
    S('Flutter', 'Mobile', 'Bangun satu aplikasi lengkap dengan state management dasar.', ['dart']),
    S('Android', 'Mobile', 'Pahami lifecycle activity dan layout dasar.', ['android studio']),
    S('Firebase', 'Backend', 'Coba Auth dan Firestore di proyek kecil.', []),
    S('Git', 'Tools', 'Biasakan branch, commit yang rapi, dan pull request di GitHub.', ['github', 'gitlab', 'version control']),
    S('Docker', 'DevOps', 'Bungkus satu aplikasi sederhana ke dalam container.', []),
    S('Linux', 'Sistem', 'Latih command line dasar serta manajemen user dan permission.', ['ubuntu', 'debian']),
    S('Bash', 'Sistem', 'Tulis skrip otomasi untuk tugas rutin.', ['shell', 'shell scripting']),
    S('REST API', 'Backend', 'Pahami HTTP method, status code, dan desain endpoint.', ['api', 'restful', 'restful api']),
    S('MySQL', 'Database', 'Latih desain tabel dan relasi.', ['mariadb']),
    S('PostgreSQL', 'Database', 'Pelajari tipe data, index, dan query lanjutan.', ['postgres']),
    S('MongoDB', 'Database', 'Pahami document model dan aggregation dasar.', ['mongo']),
    S('Excel', 'Data', 'Kuasai rumus, pivot table, dan lookup.', ['microsoft excel', 'ms excel', 'spreadsheet', 'google sheets']),
    S('Tableau', 'Data', 'Buat satu dashboard dari dataset publik.', []),
    S('Power BI', 'Data', 'Latih data modeling dasar dan DAX sederhana.', ['powerbi']),
    S('Pandas', 'Data', 'Latih cleaning dan agregasi data dengan DataFrame.', []),
    S('Machine Learning', 'Data', 'Pahami alur train-test, evaluasi, dan overfitting lewat scikit-learn.', ['ml', 'scikit-learn', 'sklearn']),
    S('Statistics', 'Data', 'Kuasai statistik deskriptif, distribusi, dan uji hipotesis dasar.', ['statistik', 'statistika']),
    S('Data Analysis', 'Data', 'Latih alur lengkap: pertanyaan, data, lalu insight.', ['analisis data', 'data analytics']),
    S('Data Visualization', 'Data', 'Pelajari cara memilih chart yang tepat untuk setiap pertanyaan.', ['visualisasi data']),
    S('Figma', 'Desain', 'Latih auto layout dan komponen.', []),
    S('UI Design', 'Desain', 'Pelajari hierarki visual, tipografi, dan spacing.', ['ui', 'user interface']),
    S('UX Research', 'Desain', 'Latih wawancara pengguna dan usability testing.', ['ux', 'user research', 'user experience']),
    S('Prototyping', 'Desain', 'Buat prototipe interaktif di Figma.', ['wireframe', 'wireframing']),
    S('Testing', 'QA', 'Pelajari cara menulis test case dan skenario edge case.', ['software testing', 'manual testing', 'test case', 'qa']),
    S('Selenium', 'QA', 'Otomasi satu alur web sederhana.', ['automation testing', 'cypress', 'playwright']),
    S('Postman', 'QA', 'Latih uji endpoint dan koleksi request.', []),
    S('Jira', 'Tools', 'Pahami alur ticket dan sprint board.', ['scrum', 'agile']),
    S('Networking', 'Jaringan', 'Kuasai konsep IP, subnetting, routing, dan switching.', ['jaringan', 'jaringan komputer', 'tcp/ip', 'subnetting']),
    S('Mikrotik', 'Jaringan', 'Praktik konfigurasi RouterOS di simulator atau perangkat.', ['routeros']),
    S('Cisco', 'Jaringan', 'Latih Packet Tracer dan konfigurasi dasar router dan switch.', ['packet tracer', 'ccna']),
    S('Windows Server', 'Sistem', 'Latih Active Directory serta DHCP dan DNS dasar.', ['active directory']),
    S('Troubleshooting', 'Sistem', 'Biasakan mendokumentasikan langkah diagnosis.', ['troubleshoot', 'hardware']),
    S('Cybersecurity', 'Keamanan', 'Pelajari dasar keamanan: OWASP Top 10 dan hardening.', ['keamanan jaringan', 'owasp', 'pentest', 'penetration testing']),
    S('AWS', 'Cloud', 'Coba layanan gratis: EC2, S3, dan IAM.', ['amazon web services']),
    S('Cloud', 'Cloud', 'Pahami konsep IaaS, PaaS, dan SaaS.', ['gcp', 'azure', 'google cloud', 'cloud computing']),
    S('CI/CD', 'DevOps', 'Bangun pipeline sederhana di GitHub Actions.', ['github actions', 'jenkins', 'ci cd']),
    S('Customer Support', 'Soft skill', 'Latih menjelaskan masalah teknis dengan bahasa awam.', ['helpdesk', 'help desk', 'service desk']),
    S('Communication', 'Soft skill', 'Latih presentasi singkat dan menulis laporan yang jelas.', ['komunikasi', 'presentation', 'presentasi']),
    S('Problem Solving', 'Soft skill', 'Latih memecah masalah besar menjadi langkah kecil.', ['analytical thinking', 'critical thinking', 'berpikir kritis'])
  ];

  const R = (id, title, blurb, skillList, aff, duties) => ({ id, title, blurb, skills: skillList, aff, duties });

  const roles = [
    R('backend', 'Backend Developer', 'Membangun logika server, API, dan database di balik aplikasi.',
      ['SQL', 'REST API', 'Git', 'Python', 'Node.js', 'PHP', 'Laravel', 'MySQL', 'Docker', 'Linux'],
      ['PPLG', 'RPL', 'Informatika', 'Teknik Komputer', 'SIJA'],
      ['Membuat dan merawat endpoint API', 'Merancang tabel dan query database', 'Memperbaiki bug dan menjaga performa layanan']),
    R('frontend', 'Frontend Developer', 'Mengubah desain menjadi antarmuka web yang cepat dan nyaman dipakai.',
      ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Tailwind CSS', 'TypeScript', 'Figma', 'REST API'],
      ['PPLG', 'RPL', 'Informatika', 'Sistem Informasi'],
      ['Membangun halaman dan komponen UI', 'Menyambungkan tampilan ke API', 'Memastikan tampilan responsif di berbagai perangkat']),
    R('fullstack', 'Fullstack Developer', 'Mengerjakan sisi tampilan sekaligus sisi server dalam satu produk.',
      ['JavaScript', 'Node.js', 'React', 'SQL', 'REST API', 'Git', 'HTML', 'CSS', 'MongoDB'],
      ['PPLG', 'RPL', 'Informatika'],
      ['Membangun fitur dari database sampai tampilan', 'Meninjau kode bersama tim', 'Men-deploy fitur ke server']),
    R('mobile', 'Mobile Developer', 'Membuat aplikasi Android atau lintas platform untuk pengguna ponsel.',
      ['Flutter', 'Kotlin', 'Android', 'Firebase', 'REST API', 'Git', 'Java', 'UI Design'],
      ['PPLG', 'RPL', 'Informatika'],
      ['Mengembangkan layar dan fitur aplikasi', 'Mengintegrasikan API dan notifikasi', 'Menguji aplikasi di berbagai perangkat']),
    R('data-analyst', 'Data Analyst', 'Mengolah data menjadi insight dan laporan yang membantu keputusan bisnis.',
      ['SQL', 'Excel', 'Data Analysis', 'Data Visualization', 'Python', 'Tableau', 'Power BI', 'Statistics', 'Pandas'],
      ['Sistem Informasi', 'Informatika'],
      ['Menarik dan membersihkan data', 'Membuat dashboard dan laporan berkala', 'Menyampaikan temuan ke tim non-teknis']),
    R('ml-engineer', 'Machine Learning Engineer (Junior)', 'Membangun dan menyajikan model prediksi dari data.',
      ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Statistics', 'Git', 'Docker', 'Data Analysis'],
      ['Informatika', 'Teknik Komputer'],
      ['Menyiapkan data dan fitur', 'Melatih dan mengevaluasi model', 'Membungkus model agar bisa dipakai aplikasi']),
    R('qa', 'QA Engineer', 'Memastikan perangkat lunak berjalan benar sebelum sampai ke pengguna.',
      ['Testing', 'Selenium', 'Postman', 'Jira', 'SQL', 'Git', 'REST API', 'Problem Solving', 'Communication'],
      ['RPL', 'PPLG', 'Sistem Informasi', 'Informatika'],
      ['Menulis dan menjalankan test case', 'Melaporkan bug dengan langkah yang jelas', 'Mengotomasi pengujian yang berulang']),
    R('uiux', 'UI/UX Designer', 'Merancang pengalaman dan tampilan produk digital berdasarkan kebutuhan pengguna.',
      ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Communication', 'HTML', 'CSS', 'Problem Solving'],
      ['Sistem Informasi', 'PPLG', 'RPL'],
      ['Meriset kebutuhan pengguna', 'Membuat wireframe dan prototipe', 'Menyerahkan desain ke developer']),
    R('devops', 'DevOps / Cloud Engineer (Junior)', 'Menjaga aplikasi tetap bisa dirilis dengan cepat dan stabil di server.',
      ['Linux', 'Docker', 'Git', 'CI/CD', 'AWS', 'Bash', 'Networking', 'Cloud'],
      ['SIJA', 'TJKT', 'Teknik Komputer', 'Informatika'],
      ['Mengatur server dan container', 'Membangun pipeline rilis otomatis', 'Memantau layanan dan menangani insiden']),
    R('network', 'Network Administrator', 'Mengelola jaringan kantor atau layanan agar selalu tersambung dan aman.',
      ['Networking', 'Mikrotik', 'Cisco', 'Linux', 'Windows Server', 'Troubleshooting', 'Cybersecurity'],
      ['SIJA', 'TJKT', 'Teknik Komputer'],
      ['Mengonfigurasi router, switch, dan firewall', 'Memantau trafik dan mengatasi gangguan', 'Mendokumentasikan topologi jaringan']),
    R('it-support', 'IT Support', 'Membantu pengguna menyelesaikan masalah perangkat, akun, dan jaringan sehari-hari.',
      ['Troubleshooting', 'Windows Server', 'Networking', 'Customer Support', 'Communication', 'Linux', 'Problem Solving'],
      ['SIJA', 'TJKT', 'Teknik Komputer', 'Sistem Informasi'],
      ['Menangani tiket bantuan pengguna', 'Menyiapkan dan merawat perangkat kerja', 'Mengelola akun dan hak akses dasar']),
    R('security', 'Security Analyst (Junior)', 'Memantau ancaman dan menjaga sistem dari celah keamanan.',
      ['Cybersecurity', 'Networking', 'Linux', 'Python', 'Bash', 'Troubleshooting', 'Problem Solving'],
      ['SIJA', 'TJKT', 'Informatika', 'Teknik Komputer'],
      ['Memantau log dan peringatan keamanan', 'Menganalisis insiden dasar', 'Membantu menambal celah yang ditemukan']),
    R('market-research', 'Market Research Analyst', 'Mengumpulkan dan membaca data pasar untuk mendukung strategi produk.',
      ['Excel', 'Data Analysis', 'Data Visualization', 'Statistics', 'Communication', 'Python', 'Tableau'],
      ['Sistem Informasi'],
      ['Mengumpulkan data survei dan kompetitor', 'Menganalisis tren pasar', 'Menyusun laporan dan presentasi temuan'])
  ];

  const L = (id, company, role, title, loc, type, level, salary, skillList, d) =>
    ({ id, company, role, title, loc, type, level, salary, skills: skillList, d });

  const listings = [
    L('j01', 'Nirmala Teknologi', 'backend', 'Junior Backend Developer', 'Jakarta', 'Full-time', 'Junior', 'Rp6–9 jt', ['Python', 'SQL', 'REST API', 'Git', 'PostgreSQL', 'Docker'], 2),
    L('j02', 'Nirmala Teknologi', 'qa', 'QA Engineer Trainee', 'Jakarta', 'Magang', 'Magang', 'Rp2–3 jt', ['Testing', 'Postman', 'Jira', 'SQL', 'Communication'], 6),
    L('j03', 'Kirana Digital Labs', 'qa', 'QA Associate', 'Bandung', 'Full-time', 'Entry', 'Rp4,5–6,5 jt', ['Testing', 'Selenium', 'Postman', 'Jira', 'Git', 'Problem Solving'], 1),
    L('j04', 'Kirana Digital Labs', 'frontend', 'Frontend Developer', 'Bandung', 'Full-time', 'Junior', 'Rp5–8 jt', ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Tailwind CSS'], 3),
    L('j05', 'Bumi Data Analitik', 'data-analyst', 'Data Analyst Trainee', 'Yogyakarta', 'Magang', 'Magang', 'Rp2–3 jt', ['SQL', 'Excel', 'Data Analysis', 'Python', 'Data Visualization'], 4),
    L('j06', 'Bumi Data Analitik', 'data-analyst', 'Junior Data Analyst', 'Remote', 'Full-time', 'Junior', 'Rp6–9 jt', ['SQL', 'Python', 'Tableau', 'Pandas', 'Statistics', 'Data Analysis'], 7),
    L('j07', 'Awan Cipta Sistem', 'frontend', 'Frontend Developer Intern', 'Surabaya', 'Magang', 'Magang', 'Rp1,5–2,5 jt', ['HTML', 'CSS', 'JavaScript', 'Git', 'Figma'], 5),
    L('j08', 'Awan Cipta Sistem', 'fullstack', 'Fullstack Developer', 'Surabaya', 'Full-time', 'Junior', 'Rp7–10 jt', ['JavaScript', 'Node.js', 'React', 'SQL', 'REST API', 'Git', 'MongoDB'], 9),
    L('j09', 'Lintang Software House', 'backend', 'Laravel Developer', 'Semarang', 'Full-time', 'Entry', 'Rp4–6 jt', ['PHP', 'Laravel', 'MySQL', 'REST API', 'Git', 'HTML'], 2),
    L('j10', 'Lintang Software House', 'mobile', 'Flutter Developer', 'Remote', 'Kontrak', 'Junior', 'Rp6–9 jt', ['Flutter', 'Firebase', 'REST API', 'Git', 'UI Design'], 8),
    L('j11', 'Samudra Cloud Nusantara', 'devops', 'Junior DevOps Engineer', 'Jakarta', 'Full-time', 'Junior', 'Rp7–10 jt', ['Linux', 'Docker', 'Git', 'CI/CD', 'AWS', 'Bash'], 3),
    L('j12', 'Samudra Cloud Nusantara', 'devops', 'Cloud Support Intern', 'Jakarta', 'Magang', 'Magang', 'Rp2–3 jt', ['Linux', 'Cloud', 'AWS', 'Networking', 'Troubleshooting'], 10),
    L('j13', 'Dharma Netindo', 'network', 'Network Administrator', 'Bekasi', 'Full-time', 'Entry', 'Rp4–6 jt', ['Networking', 'Mikrotik', 'Cisco', 'Linux', 'Troubleshooting'], 4),
    L('j14', 'Dharma Netindo', 'it-support', 'IT Support Staff', 'Bekasi', 'Kontrak', 'Entry', 'Rp3,5–5 jt', ['Troubleshooting', 'Windows Server', 'Networking', 'Customer Support', 'Communication'], 6),
    L('j15', 'Arunika Studio', 'uiux', 'UI/UX Designer Junior', 'Bandung', 'Full-time', 'Junior', 'Rp5–8 jt', ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Communication'], 2),
    L('j16', 'Arunika Studio', 'frontend', 'Web Developer', 'Bandung', 'Full-time', 'Entry', 'Rp4–6 jt', ['HTML', 'CSS', 'JavaScript', 'Git', 'Figma', 'Tailwind CSS'], 11),
    L('j17', 'Tirta Fintech', 'backend', 'Backend Engineer (Node.js)', 'Jakarta', 'Full-time', 'Junior', 'Rp8–12 jt', ['Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'Git'], 1),
    L('j18', 'Tirta Fintech', 'data-analyst', 'Business Data Analyst', 'Jakarta', 'Full-time', 'Junior', 'Rp7–10 jt', ['SQL', 'Excel', 'Power BI', 'Data Analysis', 'Statistics'], 5),
    L('j19', 'Mahesa Retail Tech', 'fullstack', 'Web Developer (Fullstack)', 'Tangerang', 'Full-time', 'Entry', 'Rp5–7 jt', ['JavaScript', 'Vue.js', 'PHP', 'MySQL', 'Git', 'REST API'], 12),
    L('j20', 'Cakra Security', 'security', 'Junior Security Analyst', 'Jakarta', 'Full-time', 'Junior', 'Rp7–11 jt', ['Cybersecurity', 'Networking', 'Linux', 'Python', 'Bash'], 3),
    L('j21', 'Pelita Edu Tech', 'mobile', 'Android Developer Intern', 'Malang', 'Magang', 'Magang', 'Rp1,5–2,5 jt', ['Kotlin', 'Android', 'Java', 'Git', 'Firebase'], 7),
    L('j22', 'Garuda Logistik Digital', 'ml-engineer', 'Junior ML Engineer', 'Surabaya', 'Full-time', 'Junior', 'Rp8–12 jt', ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Docker', 'Statistics'], 4),
    L('j23', 'Senja Health Systems', 'qa', 'Software Tester', 'Yogyakarta', 'Kontrak', 'Entry', 'Rp4–5,5 jt', ['Testing', 'Jira', 'Postman', 'SQL', 'Communication', 'Problem Solving'], 9),
    L('j24', 'Rajawali Telekom Mitra', 'network', 'NOC Engineer Trainee', 'Medan', 'Magang', 'Magang', 'Rp2–3 jt', ['Networking', 'Cisco', 'Mikrotik', 'Troubleshooting', 'Linux'], 8),
    L('j25', 'Nusa Kreatif Interaktif', 'frontend', 'Frontend Developer (React)', 'Remote', 'Kontrak', 'Junior', 'Rp6–9 jt', ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Git', 'REST API'], 2),
    L('j26', 'Pelita Edu Tech', 'market-research', 'Market Research Analyst', 'Malang', 'Full-time', 'Entry', 'Rp4–6 jt', ['Excel', 'Data Analysis', 'Data Visualization', 'Statistics', 'Communication', 'Tableau'], 13)
  ];

  const jurusan = [
    { v: 'SIJA', l: 'SIJA — Sistem Informatika, Jaringan & Aplikasi' },
    { v: 'PPLG', l: 'PPLG — Pengembangan Perangkat Lunak & Gim' },
    { v: 'RPL', l: 'RPL — Rekayasa Perangkat Lunak' },
    { v: 'TJKT', l: 'TJKT / TKJ — Teknik Jaringan Komputer & Telekomunikasi' },
    { v: 'Informatika', l: 'Informatika / Ilmu Komputer' },
    { v: 'Sistem Informasi', l: 'Sistem Informasi' },
    { v: 'Teknik Komputer', l: 'Teknik Komputer' },
    { v: 'Lainnya', l: 'Lainnya (bidang IT)' }
  ];

  const exp = [
    { v: 0, l: 'Fresher', t: 'Fresher (0–1 tahun)', s: '0–1 thn' },
    { v: 1, l: '1–2 thn', t: '1–2 tahun', s: '1–2 thn' },
    { v: 2, l: '2–4 thn', t: '2–4 tahun', s: '2–4 thn' },
    { v: 3, l: '4+ thn', t: '4+ tahun', s: '4+ thn' }
  ];

  const locations = ['Semua', 'Remote', 'Jakarta', 'Bandung', 'Yogyakarta', 'Surabaya', 'Semarang', 'Bekasi', 'Tangerang', 'Malang', 'Medan'];
  const types = ['Semua', 'Full-time', 'Magang', 'Kontrak'];
  const levels = ['Semua', 'Magang', 'Entry', 'Junior'];
  const popular = ['Python', 'SQL', 'JavaScript', 'HTML', 'CSS', 'Git', 'React', 'Linux', 'Excel', 'Networking', 'Figma', 'Testing'];

  return { skills, roles, listings, jurusan, exp, locations, types, levels, popular };
});
