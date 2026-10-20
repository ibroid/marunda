<template>
  <div class="space-y-6">
    <!-- Filter Tanggal & Export -->
    <KeuanganHarianDateFilter
      :has-data="Boolean(data?.transaksi?.length)"
      @export="handleExport"
    >
      <!-- Filter Khusus PNBP: Pilihan Kode PNBP -->
      <template v-if="kategoriId === 11" #extra-filter>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Filter Kode:</span>
          <USelect
            v-model="filterKodePnbp"
            :options="kodeOptions"
            size="sm"
            class="w-36"
          />
        </div>
      </template>
    </KeuanganHarianDateFilter>

    <!-- Jika belum memilih tanggal -->
    <KeuanganHarianEmptyDateState v-if="!selectedDate" />

    <!-- Tampilan Data ketika Tanggal sudah dipilih -->
    <template v-else>
      <UCard>
        <template #header>
          <div class="text-center py-1">
            <h2 class="text-base font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              {{ title }}
            </h2>
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
                <th rowspan="2" class="px-3 py-2 w-28 border-r border-gray-200 dark:border-gray-700">Tanggal Transaksi</th>

                <!-- Kolom Keterangan di Awal (khusus menu Pemberitahuan) -->
                <th v-if="kategoriId === 6" rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">Keterangan</th>

                <th rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">Nomor Perkara</th>

                <!-- Kolom Status Pembiayaan (khusus menu Materai) -->
                <th v-if="kategoriId === 8" rowspan="2" class="px-3 py-2 text-center w-24 border-r border-gray-200 dark:border-gray-700">Status</th>

                <th rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">
                  <span v-if="kategoriId === 4">Uraian & Keterangan</span>
                  <span v-else>Uraian</span>
                </th>

                <!-- Kolom Keterangan di Akhir (khusus menu Sisa Panjar) -->
                <th v-if="kategoriId === 2" rowspan="2" class="px-3 py-2 border-r border-gray-200 dark:border-gray-700">Keterangan</th>

                <th rowspan="2" class="px-3 py-2 text-center w-20 border-r border-gray-200 dark:border-gray-700">Kode</th>
                <th colspan="2" class="px-3 py-1.5 text-center border-b border-gray-200 dark:border-gray-700">Nominal (Rp)</th>
              </tr>
              <tr>
                <th class="px-3 py-1.5 text-right w-36 border-r border-gray-200 dark:border-gray-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">Penerimaan</th>
                <th class="px-3 py-1.5 text-right w-36 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">Pengeluaran</th>
              </tr>
            </thead>

            <!-- Skeleton Loader -->
            <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-4 mx-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-20" /></td>
                <td v-if="kategoriId === 6" class="px-3 py-2.5"><USkeleton class="h-3 w-24" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-32" /></td>
                <td v-if="kategoriId === 8" class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-12 mx-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-48" /></td>
                <td v-if="kategoriId === 2" class="px-3 py-2.5"><USkeleton class="h-3 w-24" /></td>
                <td class="px-3 py-2.5 text-center"><USkeleton class="h-3 w-10 mx-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-20 ml-auto" /></td>
                <td class="px-3 py-2.5"><USkeleton class="h-3 w-20 ml-auto" /></td>
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
                <td class="px-3 py-2 text-gray-500 whitespace-nowrap border-r border-gray-100 dark:border-gray-800">{{ formatDate(item.tanggal) }}</td>

                <!-- Kolom Keterangan (Pemberitahuan) -->
                <td v-if="kategoriId === 6" class="px-3 py-2 text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                  {{ item.keterangan }}
                </td>

                <td class="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-100 dark:border-gray-800">
                  {{ item.nomorPerkara }}
                </td>

                <!-- Kolom Status (Materai) -->
                <td v-if="kategoriId === 8" class="px-3 py-2 text-center border-r border-gray-100 dark:border-gray-800">
                  <UBadge
                    :color="item.statusPembiayaan === 'Bayar' ? 'green' : 'amber'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ item.statusPembiayaan }}
                  </UBadge>
                </td>

                <td class="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800">
                  <div>{{ item.uraian }}</div>
                  <div v-if="kategoriId === 4 && item.keterangan && item.keterangan !== '-'" class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ item.keterangan }}
                  </div>
                </td>

                <!-- Kolom Keterangan (Sisa Panjar) -->
                <td v-if="kategoriId === 2" class="px-3 py-2 text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                  {{ item.keterangan }}
                </td>

                <td class="px-3 py-2 text-center font-mono text-xs text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                  {{ item.kode }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 border-r border-gray-100 dark:border-gray-800 whitespace-nowrap">
                  {{ item.penerimaan ? formatRupiah(item.penerimaan) : '-' }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {{ item.pengeluaran ? formatRupiah(item.pengeluaran) : '-' }}
                </td>
              </tr>

              <!-- Jika Kosong -->
              <tr v-if="!data?.transaksi?.length">
                <td :colspan="colSpanCount" class="px-4 py-8 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p class="font-medium text-xs">Tidak ada data transaksi pada kategori ini untuk tanggal yang dipilih.</p>
                </td>
              </tr>
            </tbody>

            <!-- Total Nilai Transaksi -->
            <tfoot class="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                <td :colspan="colSpanCount - 2" class="px-3 py-2 text-center uppercase tracking-wider text-gray-700 dark:text-gray-200">
                  JUMLAH NILAI TRANSAKSI
                </td>
                <td class="px-3 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {{ formatRupiah(data?.total?.penerimaan || 0) }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  {{ formatRupiah(data?.total?.pengeluaran || 0) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  kategoriId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  }
})

const {
  selectedDate,
  refreshSignal,
  filterKodePnbp,
  formatRupiah,
  formatDate,
  formatDateLong,
  exportExcel
} = useKeuanganHarian()

// Hitung jumlah kolom dinamis untuk colspan
const colSpanCount = computed(() => {
  let count = 6 // No, Tanggal, NoPerkara, Uraian, Kode, Penerimaan, Pengeluaran
  if (props.kategoriId === 6 || props.kategoriId === 2 || props.kategoriId === 8) {
    count += 1
  }
  return count + 1 // + 1 untuk pengeluaran
})

const { data, pending, refresh } = useLazyFetch('/api/keuangan-harian/kategori', {
  server: false,
  query: computed(() => ({
    tanggal: selectedDate.value,
    kategoriId: props.kategoriId,
    kodePnbp: props.kategoriId === 11 && filterKodePnbp.value ? filterKodePnbp.value : undefined
  })),
  watch: [selectedDate, filterKodePnbp],
  default: () => null
})

watch(refreshSignal, () => {
  if (selectedDate.value) {
    refresh()
  }
})

const isLoading = computed(() => pending.value || !data.value)

const kodeOptions = computed(() => {
  const list = [{ label: 'Semua Kode', value: '' }]
  if (data.value?.availableKodeList?.length) {
    data.value.availableKodeList.forEach(k => {
      list.push({ label: `Kode ${k}`, value: k })
    })
  }
  return list
})

const handleExport = () => {
  if (!data.value?.transaksi?.length) return
  const rows = data.value.transaksi.map(item => ({
    No: item.no,
    Tanggal: formatDate(item.tanggal),
    'Nomor Perkara': item.nomorPerkara,
    Uraian: item.uraian,
    Keterangan: item.keterangan || '-',
    Status: item.statusPembiayaan || '-',
    Kode: item.kode,
    'Penerimaan (Rp)': item.penerimaan,
    'Pengeluaran (Rp)': item.pengeluaran
  }))
  exportExcel(`Transaksi_${props.slug}_${selectedDate.value}`, rows)
}
</script>
