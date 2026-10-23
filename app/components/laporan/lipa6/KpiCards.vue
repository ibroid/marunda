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
        class="border-l-4 transition-all duration-150 hover:shadow-md"
        :class="getCardBorderColor(card.color)"
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
  selectedRole,
  refreshSignal
} = useLipa6()

const { data: summaryData, pending, refresh } = useLazyFetch('/api/laporan/lipa6/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    role: selectedRole.value
  })),
  watch: [selectedYear, selectedMonth, selectedRole],
  default: () => null
})

watch(refreshSignal, () => {
  refresh()
})

const isLoading = computed(() => pending.value || !summaryData.value)

watch(summaryData, (newVal) => {
  if (newVal?.success) {
    emit('loaded', {
      namaSatker: newVal.namaSatker,
      pejabat: newVal.pejabat
    })
  }
}, { immediate: true })

const summary = computed(() => summaryData.value?.summary || {})

const cardList = computed(() => {
  const s = summary.value
  return [
    {
      title: 'Hakim Aktif',
      value: (s.totalHakim || 0).toLocaleString('id-ID'),
      subtext: 'Pemeriksa perkara',
      icon: 'i-heroicons-user-group',
      color: 'blue'
    },
    {
      title: 'Sisa Bulan Lalu',
      value: (s.sisaLalu || 0).toLocaleString('id-ID'),
      subtext: 'Bawaan bulan lalu',
      icon: 'i-heroicons-arrow-uturn-left',
      color: 'amber'
    },
    {
      title: 'Tambah Bulan Ini',
      value: (s.tambah || 0).toLocaleString('id-ID'),
      subtext: 'Distribusi perkara baru',
      icon: 'i-heroicons-plus-circle',
      color: 'indigo'
    },
    {
      title: 'Beban (Jumlah)',
      value: (s.totalBeban || 0).toLocaleString('id-ID'),
      subtext: 'Total perkara ditangani',
      icon: 'i-heroicons-briefcase',
      color: 'violet'
    },
    {
      title: 'Perkara Diputus',
      value: (s.putus || 0).toLocaleString('id-ID'),
      subtext: `Rasio: ${s.rasioPutus || 0}%`,
      icon: 'i-heroicons-check-badge',
      color: 'emerald'
    },
    {
      title: 'Sisa Bulan Ini',
      value: (s.sisaYbs || 0).toLocaleString('id-ID'),
      subtext: 'Belum diputus akhir bulan',
      icon: 'i-heroicons-clock',
      color: 'orange'
    },
    {
      title: 'Sudah Diminutir',
      value: (s.minutir || 0).toLocaleString('id-ID'),
      subtext: `Belum: ${(s.belumMinutir || 0).toLocaleString('id-ID')}`,
      icon: 'i-heroicons-document-check',
      color: 'teal'
    }
  ]
})

const getCardBorderColor = (color) => {
  const map = {
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    indigo: 'border-l-indigo-500',
    violet: 'border-l-violet-500',
    emerald: 'border-l-emerald-500',
    orange: 'border-l-orange-500',
    teal: 'border-l-teal-500'
  }
  return map[color] || 'border-l-gray-400'
}

const getCardIconColor = (color) => {
  const map = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    indigo: 'text-indigo-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    teal: 'text-teal-500'
  }
  return map[color] || 'text-gray-400'
}

const getCardValueColor = (color) => {
  const map = {
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    violet: 'text-violet-600 dark:text-violet-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    orange: 'text-orange-600 dark:text-orange-400',
    teal: 'text-teal-600 dark:text-teal-400'
  }
  return map[color] || 'text-gray-900 dark:text-white'
}
</script>
