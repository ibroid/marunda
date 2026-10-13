<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-hand-raised" class="w-4 h-4 text-emerald-500" />
          Efektivitas &amp; Keberhasilan Mediasi ({{ selectedYear }})
        </h3>
        <UBadge v-if="!isLoading" color="emerald" variant="subtle" size="xs">
          Keberhasilan: {{ data?.mediasi?.rasioBerhasil || 0 }}%
        </UBadge>
        <USkeleton v-else class="h-5 w-24 rounded-full" />
      </div>
    </template>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <template v-if="isLoading">
        <div v-for="i in 4" :key="i" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center space-y-2">
          <USkeleton class="h-3 w-20" />
          <USkeleton class="h-6 w-10" />
        </div>
      </template>
      <template v-else>
        <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
          <p class="text-xs text-gray-500">Total Dimediasi</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ data?.mediasi?.total || 0 }}</p>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/40">
          <p class="text-xs text-green-700 dark:text-green-300">Berhasil Damai</p>
          <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{{ data?.mediasi?.berhasil || 0 }}</p>
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/40">
          <p class="text-xs text-blue-700 dark:text-blue-300">Sebagian</p>
          <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ data?.mediasi?.berhasilSebagian || 0 }}</p>
        </div>
        <div class="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/40">
          <p class="text-xs text-red-700 dark:text-red-300">Tidak Berhasil</p>
          <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{{ data?.mediasi?.tidakBerhasil || 0 }}</p>
        </div>
      </template>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/mediasi', {
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
