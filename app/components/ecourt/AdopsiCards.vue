<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2 border-t-4 border-t-gray-300 dark:border-t-gray-700">
        <USkeleton class="h-3.5 w-32" />
        <USkeleton class="h-8 w-20" />
        <USkeleton class="h-3 w-40" />
      </div>
    </template>

    <!-- Real Cards -->
    <template v-else>
      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-t-4 border-t-primary-500">
        <p class="text-xs text-gray-500">Adopsi e-Court Tahun Ini</p>
        <p class="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-2">
          {{ data?.adopsi?.persenTahunIni || 0 }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ data?.adopsi?.jumlahEcourtTahunIni || 0 }} dari {{ data?.adopsi?.totalPerkara || 0 }} perkara
        </p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-t-4 border-t-emerald-500">
        <p class="text-xs text-gray-500">Bulan Ini</p>
        <p class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
          {{ data?.adopsi?.persenBulanIni || 0 }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ data?.adopsi?.jumlahEcourtBulanIni || 0 }} perkara e-Court
        </p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-t-4 border-t-blue-500">
        <p class="text-xs text-gray-500">Minggu Ini</p>
        <p class="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
          {{ data?.adopsi?.persenMingguIni || 0 }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ data?.adopsi?.jumlahEcourtMingguIni || 0 }} perkara e-Court
        </p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-t-4 border-t-amber-500">
        <p class="text-xs text-gray-500">Hari Ini</p>
        <p class="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
          {{ data?.adopsi?.persenHariIni || 0 }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ data?.adopsi?.jumlahEcourtHariIni || 0 }} perkara e-Court
        </p>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const { selectedYear, sharedAdopsi, refreshSignal } = useEcourt()

const { data, pending, refresh } = useLazyFetch('/api/ecourt/adopsi', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.adopsi) {
    sharedAdopsi.value = newVal.adopsi
  }
})

watch(selectedYear, () => {
  data.value = null
  sharedAdopsi.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
