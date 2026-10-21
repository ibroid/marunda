export const useAdvokat = () => {
  const searchQuery = useState<string>('advokatSearchQuery', () => '')
  const filterStatus = useState<string>('advokatFilterStatus', () => 'all') // all, with_cases, has_nia
  const sortBy = useState<string>('advokatSortBy', () => 'cases_desc') // cases_desc, name_asc, id_desc
  const page = useState<number>('advokatPage', () => 1)
  const limit = useState<number>('advokatLimit', () => 20)
  const isSearching = useState<boolean>('advokatIsSearching', () => false)

  // State untuk modal detail advokat
  const selectedAdvokatId = useState<number | null>('advokatSelectedId', () => null)
  const isDetailModalOpen = useState<boolean>('advokatIsDetailModalOpen', () => false)

  // Signal refresh global
  const refreshSignal = useState<number>('advokatRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const resetFilters = () => {
    searchQuery.value = ''
    filterStatus.value = 'all'
    sortBy.value = 'cases_desc'
    page.value = 1
  }

  const openDetail = (id: number) => {
    selectedAdvokatId.value = id
    isDetailModalOpen.value = true
  }

  const closeDetail = () => {
    isDetailModalOpen.value = false
    selectedAdvokatId.value = null
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
    filterStatus,
    sortBy,
    page,
    limit,
    isSearching,
    selectedAdvokatId,
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
