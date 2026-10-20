export interface PekerjaanDetailModalState {
  isOpen: boolean
  pekerjaan?: string | null
  pekerjaanNama?: string
  jenisCerai?: string
  totalCount?: number
}

export const usePekerjaanPerceraian = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const namaSatker = useState<string>('pekerjaanNamaSatker', () => 'PENGADILAN AGAMA JAKARTA UTARA')

  // Filter state
  const selectedJenisCerai = useState<string>('pekerjaanSelectedJenisCerai', () => 'all') // 'all', 'Cerai Gugat', 'Cerai Talak'
  const selectedMonth = useState<string>('pekerjaanSelectedMonth', () => 'all') // 'all', '1'..'12'

  // Refresh signal untuk sinkronisasi tombol refresh di header
  const refreshSignal = useState<number>('pekerjaanRefreshSignal', () => 0)
  const loadingPerkaraId = useState<number | null>('pekerjaanLoadingPerkaraId', () => null)

  // Global state untuk modal detail perkara berdasarkan pekerjaan (on-demand loading)
  const modalDetailState = useState<PekerjaanDetailModalState>('pekerjaanModalDetailState', () => ({
    isOpen: false,
    pekerjaan: null,
    pekerjaanNama: '',
    jenisCerai: 'all',
    totalCount: 0
  }))

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const resetFilter = () => {
    selectedJenisCerai.value = 'all'
    selectedMonth.value = 'all'
  }

  const openDetailModal = (params: {
    pekerjaan?: string | null
    pekerjaanNama?: string
    jenisCerai?: string
    totalCount?: number
  }) => {
    modalDetailState.value = {
      isOpen: true,
      pekerjaan: params.pekerjaan !== undefined ? params.pekerjaan : null,
      pekerjaanNama: params.pekerjaanNama || (params.pekerjaan ? params.pekerjaan : 'Semua Profesi / Pekerjaan'),
      jenisCerai: params.jenisCerai || selectedJenisCerai.value || 'all',
      totalCount: params.totalCount || 0
    }
  }

  const closeDetailModal = () => {
    modalDetailState.value.isOpen = false
  }

  const formatNumber = (val?: number | string | null) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0'
    return Number(val).toLocaleString('id-ID')
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const openSipp = async (perkaraId: number) => {
    const width = 1200
    const height = 800
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=yes`
    const windowName = `sipp_perkara_${perkaraId}`

    const newWindow = window.open('about:blank', windowName, windowFeatures)
    loadingPerkaraId.value = perkaraId

    try {
      const res = await $fetch<{ url?: string; message?: string }>('/api/sipp/encrypt', {
        method: 'POST',
        body: { perkara_id: perkaraId }
      })

      if (res?.url && newWindow) {
        newWindow.location.href = res.url
      } else if (newWindow) {
        newWindow.close()
      }
    } catch (e: any) {
      if (newWindow) newWindow.close()
      console.error('Gagal membuka SIPP:', e)
    } finally {
      loadingPerkaraId.value = null
    }
  }

  return {
    selectedYear,
    namaSatker,
    selectedJenisCerai,
    selectedMonth,
    refreshSignal,
    loadingPerkaraId,
    modalDetailState,
    triggerRefresh,
    resetFilter,
    openDetailModal,
    closeDetailModal,
    formatNumber,
    formatDate,
    openSipp
  }
}
