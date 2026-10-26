# Sistem Terpadu Monitoring & Evaluasi Kinerja Perkara SIPP (Monev SIPP)

Aplikasi pemantauan, kontrol, audit, dan evaluasi kinerja penanganan perkara Pengadilan Agama secara modern dan real-time. Aplikasi ini dibangun menggunakan arsitektur modular paralel berbasis **Nuxt 3**, **Nuxt UI (Tailwind CSS)**, dan **Prisma ORM** yang terintegrasi langsung dengan database MySQL / MariaDB Sistem Informasi Penelusuran Perkara (SIPP).

---

## 🛠️ Tech Stack & Kebutuhan Sistem

- **Framework**: [Nuxt 3](https://nuxt.com/) (Vue 3, Nitro Engine)
- **UI & Styling**: [Nuxt UI](https://ui.nuxt.com/) (Tailwind CSS, Heroicons & Lucide Icons)
- **Database & ORM**: [Prisma ORM v6](https://www.prisma.io/) terhubung ke MySQL 5.7+ / MariaDB 10.3+
- **Charts & Export**: Chart.js, vue-chartjs, SheetJS (xlsx), ExcelJS
- **Container**: Docker & Docker Compose (Multi-stage build Node 22-bookworm-slim)

---

## 📋 Konfigurasi Environment (`.env`)

Sebelum menjalankan aplikasi, Anda perlu menyiapkan file konfigurasi environment `.env`. Salin template dari `.env.example`:

| Variabel | Default / Contoh | Deskripsi |
| :--- | :--- | :--- |
| `PORT` | `3000` (atau `3080` pada host Docker) | Port HTTP yang diekspos oleh aplikasi |
| `DATABASE_URL` | `mysql://user:pass@host:3306/sipp` | Connection string database MySQL SIPP untuk Prisma |
| `ENCRYPT_API_URL` | `http://192.168.0.141:8080` | URL service enkripsi/dekripsi password perkara (opsional) |
| `ENCRYPT_API_KEY` | *(kosong)* | API Key service enkripsi (jika diperlukan) |
| `SIPP_BASE_URL` | `http://192.168.0.222/SIPP` | Base URL aplikasi web SIPP Pengadilan Agama |

---

## 🐳 Opsi 1: Instalasi Menggunakan Docker (Rekomendasi Produksi)

Metode ini adalah cara paling mudah, aman, dan terisolasi untuk lingkungan produksi. Seluruh runtime Node.js, dependensi Prisma, dan OpenSSL sudah dikemas rapi di dalam container.

### 1. Prasyarat
- [Docker Engine](https://docs.docker.com/engine/install/) (v20.10 ke atas) atau Docker Desktop
- [Docker Compose](https://docs.docker.com/compose/) (v2.x ke atas)

### 2. Siapkan File `.env`
Di root direktori project, salin file template `.env.example` menjadi `.env`:

**Linux / macOS:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

### 3. Sesuaikan `DATABASE_URL` di File `.env`

Sesuaikan string koneksi database sesuai topologi jaringan Anda:

- **Kasus A — MySQL berjalan di Server Host yang sama dengan Docker:**
  Gunakan hostname `host.docker.internal` (telah dikonfigurasi melalui `extra_hosts` di `docker-compose.yml`):
  ```env
  DATABASE_URL="mysql://root:password_anda@host.docker.internal:3306/sipp"
  ```
  > **Catatan untuk Linux:** Pastikan user database diizinkan mengakses dari interface docker (`GRANT ALL PRIVILEGES ON sipp.* TO 'root'@'%' IDENTIFIED BY 'password';`) dan bind-address MySQL diatur ke `0.0.0.0` pada `my.cnf`.

- **Kasus B — MySQL berjalan di Server Database terpisah:**
  Gunakan IP address server database SIPP:
  ```env
  DATABASE_URL="mysql://user_sipp:password_sipp@192.168.0.200:3306/sipp"
  ```

### 4. Build dan Jalankan Container
Jalankan perintah berikut di root folder project:

```bash
docker compose up -d --build
```

Docker akan mengompilasi aplikasi Nuxt 3 (multi-stage build), membuat Prisma client, dan menjalankan server produksi Nitro.

### 5. Cek Status dan Log
- **Melihat status container & healthcheck:**
  ```bash
  docker compose ps
  ```
- **Melihat log real-time aplikasi:**
  ```bash
  docker compose logs -f sipp-monitoring
  ```

### 6. Akses Aplikasi
Buka web browser dan akses:
```
http://localhost:3080
```
*(Port default host adalah `3080` sesuai konfigurasi di `docker-compose.yml`, atau sesuai variabel `PORT` yang Anda tentukan).*

Untuk memeriksa kesehatan aplikasi & koneksi database:
```
http://localhost:3080/api/health
```

### 7. Perintah Manajemen Docker Lainnya
- **Menghentikan aplikasi:**
  ```bash
  docker compose down
  ```
- **Restart aplikasi:**
  ```bash
  docker compose restart
  ```
- **Update kode dan build ulang:**
  ```bash
  git pull
  docker compose up -d --build
  ```

---

## 💻 Opsi 2: Instalasi Standalone (Direct Host / Bare Metal)

Metode ini cocok untuk lingkungan development lokal atau server Linux/Windows tanpa Docker.

### 1. Prasyarat
- **Node.js**: Versi `20.x` LTS atau `22.x` LTS ([Download Node.js](https://nodejs.org/))
- **npm**: Versi bawaan Node.js (v9 atau v10)
- **OpenSSL**: Terpasang di OS (diperlukan untuk Prisma Engine)
- **Database MySQL / MariaDB**: Service database SIPP aktif dan dapat dijangkau

### 2. Masuk ke Direktori `app`
Seluruh source code aplikasi berada di dalam subdirektori `app/`:

```bash
cd app
```

### 3. Siapkan File `.env`
Salin template konfigurasi ke dalam folder `app/`:

**Linux / macOS:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Edit file `app/.env` dan sesuaikan koneksi database Anda:
```env
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/sipppaju"
SIPP_BASE_URL="http://192.168.0.222/SIPP"
```

### 4. Install Dependensi
Jalankan instalasi dependensi (otomatis memicu `nuxt prepare` dan `prisma generate` via postinstall):

```bash
npm install
```

Jika ingin me-generate ulang Prisma Client secara manual:
```bash
npx prisma generate
```

---

### 5. Menjalankan Aplikasi

#### A. Mode Development (Pengembangan)
Jalankan server Nuxt dengan fitur hot-reload:
```bash
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:3000`

---

#### B. Mode Production (Standalone Server)

1. **Build Aplikasi:**
   Kompilasi source code menjadi bundle produksi:
   ```bash
   npm run build
   ```
   *(Hasil build tersimpan di folder `app/.output`)*

2. **Jalankan Server Produksi Langsung:**
   ```bash
   node .output/server/index.mjs
   ```

3. **Menjalankan dengan PM2 (Direkomendasikan untuk Server Standalone):**
   Gunakan [PM2](https://pm2.keymetrics.io/) agar aplikasi berjalan di background dan otomatis restart bila server reboot atau crash:
   ```bash
   # Install PM2 global (jika belum ada)
   npm install -g pm2

   # Jalankan aplikasi dengan nama 'sipp-monitoring'
   pm2 start .output/server/index.mjs --name "sipp-monitoring" --env PORT=3000

   # Simpan daftar proses agar otomatis aktif saat booting
   pm2 save
   pm2 startup
   ```

4. **Perintah Manajemen PM2:**
   - Cek status: `pm2 status`
   - Cek logs: `pm2 logs sipp-monitoring`
   - Restart: `pm2 restart sipp-monitoring`
   - Stop: `pm2 stop sipp-monitoring`

---

## 🔒 Konfigurasi Nginx Reverse Proxy (Opsional Produksi)

Jika Anda ingin mengakses aplikasi melalui domain / subdomain (misalnya `https://monitoring.pa-satker.go.id`), gunakan Nginx sebagai reverse proxy:

```nginx
server {
    listen 80;
    server_name monitoring.pa-satker.go.id;

    location / {
        # Jika menggunakan Docker (port 3080):
        proxy_pass http://127.0.0.1:3080;
        
        # Jika menggunakan Standalone / PM2 (port 3000):
        # proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🗄️ Database Sampel Pengujian

Jika Anda ingin menguji aplikasi di lingkungan lokal pengembang tanpa terhubung ke database server SIPP riil, repository ini menyertakan dump skema sampel `sipppaju.sql`:

1. Buat database baru di MySQL lokal:
   ```sql
   CREATE DATABASE sipppaju;
   ```
2. Import file SQL:
   ```bash
   mysql -u root -p sipppaju < sipppaju.sql
   ```
3. Arahkan `DATABASE_URL` ke database `sipppaju` tersebut.

---

## ❓ Troubleshooting & Pertanyaan Umum

### 1. Error: `Can't reach database server at host.docker.internal:3306`
- **Penyebab:** MySQL di host hanya mendengarkan loopback `127.0.0.1` atau firewall memblokir subnet Docker.
- **Solusi:**
  - Edit file konfigurasi MySQL (`my.cnf` / `my.ini`), pastikan `bind-address = 0.0.0.0`.
  - Pastikan user database memiliki izin akses dari subnet docker/remote:
    ```sql
    GRANT ALL PRIVILEGES ON sipp.* TO 'nama_user'@'%' IDENTIFIED BY 'password_user';
    FLUSH PRIVILEGES;
    ```
  - Pada Linux, bila `host.docker.internal` tidak terdeteksi, gunakan IP gateway interface docker (biasanya `172.17.0.1`).

### 2. Error: `PrismaClientInitializationError: Unable to require(...) libssl.so`
- **Penyebab:** OpenSSL belum terpasang di OS host (pada instalasi standalone).
- **Solusi:** Install paket OpenSSL:
  - Ubuntu/Debian: `sudo apt-get install -y openssl`
  - CentOS/RHEL: `sudo yum install openssl`

### 3. JavaScript heap out of memory saat `npm run build`
- **Penyebab:** Ukuran bundle Nuxt UI dan Prisma membutuhkan memori Node.js lebih dari 1.5 GB.
- **Solusi:** Parameter memori `--max-old-space-size=8192` sudah disertakan di `package.json`. Jika menjalankan build manual di mesin RAM terbatas, minimal gunakan 4096:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

---

## 📄 Lisensi & Kontribusi

Sistem ini dikembangkan untuk keperluan monitoring dan evaluasi penanganan perkara di lingkungan Peradilan Agama (Mahkamah Agung Republik Indonesia).
