<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-primary-500" />
        10 Perkara Terakhir Didaftar
      </h3>
    </template>

    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div class="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
        <div v-for="i in 5" :key="i" class="py-2.5 space-y-1.5">
          <div class="flex items-center justify-between">
            <USkeleton class="h-3.5 w-32" />
            <USkeleton class="h-3 w-16" />
          </div>
          <div class="flex items-center justify-between">
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-4 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </template>

    <!-- Real List -->
    <template v-else>
      <div class="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
        <div
          v-for="p in data?.perkaraTerbaru || []"
          :key="p.perkara_id"
          class="py-2.5 flex flex-col gap-0.5"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-900 dark:text-white">{{ p.nomor_perkara }}</span>
            <span class="text-[11px] text-gray-400">{{ formatDate(p.tanggal_pendaftaran) }}</span>
          </div>
          <div class="flex items-center justify-between text-gray-500">
            <span>{{ p.jenis_perkara_nama }}</span>
            <UBadge color="gray" variant="subtle" size="xs">{{ p.proses_terakhir_text || 'Terdaftar' }}</UBadge>
          </div>
        </div>
        <div v-if="!data?.perkaraTerbaru?.length" class="py-6 text-center text-gray-400">
          Tidak ada data perkara terbaru.
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardEksekutif()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/eksekutif/terbaru', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
