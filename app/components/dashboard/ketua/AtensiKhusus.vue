<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <UIcon name="i-heroicons-bell-alert" class="text-amber-500 w-4 h-4" />
      Atensi Khusus Pimpinan (Actionable Items)
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Skeleton Cards -->
      <template v-if="isLoading">
        <div v-for="i in 3" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-3.5 w-36" />
            <USkeleton class="h-5 w-14 rounded-full" />
          </div>
          <USkeleton class="h-6 w-28" />
          <USkeleton class="h-3 w-48" />
        </div>
      </template>

      <!-- Real Cards -->
      <template v-else>
        <!-- 1. Belum PMH -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4" :class="(data?.atensi?.belumPmh?.total || 0) > 0 ? 'border-l-red-500' : 'border-l-green-500'">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Perkara Belum PMH</span>
            <UBadge :color="(data?.atensi?.belumPmh?.total || 0) > 0 ? 'red' : 'green'" variant="subtle" size="xs">
              {{ data?.atensi?.belumPmh?.total || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ (data?.atensi?.belumPmh?.total || 0) > 0 ? 'Perlu Segera Ditunjuk Majelis' : 'Lengkap Terdisposisi' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Kewenangan Ketua untuk menetapkan majelis hakim pemeriksa perkara
          </p>
        </div>

        <!-- 2. Putus Hari Ini -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Putus Hari Ini</span>
            <UBadge color="amber" variant="subtle" size="xs">
              {{ data?.atensi?.putusHariIni?.total || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.putusHariIni?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Monitoring One Day Minutation &amp; upload e-doc putusan hari ini
          </p>
        </div>

        <!-- 3. Putus Belum Upload e-Doc -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-purple-500">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Tunggakan e-Doc Putusan</span>
            <UBadge color="purple" variant="subtle" size="xs">
              {{ data?.atensi?.putusBelumEdoc?.total || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.putusBelumEdoc?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Perkara putus yang belum mengunggah dokumen elektronik putusan akhir
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/atensi', {
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
