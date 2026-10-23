export const useLipa5 = () => {
  const selectedYear = useState<number>('lipa5_selectedYear', () => new Date().getFullYear())
  const selectedMonth = useState<number>('lipa5_selectedMonth', () => new Date().getMonth() + 1)
  const statusFilter = useState<string>('lipa5_statusFilter', () => 'all')
  const searchQuery = useState<string>('lipa5_searchQuery', () => '')
  const page = useState<number>('lipa5_page', () => 1)
  const pageSize = useState<number>('lipa5_pageSize', () => 25)
  const refreshSignal = useState<number>('lipa5_refreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const monthOptions = [
    { label: 'Januari', value: 1 },
    { label: 'Februari', value: 2 },
    { label: 'Maret', value: 3 },
    { label: 'April', value: 4 },
    { label: 'Mei', value: 5 },
    { label: 'Juni', value: 6 },
    { label: 'Juli', value: 7 },
    { label: 'Agustus', value: 8 },
    { label: 'September', value: 9 },
    { label: 'Oktober', value: 10 },
    { label: 'November', value: 11 },
    { label: 'Desember', value: 12 }
  ]

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 15 }, (_, i) => {
    const y = currentYear - i + 2
    return { label: String(y), value: y }
  })

  const statusOptions = [
    { label: 'Semua Perkara Eksekusi', value: 'all' },
    { label: 'Permohonan Bulan Ini', value: 'mohon_bulan_ini' },
    { label: 'Teguran / Aanmaning', value: 'aanmaning' },
    { label: 'Sita Eksekusi', value: 'sita' },
    { label: 'Eksekusi Rill', value: 'eksekusi_rill' },
    { label: 'Selesai Dilaksanakan', value: 'selesai' },
    { label: 'Penetapan Non Eksekutabel', value: 'non_eksekutabel' }
  ]

  const pageSizeOptions = [
    { label: '10 per halaman', value: 10 },
    { label: '25 per halaman', value: 25 },
    { label: '50 per halaman', value: 50 },
    { label: '100 per halaman', value: 100 },
    { label: 'Semua Data', value: 0 }
  ]

  const formatTanggal = (dateStr: any): string => {
    if (!dateStr) return '-'
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return '-'
      const y = dateStr.getFullYear()
      const m = String(dateStr.getMonth() + 1).padStart(2, '0')
      const d = String(dateStr.getDate()).padStart(2, '0')
      return `${d}/${m}/${y}`
    }
    const str = String(dateStr).trim()
    if (str === '') return '-'
    if (str === '0000-00-00' || str.startsWith('0000-00-00')) {
      return '00/00/0000'
    }
    try {
      const cleanDate = str.includes('T') ? str.split('T')[0] : str.split(' ')[0]
      const parts = cleanDate.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
      }
      return str
    } catch {
      return str || '-'
    }
  }

  const cleanHtml = (text: any): string => {
    if (!text) return ''
    const str = String(text)
    return str
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  const getNamaBulan = (monthNum: number): string => {
    const found = monthOptions.find(m => m.value === Number(monthNum))
    return found ? found.label : ''
  }

  return {
    selectedYear,
    selectedMonth,
    statusFilter,
    searchQuery,
    page,
    pageSize,
    refreshSignal,
    triggerRefresh,
    monthOptions,
    yearOptions,
    statusOptions,
    pageSizeOptions,
    formatTanggal,
    cleanHtml,
    getNamaBulan
  }
}
