<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
      <div
        v-for="i in 7"
        :key="i"
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2 animate-pulse"
      >
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-2.5 w-24" />
      </div>
    </div>

    <!-- Real Content KPI Cards -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
      <UCard
        v-for="(card, idx) in cardList"
        :key="idx"
        :ui="{ body: { padding: 'p-3.5' } }"
        class="border-l-4 transition-all duration-150 hover:shadow-md cursor-pointer"
        :class="[
          getCardBorderColor(card.color),
          statusFilter === card.filterKey ? 'ring-2 ring-primary-500 bg-primary-50/20 dark:bg-primary-950/20' : ''
        ]"
        @click="setFilter(card.filterKey)"
      >
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
            {{ card.title }}
          </p>
          <UIcon
            v-if="card.icon"
            :name="card.icon"
            class="w-4 h-4 shrink-0"
            :class="getCardIconColor(card.color)"
          />
        </div>

        <p class="text-xl sm:text-2xl font-bold mt-1" :class="getCardValueColor(card.color)">
          {{ card.value }}
        </p>

        <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {{ card.subtext }}
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['loaded'])

const {
  selectedYear,
  selectedMonth,
  statusFilter,
  refreshSignal
} = useLipa5()

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa5/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value
  })),
  watch: [selectedYear, selectedMonth],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (val) => {
  if (val?.namaSatker) {
    emit('loaded', {
      namaSatker: val.namaSatker,
      pejabat: val.pejabat,
      summary: val.summary
    })
  }
}, { immediate: true })

watch(refreshSignal, () => {
  refresh()
})

const summary = computed(() => data.value?.summary || {})

const cardList = computed(() => [
  {
    title: 'Total Eksekusi',
    value: summary.value.totalLaporan ?? 0,
    subtext: 'Bulan terpilih',
    color: 'blue',
    icon: 'i-heroicons-bolt',
    filterKey: 'all'
  },
  {
    title: 'Permohonan Baru',
    value: summary.value.mohonBulanIni ?? 0,
    subtext: 'Masuk bulan ini',
    color: 'emerald',
    icon: 'i-heroicons-arrow-down-tray',
    filterKey: 'mohon_bulan_ini'
  },
  {
    title: 'Sisa Lalu',
    value: summary.value.sisaBulanLalu ?? 0,
    subtext: 'Bulan sebelumnya',
    color: 'gray',
    icon: 'i-heroicons-arrow-uturn-left',
    filterKey: 'all'
  },
  {
    title: 'Aanmaning',
    value: summary.value.aanmaning ?? 0,
    subtext: 'Proses teguran',
    color: 'amber',
    icon: 'i-heroicons-megaphone',
    filterKey: 'aanmaning'
  },
  {
    title: 'Sita Eksekusi',
    value: summary.value.sita ?? 0,
    subtext: 'Penetapan/Pelaksanaan',
    color: 'purple',
    icon: 'i-heroicons-lock-closed',
    filterKey: 'sita'
  },
  {
    title: 'Eksekusi Rill',
    value: summary.value.eksekusiRill ?? 0,
    subtext: 'Perintah/Pelaksanaan',
    color: 'rose',
    icon: 'i-heroicons-shield-check',
    filterKey: 'eksekusi_rill'
  },
  {
    title: 'Non-Eksekutabel',
    value: summary.value.nonEksekutabel ?? 0,
    subtext: 'Penetapan non-eks',
    color: 'red',
    icon: 'i-heroicons-x-circle',
    filterKey: 'non_eksekutabel'
  }
])

const setFilter = (key) => {
  if (statusFilter.value === key) {
    statusFilter.value = 'all'
  } else {
    statusFilter.value = key
  }
}

const getCardBorderColor = (color) => {
  const map = {
    blue: 'border-l-blue-500',
    emerald: 'border-l-emerald-500',
    gray: 'border-l-gray-400',
    amber: 'border-l-amber-500',
    purple: 'border-l-purple-500',
    rose: 'border-l-rose-500',
    red: 'border-l-red-500'
  }
  return map[color] || 'border-l-gray-300'
}

const getCardIconColor = (color) => {
  const map = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    gray: 'text-gray-400',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
    rose: 'text-rose-500',
    red: 'text-red-500'
  }
  return map[color] || 'text-gray-400'
}

const getCardValueColor = (color) => {
  const map = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    gray: 'text-gray-700 dark:text-gray-300',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
    rose: 'text-rose-600 dark:text-rose-400',
    red: 'text-red-600 dark:text-red-400'
  }
  return map[color] || 'text-gray-900 dark:text-white'
}
</script>
