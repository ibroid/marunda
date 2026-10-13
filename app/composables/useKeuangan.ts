import * as XLSX from 'xlsx'

export const useKeuangan = () => {
  const today = new Date().toISOString().split('T')[0]
  const tglAwal = useState<string>('keuanganTglAwal', () => today)
  const tglAkhir = useState<string>('keuanganTglAkhir', () => today)
  const refreshSignal = useState<number>('keuanganRefreshSignal', () => 0)
  const sharedTransaksi = useState<any[]>('keuanganSharedTransaksi', () => [])

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setPreset = (preset: 'hari_ini' | 'bulan_ini' | 'tahun_ini') => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')

    if (preset === 'hari_ini') {
      const todayStr = `${y}-${m}-${d}`
      tglAwal.value = todayStr
      tglAkhir.value = todayStr
    } else if (preset === 'bulan_ini') {
      tglAwal.value = `${y}-${m}-01`
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      tglAkhir.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    } else if (preset === 'tahun_ini') {
      tglAwal.value = `${y}-01-01`
      tglAkhir.value = `${y}-12-31`
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const exportExcel = () => {
    const rows = sharedTransaksi.value.map((item, idx) => ({
      No: idx + 1,
      Tanggal: formatDate(item.tanggal),
      'Nomor Perkara': item.nomorPerkara,
      Kode: item.kode,
      Uraian: item.uraian,
      'Penerimaan (Rp)': item.penerimaan,
      'Pengeluaran (Rp)': item.pengeluaran
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Kas Bantu')
    XLSX.writeFile(wb, `Buku_Kas_Bantu_${tglAwal.value}_sd_${tglAkhir.value}.xlsx`)
  }

  return {
    tglAwal,
    tglAkhir,
    refreshSignal,
    sharedTransaksi,
    triggerRefresh,
    setPreset,
    formatRupiah,
    formatDate,
    exportExcel
  }
}
