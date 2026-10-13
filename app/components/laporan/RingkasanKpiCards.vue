<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2 animate-pulse"
      >
        <USkeleton class="h-3.5 w-32" />
        <USkeleton class="h-7 w-20" />
        <USkeleton class="h-3 w-40" />
      </div>
    </div>

    <!-- Real Content (Dinamis per jenis LIPA) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard
        v-for="(card, idx) in cardList"
        :key="idx"
        :ui="{ body: { padding: 'p-4' } }"
        class="border-l-4 transition-all duration-150 hover:shadow-md"
        :class="getCardBorderColor(card.color)"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ card.title }}
          </p>
          <UIcon
            v-if="card.icon"
            :name="card.icon"
            class="w-4 h-4"
            :class="getCardIconColor(card.color)"
          />
        </div>

        <p class="text-2xl font-bold mt-1" :class="getCardValueColor(card.color)">
          {{ card.value }}
        </p>

        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ card.subtext }}
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, selectedMonth, selectedLipa, refreshSignal } = useLaporan()

const { data, pending, refresh } = useLazyFetch('/api/laporan/ringkasan', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis: selectedLipa.value
  })),
  watch: [selectedYear, selectedMonth, selectedLipa],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const cardList = computed(() => {
  if (data.value?.cards && Array.isArray(data.value.cards)) {
    return data.value.cards
  }

  // Fallback LIPA 1 jika data lama
  const s = data.value?.summary || {}
  return [
    { title: 'Total Beban Perkara', value: s.totalBeban || 0, subtext: `Sisa lalu (${s.sisaLalu || 0}) + Masuk (${s.masuk || 0})`, color: 'blue', icon: 'i-heroicons-scale' },
    { title: 'Diputus Bulan Ini', value: s.putus || 0, subtext: `Minutasi: ${s.minutasi || 0} perkara`, color: 'emerald', icon: 'i-heroicons-check-circle' },
    { title: 'Sisa Akhir Bulan', value: s.sisaAkhir || 0, subtext: 'Perkara belum diputus', color: 'amber', icon: 'i-heroicons-clock' },
    { title: 'Rasio Penyelesaian', value: `${s.rasio || 0}%`, subtext: 'Produktivitas putusan', color: 'primary', icon: 'i-heroicons-chart-pie' }
  ]
})

function getCardBorderColor(color) {
  switch (color) {
    case 'blue': return 'border-l-blue-500'
    case 'indigo': return 'border-l-indigo-500'
    case 'emerald':
    case 'green': return 'border-l-emerald-500'
    case 'amber':
    case 'yellow': return 'border-l-amber-500'
    case 'red':
    case 'rose': return 'border-l-rose-500'
    case 'purple': return 'border-l-purple-500'
    case 'orange': return 'border-l-orange-500'
    default: return 'border-l-primary-500'
  }
}

function getCardIconColor(color) {
  switch (color) {
    case 'blue': return 'text-blue-500'
    case 'indigo': return 'text-indigo-500'
    case 'emerald':
    case 'green': return 'text-emerald-500'
    case 'amber':
    case 'yellow': return 'text-amber-500'
    case 'red':
    case 'rose': return 'text-rose-500'
    case 'purple': return 'text-purple-500'
    case 'orange': return 'text-orange-500'
    default: return 'text-primary-500'
  }
}

function getCardValueColor(color) {
  switch (color) {
    case 'blue': return 'text-blue-700 dark:text-blue-300'
    case 'indigo': return 'text-indigo-700 dark:text-indigo-300'
    case 'emerald':
    case 'green': return 'text-emerald-700 dark:text-emerald-300'
    case 'amber':
    case 'yellow': return 'text-amber-700 dark:text-amber-300'
    case 'red':
    case 'rose': return 'text-rose-700 dark:text-rose-300'
    case 'purple': return 'text-purple-700 dark:text-purple-300'
    case 'orange': return 'text-orange-700 dark:text-orange-300'
    default: return 'text-primary-700 dark:text-primary-300'
  }
}

watch([selectedYear, selectedMonth, selectedLipa], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
