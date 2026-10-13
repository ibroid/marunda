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
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Beban Tugas</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
          {{ summary?.totalTugas || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Penetapan tahun {{ selectedYear }}</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-green-600 dark:text-green-400">Perkara Sudah Putus</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
          {{ summary?.sudahPutus || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Telah diputus majelis</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Sisa Perkara Berjalan</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
          {{ summary?.sisaPerkara || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Masih dalam persidangan</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-orange-600 dark:text-orange-400">Tunggakan PBT Tergugat</p>
        <p
          class="text-2xl font-bold mt-1"
          :class="(summary?.totalPbt || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-100'"
        >
          {{ summary?.totalPbt || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Verstek belum BHT tanpa PBT</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { jspId, selectedYear, refreshSignal, sharedSummary } = useJurusitaDetail()

const { data, pending, refresh } = useLazyFetch(() => `/api/dashboard/panitera/jsp/${jspId.value}/summary`, {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
  watch: [selectedYear, jspId],
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
