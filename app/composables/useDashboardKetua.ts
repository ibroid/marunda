export const useDashboardKetua = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const namaSatker = useState<string>('ketuaNamaSatker', () => 'PENGADILAN AGAMA')
  const sharedAging = useState<any>('ketuaSharedAging', () => null)
  const refreshSignal = useState<number>('ketuaRefreshSignal', () => 0)

  // State Modal Detail Aging Cases
  const isModalAgingOpen = useState<boolean>('ketuaModalAgingOpen', () => false)
  const selectedAgingKategori = useState<string>('ketuaSelectedAgingKategori', () => 'all')
  const selectedAgingTitle = useState<string>('ketuaSelectedAgingTitle', () => 'Semua Perkara Usia > 3 Bulan')
  const totalAgingCases = useState<number>('ketuaTotalAgingCases', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const openModalAging = (kategori: string = 'all', title?: string, total?: number) => {
    selectedAgingKategori.value = kategori
    if (title) {
      selectedAgingTitle.value = title
    } else {
      const titles: Record<string, string> = {
        '3_5_bulan': 'Usia 3 - 5 Bulan (91-150 hari)',
        '5_6_bulan': 'Usia 5 - 6 Bulan (151-180 hari)',
        '6_12_bulan': 'Usia 6 - 12 Bulan (181-365 hari)',
        'diatas_1_tahun': 'Usia > 1 Tahun (> 365 hari)',
        'all': 'Semua Perkara Usia > 3 Bulan'
      }
      selectedAgingTitle.value = titles[kategori] || 'Daftar Perkara Aging'
    }
    if (typeof total === 'number') {
      totalAgingCases.value = total
    }
    isModalAgingOpen.value = true
  }

  const closeModalAging = () => {
    isModalAgingOpen.value = false
  }

  return {
    selectedYear,
    namaSatker,
    sharedAging,
    refreshSignal,
    isModalAgingOpen,
    selectedAgingKategori,
    selectedAgingTitle,
    totalAgingCases,
    triggerRefresh,
    openModalAging,
    closeModalAging
  }
}
