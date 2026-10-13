<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-indigo-500" />
          Monitoring Upaya Hukum (Banding, Kasasi, PK)
        </h3>
        <UBadge v-if="!isLoading" color="indigo" variant="subtle" size="xs">
          Total: {{ data?.upayaHukum?.total || 0 }} Perkara
        </UBadge>
        <USkeleton v-else class="h-5 w-24 rounded-full" />
      </div>
    </template>

    <div class="grid grid-cols-3 gap-3 text-center">
      <template v-if="isLoading">
        <div v-for="i in 3" :key="i" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center space-y-2">
          <USkeleton class="h-3.5 w-20" />
          <USkeleton class="h-7 w-10" />
          <USkeleton class="h-2.5 w-16" />
        </div>
      </template>
      <template v-else>
        <div class="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/40">
          <p class="text-xs font-semibold text-blue-700 dark:text-blue-300">Banding (PTA)</p>
          <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ data?.upayaHukum?.banding || 0 }}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">Tingkat Banding</p>
        </div>
        <div class="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/40">
          <p class="text-xs font-semibold text-purple-700 dark:text-purple-300">Kasasi (MA)</p>
          <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{{ data?.upayaHukum?.kasasi || 0 }}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">Tingkat Kasasi</p>
        </div>
        <div class="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
          <p class="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Peninjauan Kembali</p>
          <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{{ data?.upayaHukum?.pk || 0 }}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">Tingkat PK</p>
        </div>
      </template>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/upaya-hukum', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
