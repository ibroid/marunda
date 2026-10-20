import * as XLSX from 'xlsx'

export interface KeuanganMenuItem {
  slug: string
  label: string
  kategoriId?: number
  icon: string
  deskripsi: string
  endpoint: string
}

export const KEUANGAN_HARIAN_MENUS: KeuanganMenuItem[] = [
  {
    slug: 'rekap',
    label: 'Rekap Transaksi Harian',
    icon: 'i-heroicons-document-chart-bar',
    deskripsi: 'Buku kas pembantu penerimaan dan pengeluaran uang serta rekapitulasi saldo kas perkara.',
    endpoint: '/api/keuangan-harian/rekap'
  },
  {
    slug: 'transaksi',
    label: 'Transaksi Harian',
    icon: 'i-heroicons-arrows-right-left',
    deskripsi: 'Daftar keseluruhan mutasi transaksi keuangan perkara pada tanggal yang dipilih.',
    endpoint: '/api/keuangan-harian/transaksi'
  },
  {
    slug: 'panjar',
    label: 'Transaksi Panjar',
    kategoriId: 1,
    icon: 'i-heroicons-arrow-down-tray',
    deskripsi: 'Rincian transaksi penerimaan panjar dan tambah panjar perkara.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'pnbp',
    label: 'Transaksi PNBP',
    kategoriId: 11,
    icon: 'i-heroicons-building-library',
    deskripsi: 'Rincian transaksi pengeluaran Pendapatan Negara Bukan Pajak (PNBP).',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'atk',
    label: 'Transaksi ATK',
    kategoriId: 12,
    icon: 'i-heroicons-pencil-square',
    deskripsi: 'Rincian transaksi biaya proses, ATK, dan pemberkasan perkara.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'panggilan',
    label: 'Transaksi Panggilan',
    kategoriId: 4,
    icon: 'i-heroicons-megaphone',
    deskripsi: 'Rincian transaksi biaya panggilan para pihak dan saksi.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'pemberitahuan',
    label: 'Transaksi Pemberitahuan',
    kategoriId: 6,
    icon: 'i-heroicons-envelope',
    deskripsi: 'Rincian transaksi biaya pemberitahuan isi putusan/penetapan kepada para pihak.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'materai',
    label: 'Transaksi Materai',
    kategoriId: 8,
    icon: 'i-heroicons-tag',
    deskripsi: 'Rincian transaksi biaya materai perkara.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'sisa-panjar',
    label: 'Pengembalian Sisa Panjar',
    kategoriId: 2,
    icon: 'i-heroicons-arrow-uturn-left',
    deskripsi: 'Rincian transaksi pengembalian sisa panjar biaya perkara kepada para pihak.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'pengiriman',
    label: 'Transaksi Pengiriman',
    kategoriId: 3,
    icon: 'i-heroicons-truck',
    deskripsi: 'Rincian transaksi biaya pengiriman berkas / wesel pos / ekspedisi.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'pemeriksaan-setempat',
    label: 'Transaksi Pemeriksaan Setempat',
    kategoriId: 7,
    icon: 'i-heroicons-map-pin',
    deskripsi: 'Rincian transaksi biaya pemeriksaan setempat (descente / PS).',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'sita',
    label: 'Transaksi Sita',
    kategoriId: 5,
    icon: 'i-heroicons-lock-closed',
    deskripsi: 'Rincian transaksi biaya pelaksanaan sita jaminan / sita eksekusi.',
    endpoint: '/api/keuangan-harian/kategori'
  },
  {
    slug: 'hhk',
    label: 'Hak-hak kepaniteraan',
    kategoriId: 13,
    icon: 'i-heroicons-scale',
    deskripsi: 'Rincian transaksi setoran hak-hak kepaniteraan (HHK).',
    endpoint: '/api/keuangan-harian/kategori'
  }
]

export const useKeuanganHarian = () => {
  // Aturan user: default belum memilih tanggal (null / empty), jangan tampilkan apa-apa
  const selectedDate = useState<string | null>('keuanganHarianSelectedDate', () => null)
  const refreshSignal = useState<number>('keuanganHarianRefreshSignal', () => 0)
  const filterKodePnbp = useState<string>('keuanganHarianFilterKodePnbp', () => '')

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setPresetToday = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    selectedDate.value = `${y}-${m}-${d}`
  }

  const setPresetYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y = yesterday.getFullYear()
    const m = String(yesterday.getMonth() + 1).padStart(2, '0')
    const d = String(yesterday.getDate()).padStart(2, '0')
    selectedDate.value = `${y}-${m}-${d}`
  }

  const resetDate = () => {
    selectedDate.value = null
  }

  const formatRupiah = (val: number | string | null | undefined) => {
    const num = Number(val || 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr || '-'
    }
  }

  const formatDateLong = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr || '-'
    }
  }

  const exportExcel = (filename: string, rows: any[]) => {
    if (!rows || rows.length === 0) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const printWindow = () => {
    if (import.meta.client) {
      window.print()
    }
  }

  return {
    menus: KEUANGAN_HARIAN_MENUS,
    selectedDate,
    refreshSignal,
    filterKodePnbp,
    triggerRefresh,
    setPresetToday,
    setPresetYesterday,
    resetDate,
    formatRupiah,
    formatDate,
    formatDateLong,
    exportExcel,
    printWindow
  }
}
