<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Statistik &amp; Analitik e-Court</h2>
      <p class="text-xs text-gray-500 mt-1">
        Monitoring adopsi pendaftaran perkara elektronik (e-Court) dan statistik tematik tahun {{ selectedYear }}
      </p>
    </div>
    <div class="flex items-center gap-2.5">
      <USelect
        v-model="selectedYear"
        :options="yearOptions"
        class="w-36"
        size="sm"
      />
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
const { selectedYear, yearOptions, triggerRefresh } = useEcourt()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
