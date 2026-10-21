<template>
  <div class="space-y-4">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 rounded-lg">
            <UIcon name="i-heroicons-identification" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              Data Saksi Perkara (SIPP)
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Monitoring dan penelusuran data saksi persidangan, hubungan para pihak, serta catatan berita acara keterangan saksi
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
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <!-- Total Saksi -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Saksi Terdaftar</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-20" />
            </div>
            <div v-else class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatNumber(summaryData?.total) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Saksi Tahun Ini -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Saksi Tahun {{ summaryData?.tahunLabel || currentYear }}</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-20" />
            </div>
            <div v-else class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatNumber(summaryData?.tahunIni) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Saksi Penggugat / Pemohon -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Saksi Penggugat/Pemohon</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-sky-600 dark:text-sky-400">
              {{ formatNumber(summaryData?.saksiPenggugat) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
            <UIcon name="i-heroicons-user" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Saksi Tergugat / Termohon -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Saksi Tergugat/Termohon</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-purple-600 dark:text-purple-400">
              {{ formatNumber(summaryData?.saksiTergugat) }}
            </div>
          </div>
          <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <UIcon name="i-heroicons-user-plus" class="w-5 h-5" />
          </div>
        </div>
      </UCard>

      <!-- Saksi dengan Catatan BAP Sidang -->
      <UCard :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Dengan Keterangan BAP</span>
            <div v-if="isLoading">
              <USkeleton class="h-6 w-16" />
            </div>
            <div v-else class="text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ formatNumber(summaryData?.denganKeterangan) }}
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
const { refreshSignal, triggerRefresh } = useSaksi()

const currentYear = new Date().getFullYear()
const isRefreshing = ref(false)

// Independent Lazy Fetch untuk Summary Card sesuai standar arsitektur
const { data, pending, refresh } = useLazyFetch('/api/saksi/summary', {
  server: false,
  watch: [refreshSignal],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
const summaryData = computed(() => data.value?.data || null)

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(num))
}

const handleRefresh = async () => {
  isRefreshing.value = true
  triggerRefresh()
  await refresh()
  isRefreshing.value = false
}
</script>
