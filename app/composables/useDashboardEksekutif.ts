export const useDashboardEksekutif = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const namaSatker = useState<string>('eksekutifNamaSatker', () => 'PENGADILAN AGAMA')
  const refreshSignal = useState<number>('eksekutifRefreshSignal', () => 0)

  // State Modal Detail Atensi Eksekutif
  const isModalAtensiOpen = useState<boolean>('eksekutifModalAtensiOpen', () => false)
  const modalAtensiType = useState<string>('eksekutifModalAtensiType', () => 'putus_hari_ini')
  const modalAtensiTitle = useState<string>('eksekutifModalAtensiTitle', () => 'Daftar Perkara Atensi')
  const modalAtensiTotal = useState<number>('eksekutifModalAtensiTotal', () => 0)
  const loadingPerkaraId = ref<number | null>(null)
  const toast = useToast()

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const openModalAtensi = (type: string, title?: string, total?: number) => {
    modalAtensiType.value = type
    if (title) modalAtensiTitle.value = title
    if (typeof total === 'number') modalAtensiTotal.value = total
    isModalAtensiOpen.value = true
  }

  const closeModalAtensi = () => {
    isModalAtensiOpen.value = false
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
    isModalAtensiOpen,
    modalAtensiType,
    modalAtensiTitle,
    modalAtensiTotal,
    loadingPerkaraId,
    triggerRefresh,
    openModalAtensi,
    closeModalAtensi,
    formatDate,
    cleanHtml,
    openSipp
  }
}
