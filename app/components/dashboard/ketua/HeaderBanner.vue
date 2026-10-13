<template>
  <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-primary-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="w-full md:w-auto">
      <div class="flex items-center gap-2">
        <UBadge color="white" variant="solid" size="xs" class="text-blue-950 font-bold uppercase tracking-wider">
          Pimpinan Yudisial
        </UBadge>
        <span class="text-xs text-primary-200">Pengawasan &amp; Pengendalian Perkara</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight mt-1">Dashboard Ketua Pengadilan</h2>
      <p class="text-sm text-primary-200 mt-0.5">
        {{ namaSatker }} — Evaluasi Kinerja Majelis Hakim &amp; Aging Perkara Tahun {{ selectedYear }}
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
const { selectedYear, namaSatker, triggerRefresh } = useDashboardKetua()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
