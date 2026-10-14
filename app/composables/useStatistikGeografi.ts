export const useStatistikGeografi = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const namaSatker = useState<string>('geografiNamaSatker', () => 'PENGADILAN AGAMA JAKARTA UTARA')

  // Filter state
  const selectedKecamatan = useState<string>('geografiSelectedKecamatan', () => '')
  const selectedKecamatanNama = useState<string>('geografiSelectedKecamatanNama', () => '')
  const selectedPihakType = useState<'pihak1' | 'pihak2' | 'semua'>('geografiSelectedPihakType', () => 'pihak1')
  const selectedAlurPerkara = useState<string>('geografiSelectedAlurPerkara', () => 'all')

  // Refresh signal untuk sinkronisasi tombol refresh di header
  const refreshSignal = useState<number>('geografiRefreshSignal', () => 0)
  const loadingPerkaraId = useState<number | null>('geografiLoadingPerkaraId', () => null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setKecamatanFilter = (kode: string, nama: string = '') => {
    if (selectedKecamatan.value === kode) {
      // Toggle off jika diklik ulang
      selectedKecamatan.value = ''
      selectedKecamatanNama.value = ''
    } else {
      selectedKecamatan.value = kode
      selectedKecamatanNama.value = nama || kode
    }
  }

  const setKecamatanDanAlur = (kode: string, nama: string = '', alur: string = 'all') => {
    selectedKecamatan.value = kode
    selectedKecamatanNama.value = nama || kode
    selectedAlurPerkara.value = alur
  }

  const resetFilter = () => {
    selectedKecamatan.value = ''
    selectedKecamatanNama.value = ''
    selectedAlurPerkara.value = 'all'
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
    selectedKecamatan,
    selectedKecamatanNama,
    selectedPihakType,
    selectedAlurPerkara,
    refreshSignal,
    loadingPerkaraId,
    triggerRefresh,
    setKecamatanFilter,
    setKecamatanDanAlur,
    resetFilter,
    formatNumber,
    formatDate,
    openSipp
  }
}
