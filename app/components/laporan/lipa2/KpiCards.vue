<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <div
        v-for="i in 6"
        :key="i"
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2 animate-pulse"
      >
        <USkeleton class="h-3 w-24" />
        <USkeleton class="h-6 w-16" />
        <USkeleton class="h-2.5 w-28" />
      </div>
    </div>

    <!-- Real Content KPI Cards -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
} = useLipa2()

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa2/summary', {
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
    emit('loaded', { namaSatker: val.namaSatker, summary: val.summary })
  }
}, { immediate: true })

watch(refreshSignal, () => {
  refresh()
})

const cardList = computed(() => {
  const sum = data.value?.summary || {
    sisaBulanLalu: 0,
    terimaBulanIni: 0,
    totalBeban: 0,
    putusBulanIni: 0,
    sisaAkhirBulan: 0,
    belumKirimPTA: 0,
    belumKembaliPA: 0
  }

  return [
    {
      title: 'Sisa Lalu',
      value: sum.sisaBulanLalu.toLocaleString('id-ID'),
      subtext: 'Belum putus bln lalu',
      color: 'blue',
      icon: 'i-heroicons-arrow-path',
      filterKey: 'all'
    },
    {
      title: 'Mohon Ini',
      value: sum.terimaBulanIni.toLocaleString('id-ID'),
      subtext: 'Banding bulan ini',
      color: 'purple',
      icon: 'i-heroicons-plus-circle',
      filterKey: 'mohon_bulan_ini'
    },
    {
      title: 'Total Beban',
      value: sum.totalBeban.toLocaleString('id-ID'),
      subtext: 'Perkara diproses',
      color: 'indigo',
      icon: 'i-heroicons-scale',
      filterKey: 'all'
    },
    {
      title: 'Putus Ini',
      value: sum.putusBulanIni.toLocaleString('id-ID'),
      subtext: 'Putus banding bln ini',
      color: 'emerald',
      icon: 'i-heroicons-check-circle',
      filterKey: 'putus_bulan_ini'
    },
    {
      title: 'Sisa Belum Putus',
      value: sum.sisaAkhirBulan.toLocaleString('id-ID'),
      subtext: 'Akhir bulan laporan',
      color: 'amber',
      icon: 'i-heroicons-clock',
      filterKey: 'proses_pta'
    },
    {
      title: 'Belum Kirim PTA',
      value: sum.belumKirimPTA.toLocaleString('id-ID'),
      subtext: 'Berkas belum dikirim',
      color: 'rose',
      icon: 'i-heroicons-exclamation-triangle',
      filterKey: 'belum_kirim'
    }
  ]
})

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
    purple: 'border-l-purple-500',
    indigo: 'border-l-indigo-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500'
  }
  return map[color] || 'border-l-gray-400'
}

const getCardIconColor = (color) => {
  const map = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500'
  }
  return map[color] || 'text-gray-400'
}

const getCardValueColor = (color) => {
  const map = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400'
  }
  return map[color] || 'text-gray-900 dark:text-white'
}
</script>
