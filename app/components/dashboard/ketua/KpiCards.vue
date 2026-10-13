<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <!-- Skeleton Cards untuk 5 Kartu Summary -->
    <template v-if="isLoading">
      <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-7 w-16" />
        <USkeleton class="h-3 w-20" />
      </div>
    </template>

    <!-- Real Cards untuk 5 Kartu Summary -->
    <template v-else>
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Masuk Tahun Ini</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ data?.summary?.totalMasuk || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Sisa lalu: {{ data?.summary?.sisaLalu || 0 }}</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-green-600 dark:text-green-400">Putus Tahun Ini</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{{ data?.summary?.totalPutus || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.rasioPenyelesaian }}%</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-purple-600 dark:text-purple-400">Minutasi</p>
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{{ data?.summary?.totalMinutasi || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Rasio: {{ data?.summary?.rasioMinutasi }}%</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-orange-600 dark:text-orange-400">Sisa Perkara</p>
        <p class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ data?.summary?.sisaPerkara || 0 }}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">Beban: {{ data?.summary?.bebanPerkara || 0 }}</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs font-medium text-amber-600 dark:text-amber-400">Belum PMH</p>
        <p class="text-2xl font-bold mt-1" :class="(data?.summary?.belumPmh || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'">
          {{ data?.summary?.belumPmh || 0 }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">Perlu penetapan ketua</p>
      </UCard>
    </template>

    <!-- Kartu ke-6: Total Tunggakan (dikonsumsi dari endpoint / data aging yang dibagikan) -->
    <div v-if="!sharedAging" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
      <USkeleton class="h-3.5 w-24" />
      <USkeleton class="h-7 w-16" />
      <USkeleton class="h-3 w-20" />
    </div>
    <UCard v-else :ui="{ body: { padding: 'p-4' } }">
      <p class="text-xs font-medium text-rose-600 dark:text-rose-400">Total Tunggakan</p>
      <p class="text-2xl font-bold mt-1" :class="(sharedAging?.totalTunggakan || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'">
        {{ sharedAging?.totalTunggakan || 0 }}
      </p>
      <p class="text-[11px] text-gray-400 mt-0.5">Usia &gt; 3 bulan</p>
    </UCard>
  </div>
</template>

<script setup>
const { selectedYear, namaSatker, sharedAging, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/summary', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.namaSatker) {
    namaSatker.value = newVal.namaSatker
  }
})

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
