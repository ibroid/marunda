export const usePorsi = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const selectedMonth = useState<number | null>('porsiSelectedMonth', () => null)
  const activeTab = useState<'pp' | 'hakim'>('porsiActiveTab', () => 'pp')
  const ppCount = useState<number>('porsiPpCount', () => 0)
  const hakimCount = useState<number>('porsiHakimCount', () => 0)
  const refreshSignal = useState<number>('porsiRefreshSignal', () => 0)

  const monthOptions = [
    { label: 'Semua Bulan', value: null },
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

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  return {
    selectedYear,
    selectedMonth,
    activeTab,
    ppCount,
    hakimCount,
    refreshSignal,
    monthOptions,
    triggerRefresh
  }
}
