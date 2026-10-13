<template>
  <div class="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2">
        <UBadge color="white" variant="solid" size="xs" class="text-primary-950 font-bold uppercase tracking-wider">
          Pimpinan &amp; Eksekutif
        </UBadge>
        <span class="text-xs text-primary-200">Sistem Monitoring Terpadu</span>
      </div>
      <h2 class="text-xl font-bold tracking-tight mt-1">{{ namaSatker || 'PENGADILAN AGAMA' }}</h2>
      <p class="text-sm text-primary-200 mt-0.5">
        Sistem Monitoring &amp; Evaluasi Kinerja Penanganan Perkara SIPP — Tahun {{ selectedYear }}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-path"
        color="white"
        variant="solid"
        size="sm"
        :loading="isRefreshing"
        @click="handleRefresh"
      >
        Perbarui Data
      </UButton>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, namaSatker, triggerRefresh } = useDashboardEksekutif()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
