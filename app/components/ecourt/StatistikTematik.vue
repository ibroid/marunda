<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
      Statistik Tematik Perkara (Tahun {{ selectedYear }})
    </h3>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-3">
        <div class="flex items-center gap-2">
          <USkeleton class="w-5 h-5 rounded" />
          <USkeleton class="h-3.5 w-24" />
        </div>
        <USkeleton class="h-7 w-16" />
        <div class="space-y-1.5 pt-1">
          <USkeleton class="h-3 w-full" />
          <USkeleton class="h-3 w-3/4" />
        </div>
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- 1. Perceraian -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center gap-2 text-rose-600 mb-2">
          <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
          <h4 class="text-xs font-bold uppercase tracking-wider">Perceraian</h4>
        </div>
        <p class="text-2xl font-bold">{{ data?.tematik?.totalPerceraian || 0 }}</p>
        <div class="mt-2 text-xs text-gray-500 space-y-1">
          <div class="flex justify-between">
            <span>Cerai Gugat (Istri):</span>
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ data?.tematik?.ceraiGugat || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span>Cerai Talak (Suami):</span>
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ data?.tematik?.ceraiTalak || 0 }}</span>
          </div>
        </div>
      </UCard>

      <!-- 2. Dispensasi Kawin -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center gap-2 text-amber-600 mb-2">
          <UIcon name="i-heroicons-heart" class="w-5 h-5" />
          <h4 class="text-xs font-bold uppercase tracking-wider">Dispensasi Kawin</h4>
        </div>
        <p class="text-2xl font-bold">{{ data?.tematik?.dispensasiKawin || 0 }}</p>
        <p class="text-xs text-gray-500 mt-2">Permohonan dispensasi pernikahan di bawah umur</p>
      </UCard>

      <!-- 3. Perkara Prodeo -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center gap-2 text-indigo-600 mb-2">
          <UIcon name="i-heroicons-hand-raised" class="w-5 h-5" />
          <h4 class="text-xs font-bold uppercase tracking-wider">Prodeo (Bebas Biaya)</h4>
        </div>
        <p class="text-2xl font-bold">{{ data?.tematik?.totalProdeo || 0 }}</p>
        <div class="mt-2 text-xs text-gray-500 space-y-1">
          <div class="flex justify-between">
            <span>Bantuan DIPA:</span>
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ data?.tematik?.prodeoDipa || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span>Prodeo Murni:</span>
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ data?.tematik?.prodeoMurni || 0 }}</span>
          </div>
        </div>
      </UCard>

      <!-- 4. Akta Cerai -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center gap-2 text-green-600 mb-2">
          <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
          <h4 class="text-xs font-bold uppercase tracking-wider">Akta Cerai Terbit</h4>
        </div>
        <p class="text-2xl font-bold">{{ data?.tematik?.totalAktaTerbit || 0 }}</p>
        <p class="text-xs text-gray-500 mt-2">Total fisik akta cerai yang telah diterbitkan</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal } = useEcourt()

const { data, pending, refresh } = useLazyFetch('/api/ecourt/tematik', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
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
