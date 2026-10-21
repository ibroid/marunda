export const usePrincipal = () => {
  const searchQuery = useState<string>('principalSearchQuery', () => '')
  const searchBy = useState<string>('principalSearchBy', () => 'semua')
  const jenisPihak = useState<string>('principalJenisPihak', () => 'all')
  const jenisKelamin = useState<string>('principalJenisKelamin', () => 'all')
  const page = useState<number>('principalPage', () => 1)
  const limit = useState<number>('principalLimit', () => 20)
  const isSearching = useState<boolean>('principalIsSearching', () => false)

  // State untuk modal detail pihak
  const selectedPihakId = useState<number | null>('principalSelectedPihakId', () => null)
  const isDetailModalOpen = useState<boolean>('principalIsDetailModalOpen', () => false)

  // Signal refresh global
  const refreshSignal = useState<number>('principalRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const resetFilters = () => {
    searchQuery.value = ''
    searchBy.value = 'semua'
    jenisPihak.value = 'all'
    jenisKelamin.value = 'all'
    page.value = 1
  }

  const openDetail = (id: number) => {
    selectedPihakId.value = id
    isDetailModalOpen.value = true
  }

  const closeDetail = () => {
    isDetailModalOpen.value = false
    selectedPihakId.value = null
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
    jenisPihak,
    jenisKelamin,
    page,
    limit,
    isSearching,
    selectedPihakId,
    isDetailModalOpen,
    refreshSignal,
    triggerRefresh,
    resetFilters,
    openDetail,
    closeDetail,
    formatDate,
    formatDateTime
  }
}
