export const useEcourt = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const sharedAdopsi = useState<any>('ecourtSharedAdopsi', () => null)
  const refreshSignal = useState<number>('ecourtRefreshSignal', () => 0)

  // State untuk modal rincian perkara per bulan
  const isModalDetailOpen = useState<boolean>('ecourtIsModalDetailOpen', () => false)
  const selectedMonth = useState<number | null>('ecourtSelectedMonth', () => null)
  const selectedMonthName = useState<string>('ecourtSelectedMonthName', () => '')
  const loadingPerkaraId = useState<number | null>('ecourtLoadingPerkaraId', () => null)

  const toast = useToast()

  const yearOptions = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
    currentYear - 4
  ].map((y) => ({ label: `Tahun ${y}`, value: y }))

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const openModalDetail = (monthNum: number, monthName: string) => {
    selectedMonth.value = monthNum
    selectedMonthName.value = monthName
    isModalDetailOpen.value = true
  }

  const closeModalDetail = () => {
    isModalDetailOpen.value = false
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const cleanHtml = (str?: string | null) => {
    if (!str) return ''
    return str.replace(/<br\s*[\/]?>/gi, ' - ').replace(/<[^>]+>/g, '').trim()
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
    yearOptions,
    sharedAdopsi,
    refreshSignal,
    isModalDetailOpen,
    selectedMonth,
    selectedMonthName,
    loadingPerkaraId,
    triggerRefresh,
    openModalDetail,
    closeModalDetail,
    formatDate,
    cleanHtml,
    openSipp
  }
}
