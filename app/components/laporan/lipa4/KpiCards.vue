<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
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
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
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
} = useLipa4()

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa4/summary', {
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
    title: 'Sisa Lalu',
    value: summary.value.sisaBulanLalu ?? 0,
    subtext: 'Bulan sebelumnya',
    color: 'gray',
    icon: 'i-heroicons-arrow-uturn-left',
    filterKey: 'all'
  },
  {
    title: 'Permohonan',
    value: summary.value.terimaBulanIni ?? 0,
    subtext: 'Bulan ini',
    color: 'blue',
    icon: 'i-heroicons-document-arrow-up',
    filterKey: 'mohon_bulan_ini'
  },
  {
    title: 'Total Beban',
    value: summary.value.totalBeban ?? 0,
    subtext: 'Sisa lalu + masuk',
    color: 'indigo',
    icon: 'i-heroicons-calculator',
    filterKey: 'all'
  },
  {
    title: 'Putus PK',
    value: summary.value.putusBulanIni ?? 0,
    subtext: 'Diputus MA bulan ini',
    color: 'emerald',
    icon: 'i-heroicons-check-circle',
    filterKey: 'putus_bulan_ini'
  },
  {
    title: 'Sisa Akhir',
    value: summary.value.sisaAkhirBulan ?? 0,
    subtext: 'Belum diputus MA',
    color: 'amber',
    icon: 'i-heroicons-clock',
    filterKey: 'proses_ma'
  },
  {
    title: 'Belum Kirim',
    value: summary.value.belumKirimMA ?? 0,
    subtext: 'Berkas belum ke MA',
    color: 'rose',
    icon: 'i-heroicons-paper-airplane',
    filterKey: 'belum_kirim'
  },
  {
    title: 'Belum Kembali',
    value: summary.value.belumKembaliPA ?? 0,
    subtext: 'Putus tapi di MA',
    color: 'purple',
    icon: 'i-heroicons-inbox-arrow-down',
    filterKey: 'belum_kembali'
  }
])

const setFilter = (key) => {
  if (key) {
    statusFilter.value = statusFilter.value === key && key !== 'all' ? 'all' : key
  }
}

const getCardBorderColor = (color) => {
  switch (color) {
    case 'blue': return 'border-l-blue-500'
    case 'emerald': return 'border-l-emerald-500'
    case 'amber': return 'border-l-amber-500'
    case 'rose': return 'border-l-rose-500'
    case 'purple': return 'border-l-purple-500'
    case 'indigo': return 'border-l-indigo-500'
    default: return 'border-l-gray-400'
  }
}

const getCardIconColor = (color) => {
  switch (color) {
    case 'blue': return 'text-blue-500'
    case 'emerald': return 'text-emerald-500'
    case 'amber': return 'text-amber-500'
    case 'rose': return 'text-rose-500'
    case 'purple': return 'text-purple-500'
    case 'indigo': return 'text-indigo-500'
    default: return 'text-gray-400'
  }
}

const getCardValueColor = (color) => {
  switch (color) {
    case 'blue': return 'text-blue-600 dark:text-blue-400'
    case 'emerald': return 'text-emerald-600 dark:text-emerald-400'
    case 'amber': return 'text-amber-600 dark:text-amber-400'
    case 'rose': return 'text-rose-600 dark:text-rose-400'
    case 'purple': return 'text-purple-600 dark:text-purple-400'
    case 'indigo': return 'text-indigo-600 dark:text-indigo-400'
    default: return 'text-gray-800 dark:text-gray-200'
  }
}
</script>
