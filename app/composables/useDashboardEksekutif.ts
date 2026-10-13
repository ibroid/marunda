export const useDashboardEksekutif = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const namaSatker = useState<string>('eksekutifNamaSatker', () => 'PENGADILAN AGAMA')
  const refreshSignal = useState<number>('eksekutifRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  return {
    selectedYear,
    namaSatker,
    refreshSignal,
    triggerRefresh
  }
}
