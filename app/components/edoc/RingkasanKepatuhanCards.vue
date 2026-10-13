<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2">
        <USkeleton class="h-3.5 w-32" />
        <USkeleton class="h-7 w-24" />
        <USkeleton class="h-3 w-40" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Total Putus -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <p class="text-xs text-gray-500">Total Putus Tahun Ini</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ data?.summary?.totalPutus || 0 }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Wajib memiliki dokumen elektronik</p>
      </UCard>

      <!-- Belum Upload Putusan (Interactive Filter) -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500 cursor-pointer transition hover:bg-rose-50/20"
        :class="{ 'ring-2 ring-rose-500': activeKategori === 'belum_edoc' }"
        @click="setKategori('belum_edoc')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Belum Upload Putusan</span>
          <UBadge color="red" size="xs">{{ data?.summary?.belumEdoc || 0 }}</UBadge>
        </div>
        <p class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          {{ data?.summary?.belumEdoc || 0 }} Perkara
        </p>
        <p class="text-xs text-gray-400 mt-1">File amar_putusan_dok kosong</p>
      </div>

      <!-- Belum Anonimisasi (Interactive Filter) -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500 cursor-pointer transition hover:bg-amber-50/20"
        :class="{ 'ring-2 ring-amber-500': activeKategori === 'belum_anonim' }"
        @click="setKategori('belum_anonim')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Belum Anonimisasi</span>
          <UBadge color="amber" size="xs">{{ data?.summary?.belumAnonim || 0 }}</UBadge>
        </div>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {{ data?.summary?.belumAnonim || 0 }} Perkara
        </p>
        <p class="text-xs text-gray-400 mt-1">Belum ada file salinan publik</p>
      </div>

      <!-- Kepatuhan Lengkap -->
      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-emerald-500">
        <p class="text-xs text-gray-500">Kepatuhan Lengkap</p>
        <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {{ data?.summary?.persenLengkap || 0 }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">{{ data?.summary?.lengkap || 0 }} perkara lengkap keduanya</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, activeKategori, refreshSignal, setKategori } = useEdoc()

const { data, pending, refresh } = useLazyFetch('/api/edoc/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
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
