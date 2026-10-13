export const useKontrolBelumMinutasi = () => {
  const toast = useToast()

  // State filter & pagination
  const filterYear = useState<number | 'all'>('kontrolMinutasiYear', () => 'all')
  const activeAging = useState<string>('kontrolMinutasiAging', () => 'all')
  const searchQuery = useState<string>('kontrolMinutasiSearch', () => '')
  const sortOrder = useState<string>('kontrolMinutasiSort', () => 'putusan_desc')
  const currentPage = useState<number>('kontrolMinutasiPage', () => 1)
  const limit = 20
  const refreshSignal = useState<number>('kontrolMinutasiRefreshSignal', () => 0)

  // Loading indicator untuk aksi buka SIPP
  const loadingPerkaraId = ref<number | null>(null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setAging = (aging: string) => {
    activeAging.value = aging
    currentPage.value = 1
  }

  const setYear = (year: number | 'all') => {
    filterYear.value = year
    currentPage.value = 1
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

  // Helper download data ke format CSV
  const exportToCsv = (items: any[], filename = 'perkara-belum-minutasi.csv') => {
    if (!items || items.length === 0) {
      toast.add({
        title: 'Informasi',
        description: 'Tidak ada data untuk diekspor.',
        color: 'amber'
      })
      return
    }

    const headers = [
      'No',
      'Nomor Perkara',
      'Jenis Perkara',
      'Tanggal Putusan',
      'Selisih Hari (Keterlambatan)',
      'Status Putusan',
      'Ketua / Majelis Hakim',
      'Panitera Pengganti',
      'Jurusita',
      'Para Pihak'
    ]

    const rows = items.map((item, index) => [
      index + 1,
      `"${(item.nomor_perkara || '').replace(/"/g, '""')}"`,
      `"${(item.jenis_perkara_nama || '').replace(/"/g, '""')}"`,
      formatDate(item.tanggal_putusan),
      `${item.selisih_hari || 0} hari`,
      `"${(item.status_putusan_nama || '').replace(/"/g, '""')}"`,
      `"${cleanHtml(item.majelis_hakim_nama).replace(/"/g, '""')}"`,
      `"${(item.panitera_pengganti_nama || '').replace(/"/g, '""')}"`,
      `"${(item.jurusita_nama || '').replace(/"/g, '""')}"`,
      `"${cleanHtml(item.para_pihak).replace(/"/g, '""')}"`
    ])

    const csvContent = '﻿' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    filterYear,
    activeAging,
    searchQuery,
    sortOrder,
    currentPage,
    limit,
    refreshSignal,
    loadingPerkaraId,
    triggerRefresh,
    setAging,
    setYear,
    formatDate,
    cleanHtml,
    openSipp,
    exportToCsv
  }
}
