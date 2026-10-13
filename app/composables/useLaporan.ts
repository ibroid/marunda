import * as XLSX from 'xlsx'

export interface LipaItem {
  id: string
  code: string
  title: string
  shortTitle: string
  category: 'keadaan' | 'upaya_hukum' | 'kinerja_hakim' | 'tematik' | 'keuangan' | 'bantuan_hukum' | 'rekapitulasi'
  isManualDipa?: boolean
  description: string
}

export const useLaporan = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const selectedMonth = useState<number>('laporan_selectedMonth', () => new Date().getMonth() + 1)
  const refreshSignal = useState<number>('laporan_refreshSignal', () => 0)

  // Tab Utama: 'katalog' (Cetak/Pratinjau) | 'input_manual' (Pagu & Data DIPA) | 'monitoring' (Checklist Pelaporan)
  const activeMainTab = useState<'katalog' | 'input_manual' | 'monitoring'>('laporan_activeMainTab', () => 'katalog')

  // Kode Laporan Aktif (default: lipa_1)
  const selectedLipa = useState<string>('laporan_selectedLipa', () => 'lipa_1')

  // Tab Input Manual Aktif ('pagu' | 'iwadl' | 'sidkel' | 'prodeo' | 'posbakum' | 'yandu')
  const activeManualTab = useState<string>('laporan_activeManualTab', () => 'pagu')

  // Shared state penampung data detail untuk keperluan ekspor
  const sharedReportData = useState<any>('laporan_sharedReportData', () => null)
  // Backward-compatibility: alias sharedLipa
  const sharedLipa = sharedReportData

  const monthOptions = [
    { label: 'Januari', value: 1 },
    { label: 'Februari', value: 2 },
    { label: 'Maret', value: 3 },
    { label: 'April', value: 4 },
    { label: 'Mei', value: 5 },
    { label: 'Juni', value: 6 },
    { label: 'Juli', value: 7 },
    { label: 'Agustus', value: 8 },
    { label: 'September', value: 9 },
    { label: 'Oktober', value: 10 },
    { label: 'November', value: 11 },
    { label: 'Desember', value: 12 }
  ]

  const lipaCatalog: LipaItem[] = [
    // 1. Keadaan & Penanganan Perkara
    {
      id: 'lipa_1',
      code: 'LIPA.1',
      title: 'Laporan Keadaan Perkara Tingkat Pertama',
      shortTitle: 'Keadaan Perkara (LIPA 1)',
      category: 'keadaan',
      description: 'Rekapitulasi sisa lalu, masuk, putus, minutasi, dan sisa perkara Gugatan, Permohonan, GS.'
    },
    {
      id: 'lipa_1_a',
      code: 'LIPA.1.A',
      title: 'Laporan Verzet Terhadap Putusan Verstek',
      shortTitle: 'Verzet Verstek (LIPA 1.A)',
      category: 'keadaan',
      description: 'Monitoring perkara perlawanan (verzet) atas putusan tanpa hadirnya tergugat (verstek).'
    },
    {
      id: 'lipa_20',
      code: 'LIPA.20',
      title: 'Laporan Tingkat Penyelesaian Perkara',
      shortTitle: 'Penyelesaian Perkara (LIPA 20)',
      category: 'keadaan',
      description: 'Distribusi kecepatan penanganan perkara (< 1 bulan, 1-3 bulan, 3-5 bulan, > 5 bulan).'
    },
    {
      id: 'lipa_23',
      code: 'LIPA.23',
      title: 'Laporan Perkara Belum Putus Lebih Dari 5 Bulan',
      shortTitle: 'Tunggakan > 5 Bulan (LIPA 23)',
      category: 'keadaan',
      description: 'Daftar perkara menunggak yang belum diputus melampaui standar waktu 5 bulan.'
    },

    // 2. Upaya Hukum & Eksekusi
    {
      id: 'lipa_2',
      code: 'LIPA.2',
      title: 'Laporan Perkara yang Dimohonkan Banding',
      shortTitle: 'Banding (LIPA 2)',
      category: 'upaya_hukum',
      description: 'Monitoring berkas permohonan banding, inzage, pengiriman berkas, dan putusan banding PTA.'
    },
    {
      id: 'lipa_3',
      code: 'LIPA.3',
      title: 'Laporan Perkara yang Dimohonkan Kasasi',
      shortTitle: 'Kasasi (LIPA 3)',
      category: 'upaya_hukum',
      description: 'Monitoring permohonan kasasi, memori/kontra memori, pengiriman berkas ke Mahkamah Agung.'
    },
    {
      id: 'lipa_4',
      code: 'LIPA.4',
      title: 'Laporan Perkara Peninjauan Kembali (PK)',
      shortTitle: 'Peninjauan Kembali (LIPA 4)',
      category: 'upaya_hukum',
      description: 'Monitoring pengajuan upaya hukum luar biasa Peninjauan Kembali ke Mahkamah Agung.'
    },
    {
      id: 'lipa_5',
      code: 'LIPA.5',
      title: 'Laporan Perkara yang Dimohonkan Eksekusi',
      shortTitle: 'Eksekusi (LIPA 5)',
      category: 'upaya_hukum',
      description: 'Monitoring permohonan eksekusi putusan, aanmaning, sita eksekusi, dan pelaksanaan lelang.'
    },

    // 3. Kinerja Hakim & Mediasi
    {
      id: 'lipa_6',
      code: 'LIPA.6',
      title: 'Laporan Kegiatan Majelis Hakim',
      shortTitle: 'Kegiatan Hakim (LIPA 6)',
      category: 'kinerja_hakim',
      description: 'Rekap beban kerja, perkara putus, dan produktivitas masing-masing Hakim Pengadilan.'
    },
    {
      id: 'lipa_12',
      code: 'LIPA.12',
      title: 'Laporan Pelaksanaan Mediasi',
      shortTitle: 'Mediasi (LIPA 12)',
      category: 'kinerja_hakim',
      description: 'Statistik hasil mediasi perkara (berhasil, berhasil sebagian, tidak berhasil, tidak dapat dilaksanakan).'
    },
    {
      id: 'lipa_19',
      code: 'LIPA.19',
      title: 'Laporan Minutasi Perkara',
      shortTitle: 'Minutasi (LIPA 19)',
      category: 'kinerja_hakim',
      description: 'Kecepatan penyelesaian berkas minutasi perkara setelah tanggal sidang putusan.'
    },

    // 4. Tematik Perkara & Perceraian
    {
      id: 'lipa_8',
      code: 'LIPA.8',
      title: 'Laporan Perkara Diterima, Dicabut, dan Diputus Menurut Jenis Perkara',
      shortTitle: 'Menurut Jenis (LIPA 8)',
      category: 'tematik',
      description: 'Klasifikasi rincian perkara masuk, cabut, dan putus berdasarkan kode klasifikasi perkara.'
    },
    {
      id: 'lipa_9',
      code: 'LIPA.9',
      title: 'Laporan Perkara Khusus Izin PNS (PP 10/1983 jo PP 45/1990)',
      shortTitle: 'Izin PNS (LIPA 9)',
      category: 'tematik',
      description: 'Monitoring perkara perceraian yang melibatkan Pegawai Negeri Sipil / Aparatur Negara.'
    },
    {
      id: 'lipa_10',
      code: 'LIPA.10',
      title: 'Laporan Penyebab Terjadinya Perceraian',
      shortTitle: 'Faktor Perceraian (LIPA 10)',
      category: 'tematik',
      description: 'Rekapitulasi 14 faktor penyebab perceraian (ekonomi, perselisihan, judi, KDRT, dll.).'
    },
    {
      id: 'lipa_13',
      code: 'LIPA.13',
      title: 'Laporan Penerbitan Akta Cerai',
      shortTitle: 'Penerbitan AC (LIPA 13)',
      category: 'tematik',
      description: 'Pencatatan penerbitan Akta Cerai resmi Cerai Gugat dan Cerai Talak.'
    },
    {
      id: 'lipa_25',
      code: 'LIPA.25',
      title: 'Laporan Penyerahan Akta Cerai Kepada Pihak',
      shortTitle: 'Penyerahan AC (LIPA 25)',
      category: 'tematik',
      description: 'Monitoring penyerahan fisik Akta Cerai kepada para pihak berperkara.'
    },
    {
      id: 'lipa_26',
      code: 'LIPA.26',
      title: 'Laporan Perkara Ekonomi Syariah',
      shortTitle: 'Ekonomi Syariah (LIPA 26)',
      category: 'tematik',
      description: 'Monitoring penanganan perkara sengketa perbankan dan muamalah Ekonomi Syariah.'
    },

    // 5. Keuangan Perkara & HHK
    {
      id: 'lipa_7',
      code: 'LIPA.7',
      title: 'Laporan Keuangan Biaya Perkara',
      shortTitle: 'Keuangan Perkara (LIPA 7)',
      category: 'keuangan',
      description: 'Rekapitulasi penerimaan, pengeluaran kas perkara, dan saldo akhir bulan.'
    },
    {
      id: 'lipa_17',
      code: 'LIPA.17',
      title: 'Laporan Penerimaan Hak-Hak Kepaniteraan (HHK)',
      shortTitle: 'Penerimaan HHK (LIPA 17)',
      category: 'keuangan',
      description: 'Pencatatan PNBP Hak-Hak Kepaniteraan yang disetor ke kas negara.'
    },
    {
      id: 'lipa_18',
      code: 'LIPA.18',
      title: 'Laporan Penerimaan Hak-Hak Kepaniteraan Lainnya (HHKL)',
      shortTitle: 'Penerimaan HHKL (LIPA 18)',
      category: 'keuangan',
      description: 'Pencatatan PNBP lainnya di luar tarif reguler kepaniteraan.'
    },

    // 6. Bantuan Hukum, DIPA & Delegasi
    {
      id: 'lipa_11',
      code: 'LIPA.11',
      title: 'Laporan Pertanggungjawaban Uang Iwadl',
      shortTitle: 'Uang Iwadl (LIPA 11)',
      category: 'bantuan_hukum',
      isManualDipa: true,
      description: 'Penerimaan dan penyetoran uang Iwadl ke Rekening BAZNAS.'
    },
    {
      id: 'lipa_14',
      code: 'LIPA.14',
      title: 'Laporan Pelaksanaan Sidang di Luar Gedung Pengadilan',
      shortTitle: 'Sidang Keliling (LIPA 14)',
      category: 'bantuan_hukum',
      isManualDipa: true,
      description: 'Realisasi anggaran DIPA 04 dan pelaksanaan kegiatan sidang keliling.'
    },
    {
      id: 'lipa_15',
      code: 'LIPA.15',
      title: 'Laporan Pelaksanaan Pembebasan Biaya Perkara (Prodeo)',
      shortTitle: 'Prodeo DIPA (LIPA 15)',
      category: 'bantuan_hukum',
      isManualDipa: true,
      description: 'Realisasi anggaran pembebasan biaya perkara bagi masyarakat tidak mampu.'
    },
    {
      id: 'lipa_16',
      code: 'LIPA.16',
      title: 'Laporan Pelaksanaan Pos Bantuan Hukum (Posbakum)',
      shortTitle: 'Posbakum (LIPA 16)',
      category: 'bantuan_hukum',
      isManualDipa: true,
      description: 'Realisasi anggaran dan jumlah layanan konsultasi hukum masyarakat di Posbakum.'
    },
    {
      id: 'lipa_22',
      code: 'LIPA.22',
      title: 'Laporan Penanganan Bantuan Panggilan / Pemberitahuan (Delegasi)',
      shortTitle: 'Bantuan Delegasi (LIPA 22)',
      category: 'bantuan_hukum',
      description: 'Monitoring delegasi panggilan dan pemberitahuan keluar dan masuk antar-satker.'
    },
    {
      id: 'lipa_27',
      code: 'LIPA.27',
      title: 'Laporan Pelaksanaan Pelayanan Terpadu',
      shortTitle: 'Pelayanan Terpadu (LIPA 27)',
      category: 'bantuan_hukum',
      isManualDipa: true,
      description: 'Pelaksanaan sidang isbat nikah terpadu bersama Kemenag (KUA) dan Disdukcapil.'
    },

    // 7. Rekapitulasi Laporan (RK)
    {
      id: 'rk3',
      code: 'RK.3',
      title: 'Rekapitulasi Perkara Tingkat Pertama yang Diterima',
      shortTitle: 'Perkara Diterima (RK 3)',
      category: 'rekapitulasi',
      description: 'Rekap bulanan perkara masuk tingkat pertama menurut jenis perkara.'
    },
    {
      id: 'rk4',
      code: 'RK.4',
      title: 'Rekapitulasi Perkara Tingkat Pertama yang Diputus',
      shortTitle: 'Perkara Diputus (RK 4)',
      category: 'rekapitulasi',
      description: 'Rekap bulanan perkara putus tingkat pertama menurut jenis perkara.'
    },
    {
      id: 'rk7',
      code: 'RK.7',
      title: 'Rekapitulasi Keuangan Perkara Bulanan',
      shortTitle: 'Rekap Keuangan (RK 7)',
      category: 'rekapitulasi',
      description: 'Ikhtisar pergerakan saldo kas perkara tingkat pertama dan upaya hukum.'
    },
    {
      id: 'rk9',
      code: 'RK.9',
      title: 'Rekapitulasi Upaya Hukum (Banding, Kasasi, PK, Eksekusi)',
      shortTitle: 'Rekap Upaya Hukum (RK 9)',
      category: 'rekapitulasi',
      description: 'Matriks gabungan keadaan perkara yang dimohonkan upaya hukum dan eksekusi.'
    }
  ]

  const activeLipaItem = computed(() => {
    return lipaCatalog.find(l => l.id === selectedLipa.value) || lipaCatalog[0]
  })

  const selectedMonthLabel = computed(() => {
    const match = monthOptions.find(m => m.value === selectedMonth.value)
    return match ? match.label : ''
  })

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const exportExcel = () => {
    if (!sharedReportData.value) return

    const data = sharedReportData.value
    const currentItem = activeLipaItem.value
    let rows: any[] = []

    // Export generator menyesuaikan jenis laporan yang sedang aktif
    if (data.rows && Array.isArray(data.rows)) {
      rows = data.rows
    } else if (data.matriks && Array.isArray(data.matriks)) {
      rows = data.matriks
    } else if (data.gugatan && data.permohonan) {
      // Default LIPA 1
      rows = [
        {
          'Jenis Alur': 'Gugatan (Pdt.G)',
          'Sisa Lalu': data.gugatan?.sisaLalu || 0,
          'Diterima': data.gugatan?.masuk || 0,
          'Total Beban': data.gugatan?.totalBeban || 0,
          'Diputus': data.gugatan?.putus || 0,
          'Minutasi': data.gugatan?.minutasi || 0,
          'Sisa Akhir': data.gugatan?.sisaAkhir || 0,
          'Rasio Putus (%)': data.gugatan?.rasio || 0
        },
        {
          'Jenis Alur': 'Permohonan (Pdt.P)',
          'Sisa Lalu': data.permohonan?.sisaLalu || 0,
          'Diterima': data.permohonan?.masuk || 0,
          'Total Beban': data.permohonan?.totalBeban || 0,
          'Diputus': data.permohonan?.putus || 0,
          'Minutasi': data.permohonan?.minutasi || 0,
          'Sisa Akhir': data.permohonan?.sisaAkhir || 0,
          'Rasio Putus (%)': data.permohonan?.rasio || 0
        },
        {
          'Jenis Alur': 'Gugatan Sederhana (Pdt.GS)',
          'Sisa Lalu': data.gugatanSederhana?.sisaLalu || 0,
          'Diterima': data.gugatanSederhana?.masuk || 0,
          'Total Beban': data.gugatanSederhana?.totalBeban || 0,
          'Diputus': data.gugatanSederhana?.putus || 0,
          'Minutasi': data.gugatanSederhana?.minutasi || 0,
          'Sisa Akhir': data.gugatanSederhana?.sisaAkhir || 0,
          'Rasio Putus (%)': data.gugatanSederhana?.rasio || 0
        },
        {
          'Jenis Alur': 'TOTAL KESELURUHAN',
          'Sisa Lalu': data.total?.sisaLalu || 0,
          'Diterima': data.total?.masuk || 0,
          'Total Beban': data.total?.totalBeban || 0,
          'Diputus': data.total?.putus || 0,
          'Minutasi': data.total?.minutasi || 0,
          'Sisa Akhir': data.total?.sisaAkhir || 0,
          'Rasio Putus (%)': data.total?.rasio || 0
        }
      ]
    }

    if (!rows.length) return

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, currentItem.code)
    XLSX.writeFile(
      workbook,
      `${currentItem.code.replace('.', '_')}_${selectedYear.value}_Bulan_${selectedMonth.value}.xlsx`
    )
  }

  return {
    selectedYear,
    selectedMonth,
    refreshSignal,
    activeMainTab,
    selectedLipa,
    activeManualTab,
    sharedReportData,
    sharedLipa,
    lipaCatalog,
    activeLipaItem,
    monthOptions,
    selectedMonthLabel,
    triggerRefresh,
    exportExcel
  }
}
