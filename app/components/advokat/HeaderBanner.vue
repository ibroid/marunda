<template>
  <div class="space-y-4">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 rounded-lg">
            <UIcon name="i-heroicons-briefcase" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              Data Advokat & Kuasa Hukum
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Daftar dan monitoring para advokat/kuasa hukum yang terdaftar dalam basis data SIPP
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
          variant="outline"
          size="sm"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui Data
        </UButton>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- Total Advokat -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Advokat</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatNumber(summaryData?.total) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-identification" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Total Kuasa Perkara -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Kuasa Perkara</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatNumber(summaryData?.totalKuasa) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-scale" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Advokat Aktif di Perkara -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Advokat Pernah Berperkara</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-violet-600 dark:text-violet-400">
              {{ formatNumber(summaryData?.advokatAktif) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Tercatat No. Induk / NIA -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Tercatat Nomor Induk / NIA</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ formatNumber(summaryData?.denganNia) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { refreshSignal, triggerRefresh } = useAdvokat()
const isRefreshing = ref(false)

const { data: summaryRes, pending: isLoading, refresh } = useLazyFetch('/api/advokat/summary', {
  server: false,
  default: () => null
})

const summaryData = computed(() => summaryRes.value?.data || null)

watch(refreshSignal, () => {
  refresh()
})

const handleRefresh = async () => {
  isRefreshing.value = true
  triggerRefresh()
  await refresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(val))
}
</script>
