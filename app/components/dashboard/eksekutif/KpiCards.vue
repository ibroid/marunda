<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <!-- Skeleton Cards -->
    <template v-if="isLoading">
      <div v-for="i in 6" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-7 w-16" />
        <USkeleton class="h-3 w-20" />
      </div>
    </template>

    <!-- Real Cards -->
    <template v-else>
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Sisa Tahun Lalu</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{{ data?.summary?.sisaLalu || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Perkara operan</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Masuk Tahun Ini</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ data?.summary?.totalMasuk || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Pendaftaran baru</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-green-600 dark:text-green-400">Putus Tahun Ini</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{{ data?.summary?.totalPutus || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Selesai disidang</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-purple-600 dark:text-purple-400">Minutasi</p>
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{{ data?.summary?.totalMinutasi || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.rasioMinutasi }}%</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-orange-600 dark:text-orange-400">Sisa Perkara</p>
        <p class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ data?.summary?.sisaPerkara || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Beban berjalan</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-indigo-600 dark:text-indigo-400">Rasio Putus</p>
        <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{{ data?.summary?.rasioPenyelesaian }}%</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Target &ge; 90%</p>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const { selectedYear, namaSatker, refreshSignal } = useDashboardEksekutif()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/eksekutif/summary', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.namaSatker) {
    namaSatker.value = newVal.namaSatker
  }
})

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
