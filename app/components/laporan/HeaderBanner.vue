<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
    <div>
      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="subtle" size="sm" class="font-mono font-bold">
          {{ activeLipaItem?.code || 'LIPA' }}
        </UBadge>
        <UBadge
          v-if="activeLipaItem?.isManualDipa"
          color="amber"
          variant="solid"
          size="xs"
        >
          Input Manual DIPA
        </UBadge>
        <UBadge
          v-else
          color="emerald"
          variant="subtle"
          size="xs"
        >
          Otomatis SIPP
        </UBadge>
      </div>

      <h2 class="text-xl font-bold text-gray-900 dark:text-white mt-1">
        {{ activeLipaItem?.title || 'Laporan Perkara' }}
      </h2>
      <p class="text-xs text-gray-500 mt-0.5">
        {{ activeLipaItem?.description }} — Periode {{ selectedMonthLabel }} {{ selectedYear }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <USelect
        v-model="selectedMonth"
        :options="monthOptions"
        class="w-36"
        size="sm"
      />

      <UButton
        icon="i-heroicons-arrow-down-tray"
        color="emerald"
        variant="solid"
        size="sm"
        @click="exportExcel"
      >
        Export Excel
      </UButton>

      <UButton
        icon="i-heroicons-arrow-path"
        color="gray"
        variant="soft"
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
const {
  selectedYear,
  selectedMonth,
  monthOptions,
  selectedMonthLabel,
  activeLipaItem,
  triggerRefresh,
  exportExcel
} = useLaporan()

const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
