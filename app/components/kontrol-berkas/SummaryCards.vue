<template>
  <div>
    <!-- Compact Header -->
    <div class="flex items-center justify-between mb-2.5">
      <div class="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
        <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-emerald-500" />
        <span>Ringkasan Kepatuhan ({{ formatMonthYear(selectedMonth, selectedYear) }})</span>
      </div>
      <UBadge
        v-if="!isLoading && data?.summary"
        :color="complianceBadgeColor"
        variant="subtle"
        size="xs"
        class="font-semibold"
      >
        Kepatuhan: {{ data.summary.persenLengkap }}% ({{ data.summary.sudahLengkap }}/{{ data.summary.totalPerkara }})
      </UBadge>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      <div
        v-for="i in 6"
        :key="i"
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs space-y-2"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-3 w-16" />
          <USkeleton class="h-4 w-6 rounded-full" />
        </div>
        <USkeleton class="h-6 w-12" />
        <USkeleton class="h-2.5 w-20" />
      </div>
    </div>

    <!-- Real Content: Minimalist KPI Cards -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      <!-- 1. Total Perkara -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-gray-400 dark:hover:border-gray-500"
        :class="{ 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/20 dark:bg-primary-950/20': activeKategori === 'semua' }"
        @click="setKategori('semua')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Total Perkara</span>
          <UIcon name="i-heroicons-folder" class="w-3.5 h-3.5 text-gray-400" />
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
          {{ data?.summary?.totalPerkara || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">Perkara terdaftar</p>
      </div>

      <!-- 2. Belum Lengkap -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-rose-400 dark:hover:border-rose-500"
        :class="{ 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20': activeKategori === 'semua_belum' }"
        @click="setKategori('semua_belum')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-rose-600 dark:text-rose-400">Belum Lengkap</span>
          <UBadge :color="(data?.summary?.semuaBelum || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.summary?.semuaBelum || 0 }}
          </UBadge>
        </div>
        <p class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          {{ data?.summary?.semuaBelum || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">&ge; 1 berkas kosong</p>
      </div>

      <!-- 3. Belum PMH -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-indigo-400 dark:hover:border-indigo-500"
        :class="{ 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20': activeKategori === 'belum_pmh' }"
        @click="setKategori('belum_pmh')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Belum PMH</span>
          <UBadge :color="(data?.summary?.belumPmh || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.summary?.belumPmh || 0 }}
          </UBadge>
        </div>
        <p class="text-xl font-bold mt-1" :class="(data?.summary?.belumPmh || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
          {{ data?.summary?.belumPmh || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">Penetapan Majelis</p>
      </div>

      <!-- 4. Belum PPP -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-cyan-400 dark:hover:border-cyan-500"
        :class="{ 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-50/20 dark:bg-cyan-950/20': activeKategori === 'belum_ppp' }"
        @click="setKategori('belum_ppp')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Belum PPP</span>
          <UBadge :color="(data?.summary?.belumPpp || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.summary?.belumPpp || 0 }}
          </UBadge>
        </div>
        <p class="text-xl font-bold mt-1" :class="(data?.summary?.belumPpp || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
          {{ data?.summary?.belumPpp || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">Penetapan Panitera</p>
      </div>

      <!-- 5. Belum PJS -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-amber-400 dark:hover:border-amber-500"
        :class="{ 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20': activeKategori === 'belum_pjs' }"
        @click="setKategori('belum_pjs')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Belum PJS</span>
          <UBadge :color="(data?.summary?.belumPjs || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.summary?.belumPjs || 0 }}
          </UBadge>
        </div>
        <p class="text-xl font-bold mt-1" :class="(data?.summary?.belumPjs || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
          {{ data?.summary?.belumPjs || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">Penetapan Jurusita</p>
      </div>

      <!-- 6. Lengkap Semua -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-emerald-400 dark:hover:border-emerald-500"
        :class="{ 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20': activeKategori === 'sudah_lengkap' }"
        @click="setKategori('sudah_lengkap')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Lengkap</span>
          <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {{ data?.summary?.sudahLengkap || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">Komplit 3 dokumen</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  selectedMonth,
  selectedYear,
  isFilterApplied,
  activeKategori,
  refreshSignal,
  setKategori,
  formatMonthYear
} = useKontrolBerkasPenetapan()

const { data, pending, refresh } = useLazyFetch('/api/kontrol/berkas-penetapan/summary', {
  server: false,
  query: computed(() => ({
    month: selectedMonth.value !== null ? selectedMonth.value : 0,
    year: selectedYear.value
  })),
  immediate: false,
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const complianceBadgeColor = computed(() => {
  const score = data.value?.summary?.persenLengkap || 0
  if (score >= 90) return 'green'
  if (score >= 70) return 'amber'
  return 'red'
})

// Trigger fetch saat filter aktif
watch(
  [selectedMonth, selectedYear, isFilterApplied],
  ([month, year, applied]) => {
    if (applied && month !== null && year) {
      data.value = null
      refresh()
    }
  },
  { immediate: true }
)

// Trigger refresh saat refreshSignal berubah
watch(refreshSignal, () => {
  if (isFilterApplied.value) {
    refresh()
  }
})
</script>
