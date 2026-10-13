<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <USkeleton class="h-3 w-28" />
        <USkeleton class="h-7 w-16" />
        <USkeleton class="h-2.5 w-24" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Sidang Didampingi</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
          {{ summary?.totalSidang || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Sidang tahun {{ selectedYear }}</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-green-600 dark:text-green-400">BAS Lengkap (Terupload)</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
          {{ summary?.basAda || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">File e-Doc terisi</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-red-600 dark:text-red-400">BAS Kosong (Belum Diunggah)</p>
        <p class="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
          {{ summary?.basKosong || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Perlu segera diunggah</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Rasio Kepatuhan</p>
        <p
          class="text-2xl font-bold mt-1"
          :class="(summary?.kepatuhan || 0) >= 90 ? 'text-green-600 dark:text-green-400' : (summary?.kepatuhan || 0) >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'"
        >
          {{ summary?.kepatuhan || 0 }}%
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Target &ge; 90%</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { ppId, selectedYear, refreshSignal, sharedSummary } = usePaniteraBas()

const { data, pending, refresh } = useLazyFetch(() => `/api/dashboard/panitera/bas/${ppId.value}/summary`, {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
  watch: [selectedYear, ppId],
  default: () => null
})

const isLoading = computed(() => pending.value || !summary.value)
const summary = computed(() => data.value?.summary || sharedSummary.value)

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
