<template>
  <UCard class="lg:col-span-2">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-primary-500" />
          Grafik Komparasi Bulanan Perkara ({{ selectedYear }})
        </h3>
        <div class="flex items-center gap-4 text-xs font-medium">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Masuk</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-green-500 inline-block"></span> Putus</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span> Minutasi</span>
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div class="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-gray-200 dark:border-gray-700">
        <div v-for="i in 12" :key="i" class="flex-1 flex flex-col items-center justify-end h-full gap-2">
          <USkeleton class="w-full h-32 rounded-t" />
          <USkeleton class="w-6 h-3" />
        </div>
      </div>
    </template>

    <!-- Bar Chart CSS Layout -->
    <template v-else>
      <div class="h-64 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-gray-200 dark:border-gray-700">
        <div
          v-for="(label, idx) in data?.grafik?.labels || []"
          :key="label"
          class="flex-1 flex flex-col items-center h-full justify-end group relative"
        >
          <!-- Tooltip -->
          <div class="hidden group-hover:block absolute -top-12 bg-gray-900 text-white text-[11px] py-1 px-2 rounded shadow-md z-10 whitespace-nowrap">
            {{ label }}: Masuk {{ data?.grafik?.masuk[idx] }} | Putus {{ data?.grafik?.putus[idx] }} | Minut {{ data?.grafik?.minutasi[idx] }}
          </div>
          <!-- Bars Container -->
          <div class="w-full flex items-end justify-center gap-1 h-full">
            <div
              class="w-2 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              :style="{ height: getBarHeight(data?.grafik?.masuk[idx]) }"
            ></div>
            <div
              class="w-2 bg-green-500 rounded-t transition-all hover:bg-green-600"
              :style="{ height: getBarHeight(data?.grafik?.putus[idx]) }"
            ></div>
            <div
              class="w-2 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
              :style="{ height: getBarHeight(data?.grafik?.minutasi[idx]) }"
            ></div>
          </div>
          <span class="text-[11px] text-gray-400 mt-2">{{ label }}</span>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardEksekutif()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/eksekutif/grafik', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

function getBarHeight(val) {
  if (!val) return '2px'
  const allVals = [
    ...(data.value?.grafik?.masuk || []),
    ...(data.value?.grafik?.putus || []),
    ...(data.value?.grafik?.minutasi || [])
  ]
  const max = Math.max(...allVals, 10)
  const pct = Math.min(100, Math.round((val / max) * 100))
  return `${Math.max(4, pct)}%`
}

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
