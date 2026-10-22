export const useLipa1 = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const selectedMonth = useState<number>('lipa1_selectedMonth', () => new Date().getMonth() + 1)
  const selectedAlur = useState<string>('lipa1_selectedAlur', () => 'all')
  const searchQuery = useState<string>('lipa1_searchQuery', () => '')
  const page = useState<number>('lipa1_page', () => 1)
  const pageSize = useState<number>('lipa1_pageSize', () => 25)
  const refreshSignal = useState<number>('lipa1_refreshSignal', () => 0)

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

  const alurOptions = [
    { label: 'Semua Alur (G, P, GS)', value: 'all' },
    { label: 'Gugatan (G)', value: '15' },
    { label: 'Permohonan (P)', value: '16' },
    { label: 'Gugatan Sederhana (GS)', value: '17' }
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
    if (str === '' || str === '0000-00-00' || str.startsWith('0000-00-00')) return '-'
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

  const getNamaBulan = (m: number): string => {
    const found = monthOptions.find(item => item.value === m)
    return found ? found.label.toUpperCase() : ''
  }

  return {
    selectedYear,
    selectedMonth,
    selectedAlur,
    searchQuery,
    page,
    pageSize,
    refreshSignal,
    triggerRefresh,
    monthOptions,
    alurOptions,
    pageSizeOptions,
    formatTanggal,
    getNamaBulan
  }
}
