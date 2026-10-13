<template>
  <div class="space-y-6">
    <!-- Quick Sub-Navigation Menu Persidangan -->
    <PersidanganSubNavMenu />

    <!-- Header Banner Halaman Sidang Keliling Belum Ditentukan -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Jadwal Sidang Keliling: Lokasi Belum Ditentukan
              </h1>
              <UBadge color="cyan" variant="subtle" size="xs">
                Sidang di Luar Gedung
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Audit perkara sidang keliling (<code class="font-mono text-[11px]">sidang_keliling = 'Y'</code>) namun lokasi atau nama ruangan pelaksanaan sidang belum diinput di SIPP
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
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

    <!-- Tabel Detail Sidang Keliling Belum Ditentukan -->
    <PersidanganTabelSidangKelilingBelumDitentukan />
  </div>
</template>

<script setup>
useHead({
  title: 'Jadwal Sidang Keliling Belum Ditentukan - Monitoring Persidangan SIPP'
})

const { triggerRefresh } = usePersidangan()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}
</script>
