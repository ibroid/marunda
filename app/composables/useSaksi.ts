export const useSaksi = () => {
  const searchQuery = useState<string>('saksiSearchQuery', () => '')
  const searchBy = useState<string>('saksiSearchBy', () => 'semua')
  const saksiPihakKe = useState<string>('saksiPihakKe', () => 'all')
  const jenisSaksi = useState<string>('saksiJenisSaksi', () => 'all')
  const jenisKelamin = useState<string>('saksiJenisKelamin', () => 'all')
  const selectedYear = useState<string>('saksiSelectedYear', () => 'all')
  const hasKeterangan = useState<string>('saksiHasKeterangan', () => 'all')
  const sortBy = useState<string>('saksiSortBy', () => 'id_desc')
  const page = useState<number>('saksiPage', () => 1)
  const limit = useState<number>('saksiLimit', () => 20)
  const isSearching = useState<boolean>('saksiIsSearching', () => false)

  // State untuk modal detail saksi
  const selectedSaksiId = useState<number | null>('saksiSelectedId', () => null)
  const isDetailModalOpen = useState<boolean>('saksiIsDetailModalOpen', () => false)

  // Signal refresh global
  const refreshSignal = useState<number>('saksiRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const resetFilters = () => {
    searchQuery.value = ''
    searchBy.value = 'semua'
    saksiPihakKe.value = 'all'
    jenisSaksi.value = 'all'
    jenisKelamin.value = 'all'
    selectedYear.value = 'all'
    hasKeterangan.value = 'all'
    sortBy.value = 'id_desc'
    page.value = 1
  }

  const openDetail = (id: number) => {
    selectedSaksiId.value = id
    isDetailModalOpen.value = true
  }

  const closeDetail = () => {
    isDetailModalOpen.value = false
    selectedSaksiId.value = null
  }

  const getSaksiPihakLabel = (pihakKe?: number | null) => {
    if (pihakKe === 1) return 'Saksi Penggugat / Pemohon'
    if (pihakKe === 2) return 'Saksi Tergugat / Termohon'
    return 'Saksi Perkara'
  }

  const getJenisSaksiLabel = (jenis?: string | null) => {
    if (jenis === '2') return 'Saksi Ahli'
    return 'Saksi Fakta'
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    searchQuery,
    searchBy,
    saksiPihakKe,
    jenisSaksi,
    jenisKelamin,
    selectedYear,
    hasKeterangan,
    sortBy,
    page,
    limit,
    isSearching,
    selectedSaksiId,
    isDetailModalOpen,
    refreshSignal,
    triggerRefresh,
    resetFilters,
    openDetail,
    closeDetail,
    getSaksiPihakLabel,
    getJenisSaksiLabel,
    formatDate,
    formatDateTime
  }
}
