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

    <!-- Header Banner Panitera Pengganti -->
    <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-primary-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UBadge color="white" variant="solid" size="xs" class="text-emerald-950 font-bold uppercase tracking-wider">
            Panitera Pengganti
          </UBadge>
          <span v-if="!isLoading" class="text-xs text-emerald-200">
            NIP: {{ data?.panitera?.nip || '-' }}
          </span>
          <USkeleton v-else class="h-3.5 w-28 bg-white/20" />
        </div>
        <h2 v-if="!isLoading" class="text-2xl font-bold tracking-tight mt-1">
          {{ data?.panitera?.nama || 'Nama Tidak Ditemukan' }}
        </h2>
        <div v-else class="mt-2">
          <USkeleton class="h-7 w-64 bg-white/20" />
        </div>
        <p class="text-sm text-emerald-200 mt-0.5">
          Daftar Persidangan &amp; Kepatuhan Berita Acara Sidang (BAS) — Tahun {{ selectedYear }}
        </p>
      </div>

      <div class="text-right">
        <span class="text-xs text-emerald-200 uppercase font-medium">Kepatuhan Upload BAS</span>
        <div v-if="isLoading" class="mt-1">
          <USkeleton class="h-9 w-20 ml-auto bg-white/20" />
        </div>
        <p v-else class="text-3xl font-extrabold text-white mt-0.5">
          {{ data?.summary?.kepatuhan || 0 }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { ppId, selectedYear, refreshSignal, sharedPanitera, sharedSummary, triggerRefresh } = usePaniteraBas()
const isRefreshing = ref(false)

const { data, pending, refresh } = useLazyFetch(() => `/api/dashboard/panitera/bas/${ppId.value}/summary`, {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
  watch: [selectedYear, ppId],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.panitera) sharedPanitera.value = newVal.panitera
  if (newVal?.summary) sharedSummary.value = newVal.summary
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
