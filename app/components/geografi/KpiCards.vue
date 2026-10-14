<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-7 w-20" />
        <USkeleton class="h-3 w-28" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <!-- Total Perkara Jakarta Utara -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Perkara Jakut</p>
          <UIcon name="i-heroicons-map" class="w-4 h-4 text-emerald-500" />
        </div>
        <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
          {{ formatNumber(data?.summary?.totalPerkara) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {{ data?.summary?.jumlahKecamatan || 6 }} Kecamatan di Jakut
        </p>
      </UCard>

      <!-- Kecamatan Tertinggi -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-blue-600 dark:text-blue-400">Wilayah Tertinggi</p>
          <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-blue-500" />
        </div>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1 truncate">
          {{ data?.summary?.kecamatanTertinggi?.nama || '-' }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {{ formatNumber(data?.summary?.kecamatanTertinggi?.total) }} perkara ({{ data?.summary?.kecamatanTertinggi?.persentase }}%)
        </p>
      </UCard>

      <!-- Perkara Gugatan -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Gugatan (Pdt.G)</p>
          <UIcon name="i-heroicons-document-duplicate" class="w-4 h-4 text-indigo-500" />
        </div>
        <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
          {{ formatNumber(data?.summary?.totalGugatan) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          Porsi: {{ data?.summary?.persenGugatan }}% dari total
        </p>
      </UCard>

      <!-- Perkara Permohonan -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">Permohonan (Pdt.P)</p>
          <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-amber-500" />
        </div>
        <p class="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
          {{ formatNumber(data?.summary?.totalPermohonan) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          Porsi: {{ data?.summary?.persenPermohonan }}% dari total
        </p>
      </UCard>

      <!-- Rata-rata per Kecamatan -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-teal-600 dark:text-teal-400">Rerata Per Wilayah</p>
          <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-teal-500" />
        </div>
        <p class="text-2xl font-bold text-teal-700 dark:text-teal-300 mt-1">
          {{ formatNumber(data?.summary?.rataRataPerKecamatan) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          Rata-rata perkara per kecamatan
        </p>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const {
  selectedYear,
  namaSatker,
  selectedPihakType,
  selectedAlurPerkara,
  refreshSignal,
  formatNumber
} = useStatistikGeografi()

const { data, pending, refresh } = useLazyFetch('/api/geografi/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    pihak_type: selectedPihakType.value,
    alur: selectedAlurPerkara.value
  })),
  watch: [selectedYear, selectedPihakType, selectedAlurPerkara],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.namaSatker) {
    namaSatker.value = newVal.namaSatker
  }
})

watch(refreshSignal, () => {
  refresh()
})
</script>
