export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const { startLoading, stopLoading } = usePageLoading()
  let safetyTimer: ReturnType<typeof setTimeout> | null = null

  const triggerStart = (path?: string) => {
    if (safetyTimer) clearTimeout(safetyTimer)
    startLoading(path || '')

    // Fallback: auto dismiss after 5 detik jika terjadi delay jaringan tak terduga
    safetyTimer = setTimeout(() => {
      stopLoading()
    }, 5000)
  }

  const triggerStop = () => {
    if (safetyTimer) clearTimeout(safetyTimer)
    stopLoading()
  }

  // 1. Intercept router navigation start (0ms feedback immediately when link clicked)
  router.beforeEach((to, from) => {
    if (to.fullPath !== from.fullPath) {
      triggerStart(to.path)
    }
  })

  // 2. Intercept router completion
  router.afterEach((_to, _from, failure) => {
    if (failure) {
      triggerStop()
    } else {
      setTimeout(() => {
        triggerStop()
      }, 100)
    }
  })

  router.onError(() => {
    triggerStop()
  })

  // 3. Nuxt Page & Suspense Hooks
  nuxtApp.hook('page:start', () => {
    triggerStart()
  })

  nuxtApp.hook('page:finish', () => {
    triggerStop()
  })

  nuxtApp.hook('page:loading:end', () => {
    triggerStop()
  })

  // Pastikan saat mounted pertama kali di client, jika overlay masih aktif langsung ditutup
  nuxtApp.hook('app:mounted', () => {
    triggerStop()
  })

  // 4. Global Error Hooks
  nuxtApp.hook('vue:error', () => {
    triggerStop()
  })

  nuxtApp.hook('app:error', () => {
    triggerStop()
  })
})
