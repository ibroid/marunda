export default defineNuxtPlugin((nuxtApp) => {
  const { markDbOffline, checkDatabaseStatus, isDbConnected } = useDatabaseStatus()

  nuxtApp.hook('app:mounted', () => {
    // 1. Periksa koneksi database saat client dimuat
    checkDatabaseStatus()

    // 2. Ketika pengguna kembali ke tab browser (misal setelah menyalakan MySQL di XAMPP / Services),
    // otomatis cek ulang koneksi database
    window.addEventListener('focus', () => {
      if (isDbConnected.value === false) {
        checkDatabaseStatus(true)
      }
    })

    // 3. Periodic polling setiap 60 detik jika offline untuk mendeteksi kapan DB online kembali
    const interval = setInterval(() => {
      if (isDbConnected.value === false) {
        checkDatabaseStatus(true)
      }
    }, 60000)

    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
    })
  })
})
