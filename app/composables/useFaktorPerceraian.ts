export interface DetailModalState {
  isOpen: boolean
  faktorId?: number | null
  faktorNama?: string
  jenisCerai?: string
  totalCount?: number
}

export const useFaktorPerceraian = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const namaSatker = useState<string>('faktorNamaSatker', () => 'PENGADILAN AGAMA JAKARTA UTARA')

  // Filter state
  const selectedJenisCerai = useState<string>('faktorSelectedJenisCerai', () => 'all') // 'all', 'Cerai Gugat', 'Cerai Talak'
  const selectedMonth = useState<string>('faktorSelectedMonth', () => 'all') // 'all', '1'..'12'

  // Refresh signal untuk sinkronisasi tombol refresh di header
  const refreshSignal = useState<number>('faktorRefreshSignal', () => 0)
  const loadingPerkaraId = useState<number | null>('faktorLoadingPerkaraId', () => null)

  // Global state untuk modal detail (on-demand loading)
  const modalDetailState = useState<DetailModalState>('faktorModalDetailState', () => ({
    isOpen: false,
    faktorId: null,
    faktorNama: '',
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
    faktorId?: number | null
    faktorNama?: string
    jenisCerai?: string
    totalCount?: number
  }) => {
    modalDetailState.value = {
      isOpen: true,
      faktorId: params.faktorId ?? null,
      faktorNama: params.faktorNama || (params.faktorId ? `Faktor ID ${params.faktorId}` : 'Semua Faktor Perceraian'),
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
