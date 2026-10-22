<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/75 dark:bg-gray-800/80 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          Rekapitulasi Keadaan Perkara (LIPA 1)
        </h2>
      </div>
      <UBadge color="gray" variant="subtle" size="xs">
        Bulan {{ getNamaBulan(selectedMonth) }} {{ selectedYear }}
      </UBadge>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="p-4 space-y-3">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-full" />
    </div>

    <!-- Tabel Rekapitulasi Sesuai Gambar 2 -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm text-left border-collapse">
        <thead>
          <tr class="bg-gray-100/80 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-700">
            <th class="py-2.5 px-4 w-1/2 min-w-[240px]">Rekapitulasi</th>
            <th class="py-2.5 px-3 text-center w-1/8 min-w-[70px]">G (Gugatan)</th>
            <th class="py-2.5 px-3 text-center w-1/8 min-w-[70px]">P (Permohonan)</th>
            <th class="py-2.5 px-3 text-center w-1/8 min-w-[70px]">G.S</th>
            <th class="py-2.5 px-3 text-center w-1/8 min-w-[80px] bg-primary-50/50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
          <!-- 1. Sisa Bulan Lalu -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">1. Sisa Bulan Lalu</td>
            <td class="py-2.5 px-3 text-center font-semibold">{{ formatNumber(rekapData?.g?.sisaBulanLalu) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold">{{ formatNumber(rekapData?.p?.sisaBulanLalu) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold">{{ formatNumber(rekapData?.gs?.sisaBulanLalu) }}</td>
            <td class="py-2.5 px-3 text-center font-bold bg-primary-50/30 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.sisaBulanLalu) }}
            </td>
          </tr>

          <!-- 2. Terima Bulan ini -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">2. Terima Bulan ini</td>
            <td class="py-2.5 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">{{ formatNumber(rekapData?.g?.terimaBulanIni) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">{{ formatNumber(rekapData?.p?.terimaBulanIni) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">{{ formatNumber(rekapData?.gs?.terimaBulanIni) }}</td>
            <td class="py-2.5 px-3 text-center font-bold bg-primary-50/30 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.terimaBulanIni) }}
            </td>
          </tr>

          <!-- 3. Putus -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">3. Putus</td>
            <td class="py-2.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{{ formatNumber(rekapData?.g?.putus) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{{ formatNumber(rekapData?.p?.putus) }}</td>
            <td class="py-2.5 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{{ formatNumber(rekapData?.gs?.putus) }}</td>
            <td class="py-2.5 px-3 text-center font-bold bg-primary-50/30 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.putus) }}
            </td>
          </tr>

          <!-- 4. Sisa Akhir Bulan -->
          <tr class="bg-gray-50/80 dark:bg-gray-700/50 font-semibold text-gray-900 dark:text-white">
            <td class="py-2.5 px-4">4. Sisa Akhir Bulan</td>
            <td class="py-2.5 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">{{ formatNumber(rekapData?.g?.sisaAkhirBulan) }}</td>
            <td class="py-2.5 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">{{ formatNumber(rekapData?.p?.sisaAkhirBulan) }}</td>
            <td class="py-2.5 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">{{ formatNumber(rekapData?.gs?.sisaAkhirBulan) }}</td>
            <td class="py-2.5 px-3 text-center font-extrabold bg-primary-100/50 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200">
              {{ formatNumber(rekapData?.total?.sisaAkhirBulan) }}
            </td>
          </tr>

          <!-- 4.a. Sudah dibagi -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2 px-4 pl-8 text-gray-600 dark:text-gray-400 italic">a. Sudah dibagi</td>
            <td class="py-2 px-3 text-center">{{ formatNumber(rekapData?.g?.sudahDibagi) }}</td>
            <td class="py-2 px-3 text-center">{{ formatNumber(rekapData?.p?.sudahDibagi) }}</td>
            <td class="py-2 px-3 text-center">{{ formatNumber(rekapData?.gs?.sudahDibagi) }}</td>
            <td class="py-2 px-3 text-center font-semibold bg-primary-50/20 dark:bg-primary-950/10 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.sudahDibagi) }}
            </td>
          </tr>

          <!-- 4.b. Belum dibagi -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2 px-4 pl-8 text-gray-600 dark:text-gray-400 italic">b. Belum dibagi</td>
            <td class="py-2 px-3 text-center" :class="rekapData?.g?.belumDibagi > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''">
              {{ formatNumber(rekapData?.g?.belumDibagi) }}
            </td>
            <td class="py-2 px-3 text-center" :class="rekapData?.p?.belumDibagi > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''">
              {{ formatNumber(rekapData?.p?.belumDibagi) }}
            </td>
            <td class="py-2 px-3 text-center" :class="rekapData?.gs?.belumDibagi > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''">
              {{ formatNumber(rekapData?.gs?.belumDibagi) }}
            </td>
            <td class="py-2 px-3 text-center font-semibold bg-primary-50/20 dark:bg-primary-950/10 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.belumDibagi) }}
            </td>
          </tr>

          <!-- 5. Sisa belum diminutasi -->
          <tr class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">5. Sisa belum diminutasi</td>
            <td class="py-2.5 px-3 text-center font-semibold" :class="rekapData?.g?.sisaBelumMinutasi > 0 ? 'text-orange-600 dark:text-orange-400' : ''">
              {{ formatNumber(rekapData?.g?.sisaBelumMinutasi) }}
            </td>
            <td class="py-2.5 px-3 text-center font-semibold" :class="rekapData?.p?.sisaBelumMinutasi > 0 ? 'text-orange-600 dark:text-orange-400' : ''">
              {{ formatNumber(rekapData?.p?.sisaBelumMinutasi) }}
            </td>
            <td class="py-2.5 px-3 text-center font-semibold" :class="rekapData?.gs?.sisaBelumMinutasi > 0 ? 'text-orange-600 dark:text-orange-400' : ''">
              {{ formatNumber(rekapData?.gs?.sisaBelumMinutasi) }}
            </td>
            <td class="py-2.5 px-3 text-center font-bold bg-primary-50/30 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300">
              {{ formatNumber(rekapData?.total?.sisaBelumMinutasi) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  refreshSignal,
  getNamaBulan
} = useLipa1()

const emit = defineEmits(['loaded'])

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa1/rekap', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value
  })),
  watch: [selectedYear, selectedMonth],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
const rekapData = computed(() => data.value?.rekap || null)

watch(data, (newVal) => {
  if (newVal?.namaSatker) {
    emit('loaded', {
      namaSatker: newVal.namaSatker,
      rekap: newVal.rekap
    })
  }
}, { immediate: true })

watch(refreshSignal, () => {
  refresh()
})

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('id-ID')
}
</script>
