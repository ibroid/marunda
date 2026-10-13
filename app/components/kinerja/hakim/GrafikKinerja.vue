<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <!-- Tren Bulanan Masuk vs Putus (2 Kolom di Desktop) -->
    <UCard class="lg:col-span-2 shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5 text-primary-500" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Tren Bulanan: Perkara Masuk vs Putus ({{ selectedYear }})
            </h3>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-blue-500 inline-block"></span>
              <span class="text-gray-500 dark:text-gray-400">Masuk</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              <span class="text-gray-500 dark:text-gray-400">Putus</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="h-56 flex items-end justify-between gap-2 p-2">
        <div v-for="i in 12" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
          <USkeleton class="w-full rounded-t" :style="{ height: `${20 + (i * 7) % 60}%` }" />
          <USkeleton class="h-3 w-6" />
        </div>
      </div>

      <!-- Real Monthly Chart Bars -->
      <div v-else class="h-56 flex items-end justify-between gap-1.5 sm:gap-2 px-1 pt-4 pb-2">
        <div
          v-for="b in trenBulanan"
          :key="b.bulanNum"
          class="flex-1 flex flex-col items-center h-full justify-end group relative"
        >
          <!-- Tooltip Hover Popover -->
          <div class="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[10px] rounded px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap">
            <span class="font-bold">{{ b.bulanNama }}</span>
            <span>Masuk: {{ b.masuk }} | Putus: {{ b.putus }}</span>
          </div>

          <!-- Dual Bars -->
          <div class="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-44">
            <!-- Bar Masuk -->
            <div class="w-1/2 max-w-[14px] flex flex-col items-center justify-end h-full">
              <div
                class="w-full bg-blue-400 dark:bg-blue-500/80 rounded-t transition-all duration-300 group-hover:bg-blue-600"
                :style="{ height: `${maxMonthlyVal > 0 ? (b.masuk / maxMonthlyVal) * 100 : 0}%` }"
              ></div>
            </div>
            <!-- Bar Putus -->
            <div class="w-1/2 max-w-[14px] flex flex-col items-center justify-end h-full">
              <div
                class="w-full bg-emerald-400 dark:bg-emerald-500/80 rounded-t transition-all duration-300 group-hover:bg-emerald-600"
                :style="{ height: `${maxMonthlyVal > 0 ? (b.putus / maxMonthlyVal) * 100 : 0}%` }"
              ></div>
            </div>
          </div>

          <!-- Label Bulan -->
          <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {{ b.bulanNama }}
          </span>
        </div>
      </div>
    </UCard>

    <!-- Komposisi Jenis Perkara (1 Kolom di Desktop) -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-pie-chart" class="w-5 h-5 text-indigo-500" />
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Distribusi Jenis Perkara
          </h3>
        </div>
      </template>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="space-y-4 py-2">
        <div v-for="i in 4" :key="i" class="space-y-1.5">
          <div class="flex justify-between">
            <USkeleton class="h-3 w-28" />
            <USkeleton class="h-3 w-12" />
          </div>
          <USkeleton class="h-2 w-full rounded-full" />
        </div>
      </div>

      <!-- Real Data List -->
      <div v-else class="space-y-3.5 py-1">
        <div
          v-for="(item, idx) in komposisiJenis"
          :key="item.jenis || idx"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
              {{ item.jenis }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="font-bold text-gray-900 dark:text-white">{{ item.total }}</span>
              <span class="text-[10px] text-gray-400">({{ getPercentage(item.total) }}%)</span>
            </div>
          </div>
          <div class="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="getBarColorClass(idx)"
              :style="{ width: `${getPercentage(item.total)}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-[10px] text-gray-400">
            <span>Putus: {{ item.putus }}</span>
            <span>Sisa: {{ item.total - item.putus }}</span>
          </div>
        </div>

        <div v-if="!komposisiJenis.length" class="text-center py-8 text-xs text-gray-400">
          Tidak ada data jenis perkara
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const {
  hakimId,
  selectedYear,
  roleFilter,
  refreshSignal
} = useKinerjaHakimDetail()

const { data, pending, refresh } = useLazyFetch(
  () => `/api/kinerja/hakim/${hakimId.value}/grafik`,
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
const trenBulanan = computed(() => data.value?.trenBulanan || [])
const komposisiJenis = computed(() => data.value?.komposisiJenis || [])

const maxMonthlyVal = computed(() => {
  let max = 1
  trenBulanan.value.forEach((b) => {
    if (b.masuk > max) max = b.masuk
    if (b.putus > max) max = b.putus
  })
  return max
})

const totalSemuaJenis = computed(() => {
  return komposisiJenis.value.reduce((acc, curr) => acc + curr.total, 0)
})

const getPercentage = (val) => {
  if (!totalSemuaJenis.value) return 0
  return Number(((val / totalSemuaJenis.value) * 100).toFixed(1))
}

const getBarColorClass = (idx) => {
  const colors = [
    'bg-primary-500',
    'bg-indigo-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-purple-500'
  ]
  return colors[idx % colors.length]
}

watch(refreshSignal, () => {
  refresh()
})
</script>
