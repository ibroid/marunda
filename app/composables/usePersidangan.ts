export const usePersidangan = () => {
  const toast = useToast()

  // State navigasi tab aktif
  const activeTab = useState<string>('persidanganActiveTab', () => 'penundaan')

  // Filter tanggal jadwal sidang (default: hari ini YYYY-MM-DD lokal)
  const getTodayString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const filterDate = useState<string>('persidanganFilterDate', () => getTodayString())

  // Filter sub-kategori
  const filterWaktuPenundaan = useState<string>('persidanganFilterWaktu', () => 'all') // 'all' | 'dalam_24_jam' | 'lebih_24_jam'
  const filterStatusDitegur = useState<string>('persidanganFilterStatusDitegur', () => 'all') // 'all' | 'dalam_30_hari' | 'lebih_30_hari'
  const filterRuanganJadwal = useState<string>('persidanganFilterRuanganJadwal', () => 'all')
  const filterJenisJadwal = useState<string>('persidanganFilterJenisJadwal', () => 'all') // 'all' | 'kantor' | 'keliling'

  // Search & Pagination
  const searchQuery = useState<string>('persidanganSearchQuery', () => '')
  const currentPage = useState<number>('persidanganCurrentPage', () => 1)
  const limit = useState<number>('persidanganLimit', () => 20)

  // Sinyal refresh untuk sinkronisasi seluruh komponen
  const refreshSignal = useState<number>('persidanganRefreshSignal', () => 0)
  const loadingPerkaraId = useState<any>('persidanganLoadingPerkaraId', () => null)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setActiveTab = (tab: string) => {
    activeTab.value = tab
    searchQuery.value = ''
    currentPage.value = 1
  }

  const setFilterDate = (date: string) => {
    filterDate.value = date
    currentPage.value = 1
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const cleanHtml = (text?: string | null) => {
    if (!text) return '-'
    return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // Helper untuk membuka perkara langsung di SIPP melalui endpoint enkripsi
  const openSipp = async (perkaraId: number | string | bigint) => {
    if (!perkaraId) {
      toast.add({
        title: 'ID Perkara Tidak Ditemukan',
        description: 'Tidak dapat membuka detail perkara SIPP.',
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

  // Ekspor array data ke file CSV
  const exportToCsv = (items: any[], filename = 'data-persidangan.csv') => {
    if (!items || !items.length) {
      toast.add({
        title: 'Tidak Ada Data',
        description: 'Tidak ada baris data yang dapat diekspor ke file CSV.',
        color: 'amber'
      })
      return
    }

    try {
      const headers = Object.keys(items[0])
      const csvRows = [
        headers.join(','),
        ...items.map((row) =>
          headers
            .map((header) => {
              const val = row[header] === null || row[header] === undefined ? '' : String(row[header])
              const escaped = val.replace(/"/g, '""').replace(/<[^>]*>/g, ' ')
              return `"${escaped}"`
            })
            .join(',')
        )
      ]

      const csvString = csvRows.join('\r\n')
      const blob = new Blob(['﻿' + csvString], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.add({
        title: 'Ekspor Berhasil',
        description: `File ${filename} berhasil diunduh.`,
        color: 'green'
      })
    } catch (e: any) {
      toast.add({
        title: 'Ekspor Gagal',
        description: e?.message || 'Terjadi kesalahan saat mengekspor data.',
        color: 'red'
      })
    }
  }

  const setToday = () => {
    filterDate.value = getTodayString()
    currentPage.value = 1
  }

  return {
    activeTab,
    filterDate,
    filterWaktuPenundaan,
    filterStatusDitegur,
    filterRuangan: filterRuanganJadwal,
    filterJenisSidang: filterJenisJadwal,
    filterRuanganJadwal,
    filterJenisJadwal,
    searchQuery,
    currentPage,
    limit,
    refreshSignal,
    loadingPerkaraId,
    triggerRefresh,
    setActiveTab,
    setFilterDate,
    setToday,
    getTodayString,
    formatDate,
    formatDateTime,
    cleanHtml,
    openSipp,
    exportToCsv
  }
}
