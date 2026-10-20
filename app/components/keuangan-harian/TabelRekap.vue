<template>
  <div class="space-y-6">
    <!-- Filter Tanggal & Export -->
    <KeuanganHarianDateFilter
      :has-data="Boolean(data?.transaksi?.length)"
      @export="handleExport"
    />

    <!-- Jika belum memilih tanggal -->
    <KeuanganHarianEmptyDateState v-if="!selectedDate" />

    <!-- Tampilan Data ketika Tanggal sudah dipilih -->
    <template v-else>
      <UCard>
        <template #header>
          <div class="text-center py-1">
            <h2 class="text-base font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Buku Kas Pembantu
            </h2>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">
              PENERIMAAN DAN PENGELUARAN UANG
            </p>
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              TANGGAL: {{ formatDateLong(selectedDate) }}
            </p>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300">
              <tr>
                <th rowspan="2" class="px-3 py-2 text-center w-12 border-r border-gray-200 dark:border-gray-700">No</th>
                <th rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">Nomor Perkara</th>
                <th rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">Uraian</th>
                <th rowspan="2" class="px-3 py-2 text-center w-20 border-r border-gray-200 dark:border-gray-700">Kode</th>
                <th colspan="2" class="px-3 py-1.5 text-center border-b border-r border-gray-200 dark:border-gray-700">Nominal (Rp)</th>
                <th rowspan="2" class="px-3 py-2 text-center w-20">Ket</th>
              </tr>
              <tr>
                <th class="px-3 py-1.5 text-right w-36 border-r border-gray-200 dark:border-gray-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">Penerimaan</th>
                <th class="px-3 py-1.5 text-right w-36 border-r border-gray-200 dark:border-gray-700 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">Pengeluaran</th>
              </tr>
            </thead>

            <!-- Skeleton Loader -->
            <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-4 mx-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-32" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-48" /></td>
                <td class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-10 mx-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-20 ml-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-20 ml-auto" /></td>
                <td class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-12 mx-auto" /></td>
              </tr>
            </tbody>

            <!-- Real Rows -->
            <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="item in data?.transaksi || []"
                :key="item.id"
                class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
              >
                <td class="px-3 py-2 text-center text-gray-400 border-r border-gray-100 dark:border-gray-800">{{ item.no }}</td>
                <td class="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-100 dark:border-gray-800">
                  {{ item.nomorPerkara }}
                </td>
                <td class="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800">
                  {{ item.uraian }}
                </td>
                <td class="px-3 py-2 text-center font-mono text-xs text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                  {{ item.kode }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 border-r border-gray-100 dark:border-gray-800 whitespace-nowrap">
                  {{ item.penerimaan ? formatRupiah(item.penerimaan) : '-' }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400 border-r border-gray-100 dark:border-gray-800 whitespace-nowrap">
                  {{ item.pengeluaran ? formatRupiah(item.pengeluaran) : '-' }}
                </td>
                <td class="px-3 py-2 text-center whitespace-nowrap">
                  <UBadge
                    v-if="item.prodeo === 'Prodeo'"
                    color="amber"
                    variant="subtle"
                    size="xs"
                  >
                    Prodeo
                  </UBadge>
                  <span v-else class="text-gray-400">-</span>
                </td>
              </tr>

              <!-- Jika Kosong -->
              <tr v-if="!data?.transaksi?.length">
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p class="font-medium text-xs">Tidak ada data transaksi keuangan pada tanggal ini.</p>
                </td>
              </tr>
            </tbody>

            <!-- Total Nilai Transaksi -->
            <tfoot class="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                <td colspan="4" class="px-3 py-2 text-center uppercase tracking-wider text-gray-700 dark:text-gray-200">
                  JUMLAH NILAI TRANSAKSI
                </td>
                <td class="px-3 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {{ formatRupiah(data?.total?.penerimaan || 0) }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  {{ formatRupiah(data?.total?.pengeluaran || 0) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>

      <!-- Catatan Rekapitulasi Kas (Saldo Awal, Penerimaan, Pengeluaran, Saldo Akhir) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-calculator" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Catatan Rekapitulasi Kas (Rp)
            </div>
          </template>

          <div v-if="isLoading" class="space-y-3">
            <USkeleton v-for="i in 4" :key="i" class="h-6 w-full" />
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Saldo Awal</span>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">
                {{ formatRupiah(data?.saldo?.saldoAwal || 0) }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
              <span class="text-emerald-700 dark:text-emerald-400">Penerimaan Hari Ini</span>
              <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                + {{ formatRupiah(data?.saldo?.penerimaan || 0) }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
              <span class="text-rose-700 dark:text-rose-400">Pengeluaran Hari Ini</span>
              <span class="font-mono font-semibold text-rose-600 dark:text-rose-400">
                - {{ formatRupiah(data?.saldo?.pengeluaran || 0) }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 rounded-lg font-bold">
              <span class="text-emerald-900 dark:text-emerald-200">Saldo Akhir</span>
              <span class="font-mono text-sm text-emerald-700 dark:text-emerald-300">
                {{ formatRupiah(data?.saldo?.saldoAkhir || 0) }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Informasi Penandatangan / Pengesahan Sesuai sipp_kasir -->
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-check-badge" class="w-5 h-5 text-gray-500" />
              Keterangan Verifikasi & Pembukuan
            </div>
          </template>
          <div class="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              Laporan ini mencatat seluruh arus kas perkara per tanggal <strong>{{ formatDateLong(selectedDate) }}</strong> secara otomatis dan real-time dari database SIPP.
            </p>
            <div class="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-center text-[11px] text-gray-500">
              <div>
                <p>Mengetahui,</p>
                <p class="font-semibold mt-8 text-gray-700 dark:text-gray-300">Panitera</p>
              </div>
              <div>
                <p>Kasir,</p>
                <p class="font-semibold mt-8 text-gray-700 dark:text-gray-300">Petugas Kasir</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup>
const { selectedDate, refreshSignal, formatRupiah, formatDateLong, exportExcel } = useKeuanganHarian()

const { data, pending, refresh } = useLazyFetch('/api/keuangan-harian/rekap', {
  server: false,
  query: computed(() => ({
    tanggal: selectedDate.value
  })),
  watch: [selectedDate],
  default: () => null
})

// Refresh manual saat refreshSignal berubah
watch(refreshSignal, () => {
  if (selectedDate.value) {
    refresh()
  }
})

const isLoading = computed(() => pending.value || !data.value)

const handleExport = () => {
  if (!data.value?.transaksi?.length) return
  const rows = data.value.transaksi.map(item => ({
    No: item.no,
    'Nomor Perkara': item.nomorPerkara,
    Uraian: item.uraian,
    Kode: item.kode,
    'Penerimaan (Rp)': item.penerimaan,
    'Pengeluaran (Rp)': item.pengeluaran,
    Keterangan: item.prodeo
  }))
  exportExcel(`Rekap_Transaksi_Harian_${selectedDate.value}`, rows)
}
</script>
