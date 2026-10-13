<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Buku Register Perkara Digital
      </h2>
      <p class="text-xs text-gray-500 mt-1">
        Standar register induk kepaniteraan peradilan agama (R1-PA1G, R1-PA1P, R1-PA18) — Tahun {{ selectedYear }}
      </p>
    </div>

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
const { selectedYear, triggerRefresh, exportExcel } = useRegister()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
