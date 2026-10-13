export const useDatabaseStatus = () => {
  const isDbConnected = useState<boolean | null>('db_is_connected', () => null)
  const isCheckingDb = useState<boolean>('db_is_checking', () => false)
  const dbStatus = useState<any>('db_status_data', () => null)
  const dbErrorMessage = useState<string>('db_error_message', () => '')
  const hasIgnoredWarning = useState<boolean>('db_has_ignored_warning', () => false)

  const checkDatabaseStatus = async (force = false) => {
    if (isCheckingDb.value && !force) return dbStatus.value
    isCheckingDb.value = true

    try {
      const res = await $fetch<any>('/api/system/db-status', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      dbStatus.value = res
      isDbConnected.value = Boolean(res?.connected)

      if (!res?.connected) {
        dbErrorMessage.value = res?.message || 'Server database sedang offline atau tidak dapat dijangkau.'
      } else {
        dbErrorMessage.value = ''
        hasIgnoredWarning.value = false
      }
      return res
    } catch (err: any) {
      isDbConnected.value = false
      dbErrorMessage.value = err?.data?.message || err?.message || 'Gagal menghubungi server backend untuk mengecek status database.'
      return { connected: false, message: dbErrorMessage.value }
    } finally {
      isCheckingDb.value = false
    }
  }

  const retryConnection = async () => {
    const toast = useToast?.()
    const res = await checkDatabaseStatus(true)

    if (res?.connected) {
      toast?.add({
        title: 'Database Terhubung!',
        description: 'Koneksi ke database SIPP berhasil dipulihkan.',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })
    } else {
      toast?.add({
        title: 'Koneksi Masih Gagal',
        description: res?.message || 'Server database masih offline.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      })
    }
    return res
  }

  const markDbOffline = (message?: string) => {
    isDbConnected.value = false
    if (message) {
      dbErrorMessage.value = message
    }
  }

  const bypassOfflineWarning = () => {
    hasIgnoredWarning.value = true
  }

  const restoreOfflineWarning = () => {
    hasIgnoredWarning.value = false
  }

  return {
    isDbConnected,
    isCheckingDb,
    dbStatus,
    dbErrorMessage,
    hasIgnoredWarning,
    checkDatabaseStatus,
    retryConnection,
    markDbOffline,
    bypassOfflineWarning,
    restoreOfflineWarning
  }
}
