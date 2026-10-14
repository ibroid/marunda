<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <USkeleton class="h-3.5 w-24" />
        <USkeleton class="h-7 w-20" />
        <USkeleton class="h-3 w-28" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <!-- Total Seluruh Perkara -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Beban Perkara</p>
          <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 text-emerald-500" />
        </div>
        <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
          {{ formatNumber(data?.totalPerkara) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {{ selectedKecamatan ? `Kecamatan: ${selectedKecamatan}` : 'Seluruh Wilayah Satker' }}
        </p>
      </UCard>

      <!-- Jenis Perkara Terbanyak -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-teal-600 dark:text-teal-400">Jenis Perkara Terbanyak</p>
          <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-teal-500" />
        </div>
        <p class="text-2xl font-bold text-teal-700 dark:text-teal-300 mt-1 truncate" :title="data?.topJenis?.nama || '-'">
          {{ data?.topJenis?.nama || '-' }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {{ formatNumber(data?.topJenis?.total) }} perkara ({{ data?.topJenis?.persentase }}%)
        </p>
      </UCard>

      <!-- Keaktifan Klasifikasi Jenis Perkara -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400">Klasifikasi Aktif</p>
          <UIcon name="i-heroicons-tag" class="w-4 h-4 text-amber-500" />
        </div>
        <p class="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
          {{ data?.totalJenisAktif || 0 }} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/ {{ data?.totalJenisTerdaftar || 30 }}</span>
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          Jenis perkara dengan perkara masuk
        </p>
      </UCard>

      <!-- Gugatan (Pdt.G) -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-blue-600 dark:text-blue-400">Gugatan (Pdt.G)</p>
          <UIcon name="i-heroicons-document-duplicate" class="w-4 h-4 text-blue-500" />
        </div>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
          {{ formatNumber(data?.totalGugatan) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          Porsi: {{ data?.persenGugatan }}% • Top: {{ data?.topGugatan?.nama || '-' }}
        </p>
      </UCard>

      <!-- Permohonan (Pdt.P) -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-purple-600 dark:text-purple-400">Permohonan (Pdt.P)</p>
          <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-purple-500" />
        </div>
        <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
          {{ formatNumber(data?.totalPermohonan) }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          Porsi: {{ data?.persenPermohonan }}% • Top: {{ data?.topPermohonan?.nama || '-' }}
        </p>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedAlurPerkara,
  selectedPihakType,
  selectedKecamatan,
  refreshSignal,
  formatNumber
} = useStatistikJenisPerkara()

const { data, pending, refresh } = useLazyFetch('/api/geografi/jenis/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    alur: selectedAlurPerkara.value,
    pihak_type: selectedPihakType.value,
    kecamatan: selectedKecamatan.value,
    _s: refreshSignal.value
  })),
  watch: [selectedYear, selectedAlurPerkara, selectedPihakType, selectedKecamatan, refreshSignal],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
</script>
