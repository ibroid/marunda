<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Buku Kas Bantu &amp; Keuangan Perkara</h2>
      <p class="text-xs text-gray-500 mt-1">
        Monitoring arus kas transaksi perkara SIPP real-time (Panjar, PNBP, ATK/Proses, Meterai, Redaksi)
      </p>
    </div>

    <!-- Quick Action Buttons -->
    <div class="flex items-center gap-2">
      <UButton
        icon="i-heroicons-arrow-down-tray"
        color="emerald"
        variant="soft"
        size="sm"
        @click="exportExcel"
      >
        Export Excel
      </UButton>
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
  </div>
</template>

<script setup>
const { triggerRefresh, exportExcel } = useKeuangan()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
