export const useDashboardPanitera = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const namaSatker = useState<string>('paniteraNamaSatker', () => 'PENGADILAN AGAMA')
  const refreshSignal = useState<number>('paniteraRefreshSignal', () => 0)
  const isModalMinutasiOpen = useState<boolean>('paniteraModalMinutasiOpen', () => false)
  const totalMinutasiCases = useState<number>('paniteraTotalMinutasiCases', () => 0)
  const isModalPbtOpen = useState<boolean>('paniteraModalPbtOpen', () => false)
  const totalPbtCases = useState<number>('paniteraTotalPbtCases', () => 0)
  const loadingPerkaraId = ref<number | null>(null)
  const toast = useToast()

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const openModalMinutasi = (total?: number) => {
    if (typeof total === 'number') {
      totalMinutasiCases.value = total
    }
    isModalMinutasiOpen.value = true
  }

  const closeModalMinutasi = () => {
    isModalMinutasiOpen.value = false
  }

  const openModalPbt = (total?: number) => {
    if (typeof total === 'number') {
      totalPbtCases.value = total
    }
    isModalPbtOpen.value = true
  }

  const closeModalPbt = () => {
    isModalPbtOpen.value = false
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const cleanHtml = (htmlStr?: string | null) => {
    if (!htmlStr) return '-'
    return htmlStr.replace(/<br\s*\/?>/gi, ', ').replace(/<[^>]+>/g, '').trim()
  }

  const openSipp = async (perkaraId?: number) => {
    if (!perkaraId) {
      toast.add({
        title: 'Perhatian',
        description: 'ID Perkara tidak ditemukan.',
        color: 'amber'
      })
      return
    }

    const width = Math.min(1280, Math.floor(window.screen.availWidth * 0.9))
    const height = Math.min(850, Math.floor(window.screen.availHeight * 0.9))
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2))
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2))
    const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=yes`
    const windowName = `sipp_perkara_${perkaraId}`

    const newWindow = window.open('about:blank', windowName, windowFeatures)
    loadingPerkaraId.value = perkaraId

    try {
      const res = await $fetch<{ url?: string; message?: string }>('/api/sipp/encrypt', {
        method: 'POST',
        body: {
          perkara_id: perkaraId
        }
      })

      if (res?.url) {
        if (newWindow) {
          newWindow.location.href = res.url
          newWindow.focus()
        } else {
          window.open(res.url, windowName, windowFeatures)
        }
      } else {
        if (newWindow) newWindow.close()
        throw new Error(res?.message || 'Gagal mendapatkan URL SIPP dari hasil enkripsi.')
      }
    } catch (err: any) {
      if (newWindow) newWindow.close()
      const errorMsg =
        err?.data?.message ||
        err?.statusMessage ||
        err?.message ||
        'Gagal terhubung ke service enkripsi SIPP.'

      toast.add({
        title: 'Gagal Membuka SIPP',
        description: errorMsg,
        color: 'red'
      })
    } finally {
      loadingPerkaraId.value = null
    }
  }

  return {
    selectedYear,
    namaSatker,
    refreshSignal,
    isModalMinutasiOpen,
    totalMinutasiCases,
    isModalPbtOpen,
    totalPbtCases,
    loadingPerkaraId,
    triggerRefresh,
    openModalMinutasi,
    closeModalMinutasi,
    openModalPbt,
    closeModalPbt,
    formatDate,
    cleanHtml,
    openSipp
  }
}
