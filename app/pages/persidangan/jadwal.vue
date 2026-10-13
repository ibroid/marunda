<template>
  <div class="space-y-6">
    <!-- Quick Sub-Navigation Menu Persidangan -->
    <PersidanganSubNavMenu />

    <!-- Header Banner Halaman Jadwal Sidang -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Jadwal Sidang Pengadilan
              </h1>
              <UBadge color="primary" variant="subtle" size="xs">
                Jadwal Harian
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Daftar perkara yang disidangkan pada tanggal terpilih beserta ruangan, jam, susunan majelis, dan status penundaan
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
        <!-- Pemilih Tanggal Jadwal Cepat -->
        <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-400" />
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Tgl Sidang:</span>
          <input
            v-model="filterDate"
            type="date"
            class="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 border-none outline-none focus:ring-0 cursor-pointer"
          />
        </div>

        <!-- Tombol Hari Ini -->
        <UButton
          size="xs"
          color="gray"
          variant="outline"
          @click="setToday"
        >
          Hari Ini
        </UButton>

        <!-- Tombol Kembali ke Ikhtisar -->
        <UButton
          to="/persidangan"
          color="gray"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-left"
        >
          Ikhtisar
        </UButton>

        <!-- Tombol Perbarui Data -->
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          variant="solid"
          size="sm"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui
        </UButton>
      </div>
    </div>

    <!-- Tabel Detail Jadwal Sidang -->
    <PersidanganTabelJadwalSidang />
  </div>
</template>

<script setup>
useHead({
  title: 'Jadwal Sidang Pengadilan - Monitoring Persidangan SIPP'
})

const { filterDate, triggerRefresh } = usePersidangan()
const isRefreshing = ref(false)

const setToday = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  filterDate.value = `${year}-${month}-${day}`
}

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}
</script>
