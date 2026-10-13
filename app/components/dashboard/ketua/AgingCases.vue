<template>
  <UCard class="lg:col-span-1">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-rose-500" />
          Monitoring Usia Perkara (Aging Cases)
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Skeleton items -->
      <template v-if="isLoading">
        <div v-for="i in 4" :key="i" class="p-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 rounded-lg flex items-center justify-between">
          <div class="space-y-1.5 flex-1 mr-4">
            <USkeleton class="h-3.5 w-36" />
            <USkeleton class="h-3 w-48" />
          </div>
          <USkeleton class="h-6 w-8 rounded" />
        </div>
      </template>

      <!-- Real items -->
      <template v-else>
        <!-- 3 - 5 Bulan -->
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-amber-800 dark:text-amber-300">Usia 3 - 5 Bulan (91-150 hari)</p>
            <p class="text-[11px] text-amber-600 dark:text-amber-400">Perhatian penyelesaian sidang</p>
          </div>
          <span class="text-lg font-bold text-amber-700 dark:text-amber-300">
            {{ data?.aging?.usia3_5Bulan || 0 }}
          </span>
        </div>

        <!-- 5 - 6 Bulan (Batas SEMA) -->
        <div class="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-orange-800 dark:text-orange-300">Usia 5 - 6 Bulan (151-180 hari)</p>
            <p class="text-[11px] text-orange-600 dark:text-orange-400">Mendekati batas SEMA No. 2/2014 (5 bln)</p>
          </div>
          <span class="text-lg font-bold text-orange-700 dark:text-orange-300">
            {{ data?.aging?.usia5_6Bulan || 0 }}
          </span>
        </div>

        <!-- 6 - 12 Bulan -->
        <div class="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-red-800 dark:text-red-300">Usia 6 - 12 Bulan (181-365 hari)</p>
            <p class="text-[11px] text-red-600 dark:text-red-400">Melewati standar penanganan perkara</p>
          </div>
          <span class="text-lg font-bold text-red-700 dark:text-red-300">
            {{ data?.aging?.usia6_12Bulan || 0 }}
          </span>
        </div>

        <!-- Diatas 1 Tahun -->
        <div class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-rose-800 dark:text-rose-300">Usia &gt; 1 Tahun (&gt; 365 hari)</p>
            <p class="text-[11px] text-rose-600 dark:text-rose-400">Tunggakan perkara kronis</p>
          </div>
          <span class="text-lg font-bold text-rose-700 dark:text-rose-300">
            {{ data?.aging?.usiaDiatas1Tahun || 0 }}
          </span>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="text-[11px] text-gray-500">
        * Standar penyelesaian perkara tingkat pertama menurut SEMA No. 2 Tahun 2014 maksimal 5 bulan.
      </div>
    </template>
  </UCard>
</template>

<script setup>
const { selectedYear, sharedAging, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/aging', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.aging) {
    sharedAging.value = newVal.aging
  }
})

watch(selectedYear, () => {
  data.value = null
  sharedAging.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
