Project ini berisi project2 legacy, aplikasi lama yang sudah ditinggalkan tidak di maintenance. Namun kegunaan aplikasi ini dalam memonitoring perkara di pengadilan cukup bagus. Akan tetapi beberapa kegunaan terpisah pada aplikasi lainnya. Saya sudah mengumpulkan beberapa aplikasi yang akan di rewrite ke teknologi baru dengan menggabungkan semua fitur pada aplikasi2 legacy ini.

Stack yang digunakan:
- NuxtJS (Nuxt 3)
- NuxtUI
- NuxtChart
- Prisma
- MySQL / MariaDB (Local Database)
  - Host: 127.0.0.1 / localhost
  - User: root
  - Database: sipppaju

Database lokal sudah disiapkan untuk pengujian query langsung ke database SIPP.

---

## Inventarisasi Fitur Aplikasi Legacy (5 Aplikasi)

### 1. Modul Dashboard Eksekutif & Statistik Analitik (dari `monitoring_sipp` & `estat`)
- **Indikator Utama (KPI Cards)**: Total Perkara Terdaftar, Perkara Diputus, Perkara Minutasi, Sisa Perkara, Rasio Penyelesaian Perkara.
- **Early Warning System (Atensi Harian)**:
  - Perkara putus hari ini belum minutasi.
  - Perkara putus belum upload e-doc putusan.
  - Perkara putus belum biaya redaksi/meterai.
- **Grafik Tren Bulanan (NuxtChart)**:
  - Komparasi grafik perkara masuk, putus, dan minutasi per bulan (Januari – Desember).
- **Analitik Adopsi e-Court**:
  - Persentase & rasio perkara e-Court vs Konvensional (Tahunan, Bulanan, Mingguan, Harian).
  - Statistik perkara masuk via e-Court vs diputus via e-Court.
- **Statistik Tematik Perkara**:
  - Rekapitulasi perkara Perceraian (Cerai Gugat vs Cerai Talak).
  - Rekapitulasi perkara Dispensasi Kawin.
  - Rekapitulasi perkara Prodeo (DIPA vs Murni).
  - Rekapitulasi intensitas perkara yang disidangkan.

### 2. Modul Penilaian Kinerja & Evaluasi Raport SIPP (dari `monev`)
- **Kalkulasi Nilai Raport Kinerja SIPP (Standar Badilag/MA RI)**:
  - Rasio Bobot Proses (Verstek vs Kontradiktoir).
  - Rasio Waktu Penanganan Perkara (Kategori <=30 hari, 31-60 hari, 61-90 hari, 91-150 hari dengan kompensasi pihak gaib & mediasi).
  - Rasio Kecepatan Minutasi (Hari yang sama, 1-3 hari, 4-6 hari, 7-14 hari).
  - Rasio Publikasi Direktori Putusan (Dirput MA).
  - Skor Akhir & Penentuan Indikator Kinerja Warna (Hijau, Kuning, Merah).
- **Audit & Kepatuhan Tahapan Perkara Baru**:
  - Filter perkara belum input PMH (Penetapan Majelis Hakim).
  - Belum input PP (Panitera Pengganti).
  - Belum input JSP (Jurusita / Jurusita Pengganti).
  - Belum input PHS (Penetapan Hari Sidang).
  - Deteksi anomali tanggal (Tanggal PHS sebelum PMH, perkara dicabut sebelum PHS).
- **Audit Jalannya Persidangan**:
  - Penundaan sidang belum diinput / belum update jadwal sidang berikutnya.
  - Ruang sidang belum diisi.
  - Status perkara mengambang ("ditegur" atau "ditentukan kemudian").
- **Monitoring Tunggakan & Usia Perkara (Aging Cases)**:
  - Monitoring perkara belum putus usia > 4 bulan, > 5 bulan, > 6 bulan, dan > 12 bulan.
- **Audit Kepatuhan Pasca Putus**:
  - Amar putusan belum diisi di sistem.
  - Perkara putus belum minutasi.
  - Perkara putus belum PBT (Pemberitahuan Putusan).
  - Perkara putus belum BHT (Berkekuatan Hukum Tetap / Inkrah).

### 3. Modul Manajemen Distribusi Perkara & Smart Majelis (dari `porsi` & `aps2018`)
- **Workload Balancing (Keseimbangan Beban Kerja)**:
  - Rekap distribusi porsi perkara per Majelis Hakim (tahunan & bulanan).
  - Rekap distribusi porsi perkara per Panitera Pengganti (PP) tahunan & bulanan.
- **Smart Majelis & Tracking Penunjukan**:
  - Histori dan log penunjukan majelis hakim.
  - Alert pergantian Ketua Majelis (Ganti KM) hari ini & riwayat pergantian.
  - Alert pergantian Hakim Anggota.
  - Tracking peninjauan ulang penetapan majelis.
  - Monitoring perkara sisa tahun lalu yang dibagi kembali di tahun berjalan.
  - Rekap alasan/keterangan penunjukan & pergantian majelis.
- **Monitoring Berita Acara Sidang (BAS)**:
  - Rekapitulasi perbandingan persidangan vs ketersediaan file BAS.
  - Deteksi file BAS kosong/belum diupload per Panitera Pengganti (PP).
  - Filter perkara BAS kosong berdasarkan PP, bulan, dan tahun sidang.

### 4. Modul Monitoring Keuangan Perkara & Kas Bantu (dari `aps2018`, `monev`, `porsi`)
- **Buku Kas Bantu & Transaksi Harian SIPP**:
  - Monitoring transaksi kas harian real-time.
  - Rincian transaksi Panjar Biaya Perkara, PNBP, ATK/Proses, Panggilan & Pemberitahuan, Meterai/Redaksi, Hak-Hak Kepaniteraan (HHK).
- **Buku Kendali Sisa Panjar**:
  - Monitoring pengembalian sisa panjar perkara tingkat pertama & upaya hukum (Banding, Kasasi, PK).
  - Deteksi perkara putus bersaldo yang belum diambil pihak.
  - Generator formulir/surat pemberitahuan pengambilan sisa panjar.
- **Monitoring Keuangan & Relaas Jurusita (JSP)**:
  - Monitoring saldo biaya pemanggilan per Jurusita / Jurusita Pengganti.
  - Deteksi keterlambatan penyerahan relaas panggilan / pencairan biaya.
  - Ekspor data audit biaya JSP ke format Excel (XLSX).
- **Validasi & Rekonsiliasi Kas**:
  - Input saldo awal dan saldo transaksi rekening bank.
  - Validasi transaksi kas harian vs sistem SIPP serta rekap bulanan/tahunan.

### 5. Modul Kepatuhan Dokumen Elektronik & Direktori Putusan MA (dari `monev` & `monitoring_sipp`)
- **Monitoring Dokumen Elektronik (e-Doc)**:
  - Kelengkapan Posita & Petitum.
  - Kelengkapan e-Doc Putusan Sela, Putusan Akhir, Putusan Anonimisasi.
  - Deteksi selisih file Putusan asli vs Putusan Anonimisasi.
  - Kelengkapan e-Doc Penetapan Ikrar Talak, Akta Cerai & Berkas Arsip.
- **Monitoring Sinkronisasi Direktori Putusan (Dirput MA)**:
  - Monitoring antrian kirim Dirput (Status Masuk, Sukses, Gagal).
  - Rekap sisa tunggakan publikasi Dirput tahun berjalan & sebelumnya.
  - Selisih antrian Dirput vs perkara putus SIPP serta validasi tautan portal MA.

### 6. Modul Administrasi Perceraian & Akta Cerai (dari `aps2018` & `monev`)
- **Monitoring Ikrar Talak**:
  - Perkara Cerai Talak sudah BHT belum input PMH Ikrar Talak & PHS Ikrar Talak.
  - Amar persidangan ikrar talak belum diinput & monitoring tunggu lapor.
- **Monitoring & Penerbitan Akta Cerai (AC)**:
  - Perkara siap terbit Akta Cerai khusus Cerai Gugat (CG) & Cerai Talak (CT).
  - Fitur "Wayahe Inkrah" (PBT masuk > 14 hari belum terbit AC).
  - Formulir tanda terima penyerahan Akta Cerai & laporan penyerahan.
  - Buku Induk Register Akta Cerai digital (R1-PA9).

### 7. Modul Buku Register Perkara Digital (dari `aps2018`)
- Register Induk Perkara Gugatan (R1-PA1G), Permohonan (R1-PA1P), Banding (R1-PA2), Kasasi (R1-PA3), PK (R1-PA4).
- Register Surat Kuasa Khusus (R1-PA7), Eksekusi (R1-PA8), Akta Cerai (R1-PA9).
- Register Ekonomi Syariah (R1-PA12), Mediasi (R1-PA15), Prodeo (R1-PA18).

### 8. Modul Laporan Perkara Bulanan & LIPA (dari `aps2018`)
- Kompilasi otomatis Laporan LIPA 1 s.d. LIPA 20+.
- Input data laporan manual (Uang Iwadl, Sidang Keliling, Posbakum, Pelayanan Terpadu, Rekap Petikan Putusan & Perceraian).
- Ekspor & monitoring pengiriman laporan online.

### 9. Modul Cetak Blangko & Dokumen Otomatis (dari `aps2018`)
- Generator cetak PMH Komulatif & PMH Ulang.
- Penunjukan PP & JSP Komulatif.
- PHS Komulatif.
- SKUM Panjar Tingkat I, Tambah Panjar, dan Upaya Hukum. 