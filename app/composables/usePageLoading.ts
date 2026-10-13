export const usePageLoading = () => {
  const isLoading = useState<boolean>('globalPageLoading', () => false)
  const targetTitle = useState<string>('globalPageLoadingTitle', () => '')

  const pageTitleMap: Record<string, string> = {
    '/': 'Dashboard Eksekutif',
    '/dashboard': 'Dashboard Eksekutif',
    '/dashboard/ketua': 'Dashboard Ketua',
    '/dashboard/panitera': 'Dashboard Panitera',
    '/ecourt': 'Statistik e-Court',
    '/kinerja': 'Raport & Kinerja SIPP',
    '/kontrol': 'Kontrol & Audit Perkara',
    '/porsi': 'Porsi Beban Kerja & Majelis',
    '/edoc': 'Kepatuhan e-Doc Putusan',
    '/akta-cerai': 'Akta Cerai & Ikrar Talak',
    '/register': 'Buku Register Digital',
    '/laporan': 'Laporan Perkara (LIPA)'
  }

  const getTitleForPath = (path: string): string => {
    if (pageTitleMap[path]) return pageTitleMap[path]
    if (path.startsWith('/dashboard/panitera/bas/')) return 'Detail Perkara Panitera Pengganti'
    return path
  }

  const startLoading = (pathOrTitle = '') => {
    if (pathOrTitle) {
      targetTitle.value = getTitleForPath(pathOrTitle)
    }
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
    targetTitle.value = ''
  }

  return {
    isLoading,
    targetTitle,
    startLoading,
    stopLoading,
    pageTitleMap
  }
}
