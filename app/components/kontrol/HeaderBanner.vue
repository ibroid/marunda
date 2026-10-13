<template>
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Kontrol &amp; Audit Alur Perkara</h2>
      <p class="text-xs text-gray-500 mt-1">
        Audit kepatuhan penetapan awal, jadwal sidang, serta monitoring tunggakan perkara — Tahun {{ selectedYear }}
      </p>
    </div>
    <UButton
      icon="i-heroicons-arrow-path"
      color="gray"
      variant="ghost"
      size="sm"
      :loading="isRefreshing"
      @click="handleRefresh"
    >
      Refresh
    </UButton>
  </div>
</template>

<script setup>
const { selectedYear, triggerRefresh } = useKontrol()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
