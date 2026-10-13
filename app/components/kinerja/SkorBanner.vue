<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div v-for="i in 2" :key="i" class="rounded-xl p-6 bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-between">
        <div class="space-y-2 flex-1">
          <USkeleton class="h-3.5 w-36" />
          <USkeleton class="h-10 w-24" />
          <USkeleton class="h-3 w-48" />
        </div>
        <USkeleton class="w-16 h-16 rounded-full" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <div class="bg-gradient-to-br from-indigo-900 to-primary-900 text-white rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-primary-200 uppercase tracking-wider">Nilai Akhir Raport SIPP</span>
          <p class="text-4xl font-extrabold mt-1">{{ data?.skor?.nilaiAkhir || 0 }}%</p>
          <p class="text-xs text-primary-200 mt-1">Rata-rata 4 variabel evaluasi kinerja</p>
        </div>
        <div class="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10">
          🏆
        </div>
      </div>

      <div class="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Total Persentase Terpadu</span>
          <p class="text-4xl font-extrabold mt-1">{{ data?.skor?.totalPersentase || 0 }}%</p>
          <p class="text-xs text-emerald-200 mt-1">Bobot: 30% Putus + 30% Minutasi + 40% Dirput</p>
        </div>
        <div class="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-lg bg-white/10">
          ⭐
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal } = useKinerja()

const { data, pending, refresh } = useLazyFetch('/api/kinerja/skor', {
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
