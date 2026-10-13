export const useKontrolBerkasPenetapan = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // State global halaman kontrol berkas penetapan
  // selectedMonth: null = belum filter, 0 = seluruh bulan / 1 tahun penuh, 1-12 = bulan tertentu
  const selectedMonth = useState<number | null>('kontrolBerkasMonth', () => null)
  const selectedYear = useState<number>('kontrolBerkasYear', () => currentYear)
  const isFilterApplied = useState<boolean>('kontrolBerkasFilterApplied', () => false)
  const activeKategori = useState<string>('kontrolBerkasActiveKategori', () => 'semua_belum')
  const searchQuery = useState<string>('kontrolBerkasSearch', () => '')
  const currentPage = useState<number>('kontrolBerkasPage', () => 1)
  const refreshSignal = useState<number>('kontrolBerkasRefreshSignal', () => 0)

  // Temporary state untuk form filter sebelum tombol 'Tampilkan Data' diklik
  const tempMonth = useState<number>('kontrolBerkasTempMonth', () => currentMonth)
  const tempYear = useState<number>('kontrolBerkasTempYear', () => currentYear)

  const monthOptions = [
    { label: 'Semua Bulan (1 Tahun Penuh)', value: 0 },
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

  const yearOptions = [
    { label: `${currentYear}`, value: currentYear },
    { label: `${currentYear - 1}`, value: currentYear - 1 },
    { label: `${currentYear - 2}`, value: currentYear - 2 },
    { label: `${currentYear - 3}`, value: currentYear - 3 },
    { label: `${currentYear - 4}`, value: currentYear - 4 }
  ]

  const applyFilter = (month: number, year: number) => {
    selectedMonth.value = month
    selectedYear.value = year
    tempMonth.value = month
    tempYear.value = year
    isFilterApplied.value = true
    currentPage.value = 1
    refreshSignal.value++
  }

  const triggerRefresh = () => {
    if (isFilterApplied.value) {
      refreshSignal.value++
    }
  }

  const resetFilter = () => {
    isFilterApplied.value = false
    selectedMonth.value = null
  }

  const setKategori = (kategori: string) => {
    activeKategori.value = kategori
    currentPage.value = 1
  }

  const getMonthLabel = (m?: number | null) => {
    if (m === null || m === undefined) return ''
    if (m === 0) return 'Semua Bulan'
    const found = monthOptions.find(item => item.value === m)
    return found ? found.label : `Bulan ${m}`
  }

  const formatMonthYear = (m?: number | null, y?: number | null) => {
    if (m === null || m === undefined || !y) return '-'
    if (m === 0) return `Tahun ${y} (Semua Bulan)`
    return `${getMonthLabel(m)} ${y}`
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return {
    selectedMonth,
    selectedYear,
    tempMonth,
    tempYear,
    isFilterApplied,
    activeKategori,
    searchQuery,
    currentPage,
    refreshSignal,
    monthOptions,
    yearOptions,
    applyFilter,
    triggerRefresh,
    resetFilter,
    setKategori,
    getMonthLabel,
    formatMonthYear,
    formatDate
  }
}
