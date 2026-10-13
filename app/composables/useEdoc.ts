export const useEdoc = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const activeKategori = useState<string>('edoc_activeKategori', () => 'belum_edoc')
  const refreshSignal = useState<number>('edoc_refreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setKategori = (kategori: string) => {
    activeKategori.value = kategori
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return {
    selectedYear,
    activeKategori,
    refreshSignal,
    triggerRefresh,
    setKategori,
    formatDate
  }
}
