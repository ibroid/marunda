<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2.5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-3 w-16" />
          <USkeleton class="h-6 w-6 rounded-lg" />
        </div>
        <USkeleton class="h-7 w-14" />
        <USkeleton class="h-3 w-20" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <!-- 1. Total Beban -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Beban</span>
          <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-folder-open" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary?.totalBeban || 0 }}</span>
          <span class="text-[11px] text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
          Tahun {{ selectedYear }}
        </p>
      </div>

      <!-- 2. Perkara Putus -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-emerald-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Perkara Putus</span>
          <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ summary?.totalPutus || 0 }}</span>
          <span class="text-[11px] text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium truncate">
          {{ summary?.rasioPutus || 0 }}% produktivitas
        </p>
      </div>

      <!-- 3. Sisa Perkara Aktif -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-amber-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Sisa Aktif</span>
          <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary?.totalSisa || 0 }}</span>
          <span class="text-[11px] text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
          Dalam pemeriksaan
        </p>
      </div>

      <!-- 4. Rasio Putus -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Rasio Putus</span>
          <div class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-0.5">
          <span class="text-2xl font-bold" :class="summary?.rasioPutus >= 90 ? 'text-emerald-600 dark:text-emerald-400' : summary?.rasioPutus >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'">
            {{ summary?.rasioPutus || 0 }}%
          </span>
        </div>
        <div class="mt-1 flex items-center gap-1.5">
          <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="summary?.rasioPutus >= 90 ? 'bg-emerald-500' : summary?.rasioPutus >= 75 ? 'bg-amber-500' : 'bg-rose-500'"
              :style="{ width: `${Math.min(summary?.rasioPutus || 0, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 5. Kepatuhan Minutasi -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-teal-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Kepatuhan Minutasi</span>
          <div class="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <UIcon name="i-heroicons-document-check" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-0.5">
          <span class="text-2xl font-bold" :class="summary?.rasioMinutasi >= 90 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'">
            {{ summary?.rasioMinutasi || 0 }}%
          </span>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
          {{ summary?.belumMinutasi || 0 }} belum minutasi
        </p>
      </div>

      <!-- 6. Rata-Rata Waktu Putus -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-purple-500/50 transition-colors">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Durasi Putus</span>
          <div class="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1">
          <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ summary?.rataRataHariPenyelesaian || 0 }}</span>
          <span class="text-[11px] text-gray-400">hari</span>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
          Rata-rata penyelesaian
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  hakimId,
  selectedYear,
  roleFilter,
  refreshSignal,
  sharedHakim,
  sharedSummary
} = useKinerjaHakimDetail()

const { data, pending, refresh } = useLazyFetch(
  () => `/api/kinerja/hakim/${hakimId.value}/summary`,
  {
    server: false,
    query: computed(() => ({
      year: selectedYear.value,
      role: roleFilter.value
    })),
    watch: [hakimId, selectedYear, roleFilter],
    default: () => null
  }
)

const isLoading = computed(() => pending.value || !data.value)
const summary = computed(() => data.value?.summary || null)

watch(
  data,
  (newVal) => {
    if (newVal?.hakim) {
      sharedHakim.value = newVal.hakim
    }
    if (newVal?.summary) {
      sharedSummary.value = newVal.summary
    }
  },
  { immediate: true }
)

watch(refreshSignal, () => {
  refresh()
})
</script>
