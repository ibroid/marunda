export const useAktaCerai = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const activeKategori = useState<string>('aktaCerai_activeKategori', () => 'cg_belum_ac')
  const refreshSignal = useState<number>('aktaCerai_refreshSignal', () => 0)

  // State pagination & filter
  const currentPage = useState<number>('aktaCerai_currentPage', () => 1)
  const perPage = useState<number>('aktaCerai_perPage', () => 20)
  const searchQuery = useState<string>('aktaCerai_searchQuery', () => '')

  // State loading untuk aksi buka SIPP
  const loadingPerkaraId = ref<number | null>(null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setKategori = (kategori: string) => {
    activeKategori.value = kategori
    currentPage.value = 1
  }

  const formatKategori = (kat: string) => {
    if (kat === 'cg_belum_ac') return 'Cerai Gugat BHT yang Belum Terbit Akta Cerai'
    if (kat === 'ct_belum_ikrar') return 'Cerai Talak BHT yang Belum Pelaksanaan Ikrar Talak'
    if (kat === 'belum_diambil') return 'Akta Cerai Terbit yang Belum Diambil Pihak'
    return kat
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const cleanHtml = (htmlStr?: string | null) => {
    if (!htmlStr) return '-'
    return htmlStr
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
  }

  const openSipp = async (perkaraId: number) => {
    let toast: any = null
    try {
      if (typeof useToast === 'function') {
        toast = useToast()
      }
    } catch {
      // Toast hanya tersedia pada konteks client
    }

    if (!perkaraId) {
      toast?.add({
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
      const res: any = await $fetch('/api/sipp/encrypt', {
        method: 'POST',
        body: { perkara_id: perkaraId }
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

      toast?.add({
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
    activeKategori,
    refreshSignal,
    currentPage,
    perPage,
    searchQuery,
    loadingPerkaraId,
    triggerRefresh,
    setKategori,
    formatKategori,
    formatDate,
    cleanHtml,
    openSipp
  }
}
