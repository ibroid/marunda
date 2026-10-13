<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div
        v-for="i in 6"
        :key="i"
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2"
      >
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-7 w-16" />
        <USkeleton class="h-3 w-20" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <!-- 1. Total Beban -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Beban</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
          {{ data?.summary?.bebanTahunIni || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Sisa lalu + Masuk</p>
      </UCard>

      <!-- 2. Sisa Tahun Lalu -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-amber-600 dark:text-amber-400">Sisa Tahun Lalu</p>
        <p class="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
          {{ data?.summary?.sisaLalu || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Perkara operan</p>
      </UCard>

      <!-- 3. Masuk Tahun Ini -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Masuk Tahun Ini</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
          {{ data?.summary?.masukTahunIni || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Pendaftaran baru</p>
      </UCard>

      <!-- 4. Putus Tahun Ini -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Putus Tahun Ini</p>
        <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
          {{ data?.summary?.putusTahunIni || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.persentasePutus || 0 }}%</p>
      </UCard>

      <!-- 5. Minutasi Tahun Ini -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-purple-600 dark:text-purple-400">Minutasi</p>
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
          {{ data?.summary?.minutasiTahunIni || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.persentaseMinutasi || 0 }}%</p>
      </UCard>

      <!-- 6. Publikasi Dirput -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-indigo-600 dark:text-indigo-400">Publikasi Dirput</p>
        <p class="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
          {{ data?.summary?.dirputTahunIni || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.persentaseDirput || 0 }}%</p>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal } = useKinerja()

const { data, pending, refresh } = useLazyFetch('/api/kinerja/summary', {
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
