<template>
  <div class="space-y-6">
    <!-- Breadcrumb & Back Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/dashboard/panitera"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          <span>Kembali ke Dashboard Panitera</span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
          variant="ghost"
          size="sm"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui
        </UButton>
      </div>
    </div>

    <!-- Header Banner Minutasi -->
    <div class="bg-gradient-to-r from-red-900 via-rose-900 to-primary-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UBadge color="white" variant="solid" size="xs" class="text-red-950 font-bold uppercase tracking-wider">
            Pengawasan Minutasi
          </UBadge>
          <span class="text-xs text-red-200">Administrasi Berkas &amp; Penyelesaian Perkara</span>
        </div>
        <h2 class="text-2xl font-bold tracking-tight mt-1">Daftar Perkara Belum Minutasi</h2>
        <div v-if="isLoading" class="mt-1.5">
          <USkeleton class="h-4 w-72 md:w-96 bg-white/20 rounded" />
        </div>
        <p v-else class="text-sm text-red-200 mt-0.5">
          Daftar perkara yang telah diputus majelis hakim namun berkas belum diminutasi — Tahun {{ selectedYear }}
        </p>
      </div>
      <div class="text-right">
        <span class="text-xs text-red-200 uppercase font-medium">Total Tunggakan</span>
        <div v-if="isLoading" class="mt-1">
          <USkeleton class="h-9 w-24 ml-auto bg-white/20 rounded" />
        </div>
        <p v-else class="text-3xl font-extrabold text-white mt-0.5">
          {{ displayTotal }} <span class="text-sm font-normal">Perkara</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal, sharedTotal, triggerRefresh } = usePaniteraMinutasi()
const isRefreshing = ref(false)

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/minutasi/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || data.value === null)
const displayTotal = computed(() => data.value?.total ?? sharedTotal.value)

watch(data, (newVal) => {
  if (newVal?.total !== undefined) {
    sharedTotal.value = newVal.total
  }
})

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
