<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
      Rincian Indikator Variabel Penilaian
    </h3>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <USkeleton class="h-3.5 w-28" />
          <USkeleton class="h-5 w-20 rounded-full" />
        </div>
        <USkeleton class="h-8 w-16" />
        <USkeleton class="h-3 w-44" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Persentase Putus -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Persentase Putus</span>
          <UBadge :color="data?.indikator?.persentasePutus?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.persentasePutus?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.persentasePutus?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Minutasi thd total beban perkara</p>
      </UCard>

      <!-- 2. Persentase Minutasi -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Persentase Minutasi</span>
          <UBadge :color="data?.indikator?.persentaseMinutasi?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.persentaseMinutasi?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.persentaseMinutasi?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Minutasi thd perkara diputus</p>
      </UCard>

      <!-- 3. Persentase Dirput -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Publikasi Dirput MA</span>
          <UBadge :color="data?.indikator?.persentaseDirput?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.persentaseDirput?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.persentaseDirput?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Upload ke Direktori Putusan MA</p>
      </UCard>

      <!-- 4. Rasio Bobot Proses -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Rasio Bobot Proses</span>
          <UBadge :color="data?.indikator?.rasioBobotProses?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.rasioBobotProses?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.rasioBobotProses?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Pembobotan verstek vs kontradiktoir</p>
      </UCard>

      <!-- 5. Rasio Waktu Putus -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Rasio Waktu Putus</span>
          <UBadge :color="data?.indikator?.rasioWaktuPutus?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.rasioWaktuPutus?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.rasioWaktuPutus?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Kepatuhan durasi penyelesaian perkara</p>
      </UCard>

      <!-- 6. Rasio Waktu Minutasi -->
      <UCard :ui="{ body: { padding: 'p-4' } }">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Rasio Waktu Minutasi</span>
          <UBadge :color="data?.indikator?.rasioWaktuMinutasi?.warna || 'gray'" size="xs">
            {{ getStatusText(data?.indikator?.rasioWaktuMinutasi?.warna) }}
          </UBadge>
        </div>
        <p class="text-2xl font-bold mt-2">{{ data?.indikator?.rasioWaktuMinutasi?.nilai || 0 }}%</p>
        <p class="text-xs text-gray-400 mt-1">Kecepatan minutasi berkas pasca putus</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal, getStatusText } = useKinerja()

const { data, pending, refresh } = useLazyFetch('/api/kinerja/indikator', {
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
