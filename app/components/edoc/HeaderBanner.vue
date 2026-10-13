<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Monitoring Kepatuhan Dokumen Elektronik (e-Doc)
      </h2>
      <p class="text-xs text-gray-500 mt-1">
        Audit kelengkapan upload e-Doc Putusan dan Anonimisasi Putusan — Tahun {{ selectedYear }}
      </p>
    </div>

    <div class="flex items-center gap-2">
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
const { selectedYear, triggerRefresh } = useEdoc()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
