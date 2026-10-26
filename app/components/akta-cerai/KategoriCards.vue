<template>
  <div>
    <!-- 3 Kategori Kartu Monitoring Akta Cerai -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2">
        <USkeleton class="h-3.5 w-32" />
        <USkeleton class="h-7 w-24" />
        <USkeleton class="h-3 w-44" />
      </div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Cerai Gugat: Belum Terbit Akta Cerai -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500 cursor-pointer transition hover:bg-rose-50/20"
        :class="{ 'ring-2 ring-rose-500': activeKategori === 'cg_belum_ac' }"
        @click="setKategori('cg_belum_ac')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Cerai Gugat (CG)</span>
          <UBadge color="rose" size="xs">{{ data?.summary?.cgBelumAc || 0 }}</UBadge>
        </div>
        <p class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          {{ data?.summary?.cgBelumAc || 0 }} Perkara
        </p>
        <p class="text-xs text-gray-400 mt-1">Sudah BHT, Akta Cerai belum terbit</p>
      </div>

      <!-- 2. Cerai Talak: Belum Sidang Ikrar -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500 cursor-pointer transition hover:bg-amber-50/20"
        :class="{ 'ring-2 ring-amber-500': activeKategori === 'ct_belum_ikrar' }"
        @click="setKategori('ct_belum_ikrar')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Cerai Talak (CT)</span>
          <UBadge color="amber" size="xs">{{ data?.summary?.ctBelumIkrar || 0 }}</UBadge>
        </div>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {{ data?.summary?.ctBelumIkrar || 0 }} Perkara
        </p>
        <p class="text-xs text-gray-400 mt-1">Sudah BHT, belum pelaksanaan Ikrar Talak</p>
      </div>

      <!-- 3. Akta Cerai Belum Diambil -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-blue-500 cursor-pointer transition hover:bg-blue-50/20"
        :class="{ 'ring-2 ring-blue-500': activeKategori === 'belum_diambil' }"
        @click="setKategori('belum_diambil')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Fisik Akta Terbit</span>
          <UBadge color="blue" size="xs">{{ data?.summary?.belumDiambil || 0 }}</UBadge>
        </div>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {{ data?.summary?.belumDiambil || 0 }} Akta
        </p>
        <p class="text-xs text-gray-400 mt-1">Sudah jadi, belum diambil salah satu pihak</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, activeKategori, refreshSignal, setKategori } = useAktaCerai()

const { data, pending, refresh } = useLazyFetch('/api/akta-cerai/summary', {
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
