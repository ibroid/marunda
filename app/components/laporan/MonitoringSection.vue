<template>
  <div class="space-y-6">
    <!-- Header Monitoring -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          Monitoring & Kepatuhan Pelaporan Bulanan (LIPA)
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">
          Monitoring kesiapan data dan kelengkapan laporan online sebelum pengiriman ke Pengadilan Tinggi Agama dan Ditjen Badilag MA-RI &bull; Tahun {{ selectedYear }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UBadge
          size="md"
          :color="summary?.persentaseKesiapan >= 80 ? 'emerald' : 'amber'"
          variant="solid"
          class="font-mono"
        >
          {{ summary?.persentaseKesiapan || 0 }}% Kesiapan
        </UBadge>

        <UButton
          size="sm"
          color="gray"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :loading="pending"
          @click="refresh"
        >
          Periksa Status
        </UButton>
      </div>
    </div>

    <!-- KPI Ringkasan Monitoring -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-blue-500">
        <p class="text-xs text-gray-500">Total Jenis Laporan</p>
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
          {{ summary?.totalLaporan || 0 }} Laporan
        </p>
        <p class="text-xs text-gray-400 mt-1">LIPA otomatis & DIPA manual</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-emerald-500">
        <p class="text-xs text-gray-500">Laporan Lengkap / Siap</p>
        <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
          {{ summary?.totalLengkap || 0 }} Slot
        </p>
        <p class="text-xs text-gray-400 mt-1">Data sinkron s/d bulan ini</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-amber-500">
        <p class="text-xs text-gray-500">Perlu Pengisian Input</p>
        <p class="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
          {{ summary?.totalPerluInput || 0 }} Slot
        </p>
        <p class="text-xs text-gray-400 mt-1">Realisasi DIPA belum dicatat</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-primary-500">
        <p class="text-xs text-gray-500">Target Evaluasi</p>
        <p class="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">
          Bulan 1 s/d {{ summary?.targetBulan || 1 }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Bulan berjalan tahun {{ selectedYear }}</p>
      </UCard>
    </div>

    <!-- Matriks 12 Bulan Checklist Laporan -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
            Matriks Checklist Kesiapan Laporan (Januari – Desember {{ selectedYear }})
          </h4>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lengkap / Sinkron
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Belum Input (DIPA)
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Mendatang
            </span>
          </div>
        </div>
      </template>

      <!-- Skeleton loading -->
      <div v-if="isLoading" class="space-y-3 py-6 animate-pulse">
        <USkeleton v-for="i in 8" :key="i" class="h-8 w-full" />
      </div>

      <!-- Real Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
            <tr>
              <th class="px-3 py-3 w-16 text-center">Kode</th>
              <th class="px-3 py-3 min-w-[180px]">Nama Laporan</th>
              <th
                v-for="m in 12"
                :key="m"
                class="px-2 py-3 text-center w-12"
                :class="{ 'bg-primary-50/50 dark:bg-primary-950/20 text-primary-600': m === currentMonth && selectedYear === currentYear }"
              >
                {{ namaBulanSingkat[m] }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="rep in (data?.reports || [])"
              :key="rep.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <td class="px-3 py-2.5 text-center font-mono font-semibold text-primary-600 dark:text-primary-400">
                {{ rep.code }}
              </td>
              <td class="px-3 py-2.5">
                <span class="font-medium text-gray-900 dark:text-white">{{ rep.name }}</span>
                <span v-if="rep.isManual" class="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Manual DIPA)</span>
              </td>
              <td
                v-for="m in 12"
                :key="m"
                class="px-2 py-2 text-center"
              >
                <div
                  v-if="rep.months[m]?.status === 'lengkap'"
                  class="w-6 h-6 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                  title="Data Lengkap & Sinkron"
                >
                  <UIcon name="i-heroicons-check" class="w-3.5 h-3.5" />
                </div>
                <div
                  v-else-if="rep.months[m]?.status === 'siap'"
                  class="w-6 h-6 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold"
                  title="Siap Kirim / Nihil"
                >
                  N
                </div>
                <div
                  v-else-if="rep.months[m]?.status === 'belum'"
                  class="w-6 h-6 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center"
                  title="Belum Diinput"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5" />
                </div>
                <div
                  v-else
                  class="w-6 h-6 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center text-[10px]"
                >
                  -
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Informasi Panduan Pengiriman -->
    <div class="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 flex items-start gap-3">
      <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
      <div class="text-xs text-blue-900 dark:text-blue-200 space-y-1">
        <p class="font-bold">Panduan Pengiriman Laporan Bulanan (LIPA)</p>
        <p>
          Batas akhir pengunggahan laporan perkara bulanan (LIPA 1 s.d. LIPA 27) ke sistem pelaporan online PTA Semarang adalah tanggal <strong>10 setiap awal bulan</strong>. Pastikan seluruh transaksi keuangan DIPA 04 dan Uang Iwadl telah tercatat sebelum mengekspor berkas Excel.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal } = useLaporan()

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const namaBulanSingkat = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

const { data, pending, refresh } = useLazyFetch('/api/laporan/monitoring', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
const summary = computed(() => data.value?.summary || {})

watch(refreshSignal, () => {
  refresh()
})
</script>
