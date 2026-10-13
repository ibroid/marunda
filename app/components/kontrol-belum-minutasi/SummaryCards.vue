<template>
  <div>
    <!-- Compact Section Header -->
    <div class="flex items-center justify-between mb-2.5">
      <div class="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
        <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-primary-500" />
        <span>Ringkasan Usia Keterlambatan Minutasi ({{ yearLabel }})</span>
      </div>
      <div v-if="!isLoading && data?.summary" class="flex items-center gap-2 text-xs text-gray-500">
        <span>Rata-rata: <strong>{{ data.summary.rata_rata_hari }}</strong> hari</span>
        <span>•</span>
        <span>Maksimal: <strong class="text-rose-600 dark:text-rose-400">{{ data.summary.maksimal_hari }}</strong> hari</span>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="i in 4"
        :key="i"
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs space-y-2 border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-3 w-20" />
          <USkeleton class="h-6 w-6 rounded-lg" />
        </div>
        <USkeleton class="h-7 w-16" />
        <USkeleton class="h-3 w-28" />
      </div>
    </div>

    <!-- Real Content: 4 Interactive KPI Cards -->
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- 1. Total Belum Minutasi -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-blue-400 dark:hover:border-blue-500"
        :class="[
          activeAging === 'all'
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/25 dark:bg-blue-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setAging('all')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Total Belum Minutasi</span>
          <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
          {{ data?.summary?.total || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Semua perkara putus tanpa tgl minutasi
        </p>
      </div>

      <!-- 2. Aman (<= 7 Hari) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-emerald-400 dark:hover:border-emerald-500"
        :class="[
          activeAging === 'aman'
            ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/25 dark:bg-emerald-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setAging('aman')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Masa Aman (&le; 7 Hari)</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
          {{ data?.summary?.aman_7hari || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Masih dalam tenggang waktu normal
        </p>
      </div>

      <!-- 3. Atensi (8 - 14 Hari) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-amber-400 dark:hover:border-amber-500"
        :class="[
          activeAging === 'atensi'
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/25 dark:bg-amber-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setAging('atensi')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Atensi (8 - 14 Hari)</span>
          <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
          {{ data?.summary?.atensi_14hari || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Mendekati batas maksimal 14 hari
        </p>
      </div>

      <!-- 4. Terlambat / EWS (> 14 Hari) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-rose-400 dark:hover:border-rose-500"
        :class="[
          activeAging === 'terlambat'
            ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/25 dark:bg-rose-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setAging('terlambat')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Terlambat (&gt; 14 Hari)</span>
          <div class="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <UIcon name="i-heroicons-shield-exclamation" class="w-4 h-4" />
          </div>
        </div>
        <p class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">
          {{ data?.summary?.telat_lewat_14hari || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Melewati batas SEMA No. 1/2017
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { filterYear, activeAging, setAging, refreshSignal } = useKontrolBelumMinutasi()

const yearLabel = computed(() => {
  return filterYear.value === 'all' ? 'Semua Tahun' : `Tahun ${filterYear.value}`
})

const { data, pending, refresh } = useLazyFetch('/api/kontrol/belum-minutasi/summary', {
  server: false,
  query: computed(() => ({
    year: filterYear.value
  })),
  watch: [filterYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})
</script>
