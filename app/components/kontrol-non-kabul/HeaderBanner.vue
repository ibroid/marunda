<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
    <div class="space-y-1">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <UIcon name="i-heroicons-no-symbol" class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
            Kontrol Perkara Non Kabul (Non Kabu)
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Monitoring &amp; audit perkara putusan bukan dikabulkan (Dicabut, Tidak Diterima/N.O, Ditolak, Gugur, Dicoret, Perdamaian) serta validasi administrasi SIPP
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
      <!-- Selector Filter Tahun -->
      <USelect
        v-model="filterYear"
        :options="yearOptions"
        size="sm"
        class="w-36"
        icon="i-heroicons-calendar"
      />

      <!-- Tombol Perbarui Data -->
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
const { filterYear, triggerRefresh } = useKontrolNonKabul()
const isRefreshing = ref(false)

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: 'Semua Tahun', value: 'all' },
  { label: `Tahun ${currentYear}`, value: currentYear },
  { label: `Tahun ${currentYear - 1}`, value: currentYear - 1 },
  { label: `Tahun ${currentYear - 2}`, value: currentYear - 2 },
  { label: `Tahun ${currentYear - 3}`, value: currentYear - 3 },
  { label: `Tahun ${currentYear - 4}`, value: currentYear - 4 }
]

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 750)
}
</script>
