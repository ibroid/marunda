export const useKinerjaHakimDetail = () => {
  const route = useRoute()
  const router = useRouter()

  // Hakim ID dari parameter route URL
  const hakimId = computed(() => {
    const id = route.params.id
    return id && !isNaN(Number(id)) ? Number(id) : null
  })

  // Filter tahun (default dari query URL atau tahun saat ini)
  const selectedYear = useState<number>('kinerja_hakim_year', () => {
    if (route.query.year && !isNaN(Number(route.query.year))) {
      return Number(route.query.year)
    }
    return new Date().getFullYear()
  })

  // Sinkronisasi jika URL memiliki parameter query year
  if (route.query.year && !isNaN(Number(route.query.year))) {
    selectedYear.value = Number(route.query.year)
  }

  // Filter tab rincian perkara: semua | aktif | putus | belum_minutasi | tunggakan | belum_edoc
  const activeTab = useState<string>('kinerja_hakim_tab', () => (route.query.tab as string) || 'semua')

  // Filter peran majelis: ketua (default) | semua (ketua & anggota)
  const roleFilter = useState<'ketua' | 'semua'>('kinerja_hakim_role', () => {
    return (route.query.role as 'ketua' | 'semua') || 'ketua'
  })

  // Filter pencarian dan pagination
  const searchQuery = useState<string>('kinerja_hakim_search', () => '')
  const page = useState<number>('kinerja_hakim_page', () => 1)
  const limit = 15

  // Signal refresh global untuk tombol perbarui data
  const refreshSignal = useState<number>('kinerja_hakim_refresh', () => 0)

  // Shared state untuk profil hakim & ringkasan agar bisa dikonsumsi bersama
  const sharedHakim = useState<any>('kinerja_hakim_info', () => null)
  const sharedSummary = useState<any>('kinerja_hakim_summary', () => null)

  const loadingPerkaraId = ref<number | null>(null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setTab = (tab: string) => {
    activeTab.value = tab
    page.value = 1
  }

  const switchHakim = (newHakimId: number) => {
    if (newHakimId && newHakimId !== hakimId.value) {
      page.value = 1
      searchQuery.value = ''
      router.push({
        path: `/kinerja/hakim/${newHakimId}`,
        query: {
          year: selectedYear.value,
          role: roleFilter.value
        }
      })
    }
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

  const openSipp = async (perkaraId: number, toastInstance?: any) => {
    if (!perkaraId) {
      if (toastInstance) {
        toastInstance.add({
          title: 'Perhatian',
          description: 'ID Perkara tidak ditemukan.',
          color: 'amber'
        })
      }
      return
    }

    if (typeof window === 'undefined') return

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

      if (toastInstance) {
        toastInstance.add({
          title: 'Gagal Membuka SIPP',
          description: errorMsg,
          color: 'red'
        })
      }
    } finally {
      loadingPerkaraId.value = null
    }
  }

  return {
    hakimId,
    selectedYear,
    activeTab,
    roleFilter,
    searchQuery,
    page,
    limit,
    refreshSignal,
    sharedHakim,
    sharedSummary,
    loadingPerkaraId,
    triggerRefresh,
    setTab,
    switchHakim,
    formatDate,
    cleanHtml,
    openSipp
  }
}
