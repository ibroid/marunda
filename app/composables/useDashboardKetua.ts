export const useDashboardKetua = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const namaSatker = useState<string>('ketuaNamaSatker', () => 'PENGADILAN AGAMA')
  const sharedAging = useState<any>('ketuaSharedAging', () => null)
  const refreshSignal = useState<number>('ketuaRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  return {
    selectedYear,
    namaSatker,
    sharedAging,
    refreshSignal,
    triggerRefresh
  }
}
