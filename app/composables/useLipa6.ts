export const useLipa6 = () => {
  const selectedYear = useState<number>('lipa6_selectedYear', () => new Date().getFullYear())
  const selectedMonth = useState<number>('lipa6_selectedMonth', () => new Date().getMonth() + 1)
  const selectedRole = useState<string>('lipa6_selectedRole', () => 'ketua')
  const refreshSignal = useState<number>('lipa6_refreshSignal', () => 0)

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

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 15 }, (_, i) => {
    const y = currentYear - i + 2
    return { label: String(y), value: y }
  })

  const roleOptions = [
    { label: 'Sebagai Ketua Majelis / Hakim Tunggal', value: 'ketua' },
    { label: 'Semua (Termasuk Hakim Anggota)', value: 'semua' }
  ]

  const formatNumber = (val: any): string => {
    if (val === null || val === undefined || val === '') return '0'
    const num = Number(val)
    if (isNaN(num)) return '0'
    return num.toLocaleString('id-ID')
  }

  const getNamaBulan = (monthNum: number): string => {
    const found = monthOptions.find(m => m.value === Number(monthNum))
    return found ? found.label : ''
  }

  const formatTanggalIndo = (date?: Date): string => {
    const d = date || new Date()
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  return {
    selectedYear,
    selectedMonth,
    selectedRole,
    refreshSignal,
    triggerRefresh,
    monthOptions,
    yearOptions,
    roleOptions,
    formatNumber,
    getNamaBulan,
    formatTanggalIndo
  }
}
