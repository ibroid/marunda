# Panduan Arsitektur & Aturan Pengembangan (Monev SIPP)

## 🏛️ Pola Arsitektur Standar: Modular Component-Driven Data Fetching

Di project ini, **semua halaman lama maupun halaman baru di masa depan WAJIB menerapkan konsep pemuatan data terdistribusi per-komponen secara paralel**, mengadopsi standar yang sudah terbukti efektif di `/dashboard/ketua` dan `/dashboard/panitera`.

### 1. Larangan Monolithic Endpoint
- **DILARANG** membuat 1 endpoint API raksasa yang menggabungkan semua kueri SQL/data untuk seluruh halaman.
- Endpoint raksasa menyebabkan *blocking*, Time to First Paint lambat karena menunggu kueri terberat, serta rapuh terhadap error (satu query error, seluruh halaman gagal render).

### 2. Tiga Pilar Arsitektur

#### A. Composable Terpadu (`app/composables/use<NamaHalaman>.ts`)
- Berisi state global/filter untuk halaman tersebut (misal: `selectedYear`, filter tanggal, satker, pagination state).
- Menyediakan `refreshSignal = useState(...)` dan fungsi `triggerRefresh()` untuk sinkronisasi tombol "Perbarui Data" di header.
- Menampung shared reactive state jika satu komponen menyediakan data agregat yang dikonsumsi komponen lain (misal: `sharedAging` di Ketua).

#### B. Komponen Mandiri & Skeleton Loading (`app/components/<halaman>/...`)
- Halaman `pages/<halaman>.vue` hanya berfungsi sebagai orkestrator tata letak (grid / layout).
- Setiap blok visual (Header Banner, KPI Cards, Grafik, Tabel, Atensi/EWS, Modal) dijadikan komponen tersendiri di `app/components/<halaman>/<NamaKomponen>.vue`.
- Setiap komponen melakukan fetch secara mandiri menggunakan:
  ```ts
  const { data, pending, refresh } = useLazyFetch('/api/<halaman>/<fitur>', {
    server: false,
    query: computed(() => ({ ... })),
    watch: [...],
    default: () => null
  })
  ```
- Setiap komponen **wajib** memiliki skeleton loader (`USkeleton`) ketika `isLoading` (yaitu `pending || !data`).
- Komponen memantau `refreshSignal` untuk me-refresh datanya sendiri saat user menekan refresh.

#### C. Endpoint API Terpisah & Ringan (`app/server/api/<halaman>/...`)
- Dipecah menjadi route mandiri per kebutuhan komponen:
  - `summary.get.ts` (KPI angka agregat cepat)
  - `atensi.get.ts` (Peringatan dini / EWS)
  - `grafik.get.ts` / `chart.get.ts` (Data komparasi deret waktu/bulanan)
  - `table.get.ts` / `list.get.ts` (Daftar rincian perkara / pagination)
- Kueri SQL fokus, ringan, dan dieksekusi paralel oleh database connection pool.
