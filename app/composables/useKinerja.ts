export const useKinerja = () => {
  const currentYear = new Date().getFullYear()
  const selectedYear = useState<number>('selectedYear', () => currentYear)
  const refreshSignal = useState<number>('kinerjaRefreshSignal', () => 0)

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

  const getStatusText = (color?: string) => {
    if (color === 'green') return 'Sangat Baik (>=90%)'
    if (color === 'yellow') return 'Cukup (75-89%)'
    return 'Perlu Perhatian (<75%)'
  }

  return {
    selectedYear,
    yearOptions,
    refreshSignal,
    triggerRefresh,
    getStatusText
  }
}
