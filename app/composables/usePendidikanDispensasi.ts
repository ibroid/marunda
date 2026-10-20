export interface PendidikanDispensasiDetailModalState {
  isOpen: boolean
  pendidikanId?: number | null
  pendidikanKode?: string
  pendidikanNama?: string
  kategori?: string
  totalCount?: number
}

export const usePendidikanDispensasi = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const namaSatker = useState<string>('pendidikanDispensasiNamaSatker', () => 'PENGADILAN AGAMA JAKARTA UTARA')

  // Filter state
  // 'all' = Semua Calon Mempelai, 'anak' = Anak Dimohonkan (< 19 Thn), 'pria' = Calon Suami (L), 'wanita' = Calon Istri (P)
  const selectedKategori = useState<string>('pendidikanDispensasiSelectedKategori', () => 'all')
  const selectedMonth = useState<string>('pendidikanDispensasiSelectedMonth', () => 'all') // 'all', '1'..'12'

  // Refresh signal untuk sinkronisasi tombol refresh di header
  const refreshSignal = useState<number>('pendidikanDispensasiRefreshSignal', () => 0)
  const loadingPerkaraId = useState<number | null>('pendidikanDispensasiLoadingPerkaraId', () => null)

  // Global state untuk modal detail perkara berdasarkan tingkat pendidikan (on-demand loading)
  const modalDetailState = useState<PendidikanDispensasiDetailModalState>('pendidikanDispensasiModalDetailState', () => ({
    isOpen: false,
    pendidikanId: null,
    pendidikanKode: '',
    pendidikanNama: '',
    kategori: 'all',
    totalCount: 0
  }))

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const resetFilter = () => {
    selectedKategori.value = 'all'
    selectedMonth.value = 'all'
  }

  const openDetailModal = (params: {
    pendidikanId?: number | null
    pendidikanKode?: string
    pendidikanNama?: string
    kategori?: string
    totalCount?: number
  }) => {
    modalDetailState.value = {
      isOpen: true,
      pendidikanId: params.pendidikanId !== undefined ? params.pendidikanId : null,
      pendidikanKode: params.pendidikanKode || '',
      pendidikanNama: params.pendidikanNama || (params.pendidikanId !== null ? `Pendidikan ID ${params.pendidikanId}` : 'Semua Tingkat Pendidikan'),
      kategori: params.kategori || selectedKategori.value || 'all',
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
    selectedKategori,
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
