export const useKontrol = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const activeKategori = useState<string>('kontrolActiveKategori', () => 'belum_pmh')
  const refreshSignal = useState<number>('kontrolRefreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const selectKategori = (kat: string) => {
    activeKategori.value = kat
  }

  const formatKategori = (kat: string) => {
    const map: Record<string, string> = {
      belum_pmh: 'Perkara Belum Penetapan Majelis Hakim (PMH)',
      belum_pp: 'Perkara Belum Penunjukan Panitera Pengganti (PP)',
      belum_jsp: 'Perkara Belum Penunjukan Jurusita (JSP)',
      belum_phs: 'Perkara Belum Penetapan Hari Sidang (PHS)',
      tunggakan_5bulan: 'Perkara Tunggakan Lebih Dari 5 Bulan'
    }
    return map[kat] || kat
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return {
    selectedYear,
    activeKategori,
    refreshSignal,
    triggerRefresh,
    selectKategori,
    formatKategori,
    formatDate
  }
}
