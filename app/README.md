# Sistem Terpadu Monitoring & Evaluasi Kinerja Perkara SIPP (Monev SIPP)

Aplikasi terpadu modern penanganan perkara Pengadilan Agama hasil rewrite dan unifikasi dari 5 sistem legacy (`aps2018`, `monev`, `monitoring_sipp`, `porsi`, dan `estat`).

---

## 🛠️ Tech Stack
- **Framework**: [Nuxt 3](https://nuxt.com/) (Vue 3, Nitro Engine)
- **UI & Design System**: [Nuxt UI](https://ui.nuxt.com/) (Tailwind CSS, Heroicons & Lucide Icons)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) terhubung langsung ke database MySQL/MariaDB SIPP lokal (`sipppaju`)
- **Export Utility**: SheetJS (`xlsx`) untuk ekspor data tabel ke format Excel
- **Data Analytics**: Native MySQL Time & DATEDIFF queries, BigInt serializing parser

---

## 🚀 Fitur & Modul Utama

1. **Dashboard Eksekutif & Early Warning System (EWS)** (`/`)
   - KPI Cards: Perkara Masuk, Putus, Minutasi, Sisa, dan Rasio Penyelesaian
   - 4 Kotak Atensi: Putus hari ini belum minutasi, Putus belum minutasi, Belum upload e-doc, Belum biaya redaksi/meterai
   - Grafik komparasi bulanan perkara masuk, putus, dan minutasi
   - 10 Perkara terbaru yang terdaftar

2. **Statistik & Analitik e-Court** (`/ecourt`)
   - Persentase adopsi perkara elektronik: Tahunan, Bulanan, Mingguan, dan Harian
   - Visual progress bar komparasi e-Court vs Konvensional
   - Statistik tematik: Perceraian (Cerai Gugat vs Cerai Talak), Dispensasi Kawin, Perkara Prodeo (DIPA vs Murni), dan Akta Cerai terbit

3. **Raport & Evaluasi Kinerja SIPP** (`/kinerja`)
   - Skor Akhir Raport SIPP (Standar Ditjen Badilag / Mahkamah Agung RI)
   - Evaluasi 6 variabel: Persentase Putus, Persentase Minutasi, Rasio Publikasi Dirput MA, Rasio Bobot Proses (Verstek vs Kontradiktoir), Rasio Waktu Putus, dan Rasio Waktu Minutasi

4. **Kontrol & Audit Alur Perkara** (`/kontrol`)
   - Audit Kepatuhan Penetapan: Belum PMH, Belum PP, Belum JSP, Belum PHS
   - Monitoring Usia Perkara Belum Putus / Tunggakan (Aging Cases): >4 bulan, >5 bulan, >6 bulan, >12 bulan
   - Detail interaktif daftar perkara berdasarkan kategori audit

5. **Porsi Beban Kerja & Smart Majelis** (`/porsi`)
   - Distribusi beban kerja Panitera Pengganti (PP) dan Ketua Majelis Hakim
   - Pengelompokan perkara: Cerai Gugat (CG), Cerai Talak (CT), dan Lainnya
   - Rata-rata beban serta indikator disparitas beban tertinggi vs terendah
   - Filter tahun dan bulan

6. **Monitoring Buku Kas Bantu & Keuangan** (`/keuangan`)
   - Arus kas harian SIPP: Total Penerimaan (Debit), Total Pengeluaran (Kredit), dan Saldo Mutasi
   - Buku kas bantu transaksi perkara (Panjar, PNBP, ATK, Panggilan, Meterai, Redaksi)
   - Filter rentang tanggal transaksi fleksibel dan ekspor Excel langsung

7. **Monitoring Kepatuhan Dokumen Elektronik (e-Doc)** (`/edoc`)
   - Audit perkara putus yang belum upload file e-Doc amar putusan
   - Deteksi selisih putusan yang belum diupload file anonimisasi salinan publik
   - Rincian detail perkara dan link e-doc

8. **Monitoring Akta Cerai & Ikrar Talak** (`/akta-cerai`)
   - Perkara Cerai Gugat (CG) yang telah BHT namun belum terbit Akta Cerai
   - Perkara Cerai Talak (CT) yang telah BHT namun belum pelaksanaan sidang Ikrar Talak
   - Monitoring fisik Akta Cerai terbit yang belum diambil oleh pihak berperkara

9. **Buku Register Perkara Digital** (`/register`)
   - Register Induk Perkara Gugatan (R1-PA1G)
   - Register Induk Perkara Permohonan (R1-PA1P)
   - Register Perkara Prodeo / Pembebasan Biaya (R1-PA18)
   - Pencarian real-time dan ekspor laporan ke Excel

10. **Laporan Keadaan Perkara (LIPA 1)** (`/laporan`)
    - Matriks resmi Ditjen Badilag: Sisa Bulan Lalu, Diterima, Beban, Diputus, Minutasi, Sisa Akhir, dan Rasio Putus
    - Alur perkara: Gugatan (Pdt.G), Permohonan (Pdt.P), Gugatan Sederhana (Pdt.GS), dan Total
    - Opsi pemilihan bulan dan tahun, serta ekspor file Excel instan

---

## 💻 Panduan Instalasi & Deployment

Untuk panduan lengkap instalasi menggunakan **Docker / Docker Compose** maupun mode **Standalone (Production & PM2)**, silakan lihat file dokumentasi utama di root repository:

👉 **[Lihat Panduan Instalasi Lengkap (README.md)](../README.md)**

### Ringkasan Menjalankan Cepat (Development Lokal):
1. Masuk ke direktori `app`:
   ```bash
   cd app
   ```
2. Salin environment & konfigurasi koneksi database:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Jalankan server development:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui browser di `http://localhost:3000`.
