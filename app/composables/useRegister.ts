import * as XLSX from 'xlsx'

export const useRegister = () => {
  const selectedYear = useState<number>('selectedYear', () => new Date().getFullYear())
  const activeJenis = useState<string>('register_activeJenis', () => 'gugatan')
  const searchQuery = useState<string>('register_searchQuery', () => '')
  const refreshSignal = useState<number>('register_refreshSignal', () => 0)
  const sharedData = useState<any[]>('register_sharedData', () => [])

  const registerTabs = [
    { id: 'gugatan', label: 'R1-PA1G: Register Gugatan', short: 'Gugatan' },
    { id: 'permohonan', label: 'R1-PA1P: Register Permohonan', short: 'Permohonan' },
    { id: 'prodeo', label: 'R1-PA18: Register Prodeo', short: 'Prodeo' }
  ]

  const currentTabLabel = computed(() => {
    const match = registerTabs.find(t => t.id === activeJenis.value)
    return match ? match.label : 'Register Perkara'
  })

  const triggerRefresh = () => {
    refreshSignal.value++
  }

  const setJenis = (jenis: string) => {
    activeJenis.value = jenis
  }

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const exportExcel = () => {
    if (!sharedData.value?.length) return

    const rows = sharedData.value.map((item, idx) => ({
      No: idx + 1,
      'Nomor Perkara': item.nomor_perkara,
      'Tanggal Pendaftaran': formatDate(item.tanggal_pendaftaran),
      'Jenis Perkara': item.jenis_perkara_nama,
      'Para Pihak': item.para_pihak,
      'Tanggal Putusan': item.tanggal_putusan ? formatDate(item.tanggal_putusan) : '-',
      'Tanggal Minutasi': item.tanggal_minutasi ? formatDate(item.tanggal_minutasi) : '-',
      'Status': item.proses_terakhir_text || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, activeJenis.value)
    XLSX.writeFile(workbook, `Register_${activeJenis.value}_${selectedYear.value}.xlsx`)
  }

  return {
    selectedYear,
    activeJenis,
    searchQuery,
    refreshSignal,
    sharedData,
    registerTabs,
    currentTabLabel,
    triggerRefresh,
    setJenis,
    formatDate,
    exportExcel
  }
}
