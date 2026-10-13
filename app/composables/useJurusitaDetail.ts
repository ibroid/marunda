export const useJurusitaDetail = () => {
  const route = useRoute()
  const toast = useToast()

  const jspId = computed(() => {
    const id = route.params.id
    return id && !isNaN(Number(id)) ? Number(id) : null
  })

  const selectedYear = useState<number>('selectedYear', () => {
    if (route.query.year && !isNaN(Number(route.query.year))) {
      return Number(route.query.year)
    }
    return new Date().getFullYear()
  })

  if (route.query.year && !isNaN(Number(route.query.year))) {
    selectedYear.value = Number(route.query.year)
  }

  const activeTab = useState<string>('jsp_detail_tab', () => (route.query.tab as string) || 'pbt')
  const page = useState<number>('jsp_detail_page', () => 1)
  const limit = 10
  const refreshSignal = useState<number>('jsp_detail_refresh', () => 0)

  const sharedJurusita = useState<any>('jsp_detail_info', () => null)
  const sharedSummary = useState<any>('jsp_detail_summary', () => null)

  const loadingPerkaraId = ref<number | null>(null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setTab = (tab: string) => {
    activeTab.value = tab
    page.value = 1
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const cleanHtml = (htmlStr?: string | null) => {
    if (!htmlStr) return '-'
    return htmlStr.replace(/<br\s*\/?>/gi, ', ').replace(/<[^>]+>/g, '').trim()
  }

  const openSipp = async (perkaraId: number) => {
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
    jspId,
    selectedYear,
    activeTab,
    page,
    limit,
    refreshSignal,
    sharedJurusita,
    sharedSummary,
    loadingPerkaraId,
    triggerRefresh,
    setTab,
    formatDate,
    cleanHtml,
    openSipp
  }
}
