export const useAktaCerai = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const activeKategori = useState<string>('aktaCerai_activeKategori', () => 'cg_belum_ac')
  const refreshSignal = useState<number>('aktaCerai_refreshSignal', () => 0)

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setKategori = (kategori: string) => {
    activeKategori.value = kategori
  }

  const formatKategori = (kat: string) => {
    if (kat === 'cg_belum_ac') return 'Cerai Gugat BHT yang Belum Terbit Akta Cerai'
    if (kat === 'ct_belum_ikrar') return 'Cerai Talak BHT yang Belum Pelaksanaan Ikrar Talak'
    if (kat === 'belum_diambil') return 'Akta Cerai Terbit yang Belum Diambil Pihak'
    return kat
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
    formatKategori,
    formatDate
  }
}
