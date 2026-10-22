<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4 p-5">
    <!-- Kontrol Toolbar: Search & Paging Selector -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Box -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nomor perkara, majelis..."
          size="sm"
          :trailing="searchInput ? true : false"
          @keyup.enter="handleSearch"
        >
          <template v-if="searchInput" #trailing>
            <UButton
              color="gray"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="clearSearch"
            />
          </template>
        </UInput>
      </div>

      <!-- Informasi Total & Selector Jumlah Per Halaman -->
      <div class="flex items-center justify-between sm:justify-end gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="font-medium">
          Total: <strong class="text-gray-900 dark:text-white">{{ totalRows.toLocaleString('id-ID') }}</strong> perkara banding
        </span>
        <div class="flex items-center gap-1.5">
          <span>Tampilkan:</span>
          <USelect
            v-model="pageSize"
            :options="pageSizeOptions"
            size="xs"
            class="w-32"
          />
        </div>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="space-y-2">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <!-- Tabel Detail LIPA 2 Sesuai Format Resmi 12 Kolom -->
    <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table class="w-full text-xs text-left border-collapse min-w-[1250px]">
        <thead>
          <!-- Header Baris 1: Kolom Utama & Grup Tanggal -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 w-12">NO</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[170px]">NOMOR PERKARA PA</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[200px]">NAMA HAKIM/ MAJELIS</th>
            <th colspan="8" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/70 dark:bg-gray-600/60 tracking-wider">
              TANGGAL
            </th>
            <th rowspan="2" class="py-2.5 px-3 w-32">Ket</th>
          </tr>
          <!-- Header Baris 2: Sub-kolom Tanggal -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[90px]">PUTUSAN PA</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[95px]">PERMOHONAN BANDING</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[110px]">PEMBERITAHUAN INZAGE</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[95px]">PENGIRIMAN BERKAS PTA</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[90px]">PUTUS BANDING</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[95px]">PENERIMAAN KEMBALI DI PA</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[115px]">PEMBERITAHUAN KE PARA PIHAK</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[110px]">PENYAMPAIAN FOTOCOPY RELAS PBT KE PTA</th>
          </tr>
          <!-- Header Baris 3: Nomor Kolom (1 s/d 12) -->
          <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold text-center border-b border-gray-300 dark:border-gray-600">
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">1</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">2</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">3</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">4</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">5</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">6</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">7</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">8</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">9</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">10</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">11</th>
            <th class="py-1 px-1">12</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
          <template v-if="tableRows.length > 0">
            <tr
              v-for="row in tableRows"
              :key="row.perkara_id"
              class="hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-colors"
            >
              <!-- 1. NO -->
              <td class="py-2.5 px-2 text-center font-medium border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                {{ row.no }}
              </td>

              <!-- 2. NOMOR PERKARA PA -->
              <td class="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">
                <div class="font-semibold text-primary-700 dark:text-primary-300">
                  {{ row.nomor_perkara_pa }}
                </div>
                <div v-if="row.nomor_perkara_banding" class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  No. Banding: {{ row.nomor_perkara_banding }}
                </div>
              </td>

              <!-- 3. NAMA HAKIM/ MAJELIS -->
              <td class="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-[11px] leading-relaxed">
                <div v-if="parseMajelis(row.majelis_hakim).length > 0" class="space-y-0.5">
                  <div
                    v-for="(hakim, hIdx) in parseMajelis(row.majelis_hakim)"
                    :key="hIdx"
                    :class="hIdx === 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'"
                  >
                    {{ hakim }}
                  </div>
                </div>
                <span v-else class="text-gray-400 italic">-</span>
              </td>

              <!-- 4. PUTUSAN PA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.putusan_pa) }}
              </td>

              <!-- 5. PERMOHONAN BANDING -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                {{ formatTanggal(row.permohonan_banding) }}
              </td>

              <!-- 6. PEMBERITAHUAN INZAGE (P & T) -->
              <td class="py-2 px-2.5 border-r border-gray-200 dark:border-gray-700 text-[11px]">
                <div v-if="row.pemberitahuan_inzage_p || row.pemberitahuan_inzage_t" class="space-y-1">
                  <div v-if="row.pemberitahuan_inzage_p" class="flex items-center gap-1">
                    <span class="inline-block px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">P</span>
                    <span class="text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {{ formatMultiTanggal(row.pemberitahuan_inzage_p).join(', ') }}
                    </span>
                  </div>
                  <div v-if="row.pemberitahuan_inzage_t" class="flex items-center gap-1">
                    <span class="inline-block px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">T</span>
                    <span class="text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {{ formatMultiTanggal(row.pemberitahuan_inzage_t).join(', ') }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-gray-400 italic block text-center">-</span>
              </td>

              <!-- 7. PENGIRIMAN BERKAS PTA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.pengiriman_berkas_pta" class="font-medium text-emerald-700 dark:text-emerald-300">
                  {{ formatTanggal(row.pengiriman_berkas_pta) }}
                </span>
                <span v-else class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-medium border border-red-200 dark:border-red-900">
                  Belum kirim
                </span>
              </td>

              <!-- 8. PUTUS BANDING -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.putusan_banding" class="font-semibold text-emerald-600 dark:text-emerald-400">
                  {{ formatTanggal(row.putusan_banding) }}
                </span>
                <span v-else class="text-gray-400 italic">
                  Proses PTA
                </span>
              </td>

              <!-- 9. PENERIMAAN KEMBALI DI PA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.penerimaan_kembali_pa" class="font-medium text-gray-800 dark:text-gray-200">
                  {{ formatTanggal(row.penerimaan_kembali_pa) }}
                </span>
                <span v-else-if="row.putusan_banding" class="text-amber-600 dark:text-amber-400 text-[10px] italic">
                  Belum kembali
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- 10. PEMBERITAHUAN KE PARA PIHAK (P & T) -->
              <td class="py-2 px-2.5 border-r border-gray-200 dark:border-gray-700 text-[11px]">
                <div v-if="row.pemberitahuan_putusan_p || row.pemberitahuan_putusan_t" class="space-y-1">
                  <div v-if="row.pemberitahuan_putusan_p" class="flex items-center gap-1">
                    <span class="inline-block px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">P</span>
                    <span class="text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {{ formatMultiTanggal(row.pemberitahuan_putusan_p).join(', ') }}
                    </span>
                  </div>
                  <div v-if="row.pemberitahuan_putusan_t" class="flex items-center gap-1">
                    <span class="inline-block px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">T</span>
                    <span class="text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {{ formatMultiTanggal(row.pemberitahuan_putusan_t).join(', ') }}
                    </span>
                  </div>
                </div>
                <span v-else class="text-gray-400 italic block text-center">-</span>
              </td>

              <!-- 11. PENYAMPAIAN FOTOCOPY RELAS PBT KE PTA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.penyampaian_relas_pta) }}
              </td>

              <!-- 12. Ket -->
              <td class="py-2.5 px-2 text-left text-gray-500 dark:text-gray-400 text-[11px]">
                <span v-if="row.ket" class="line-clamp-2" :title="row.ket">
                  {{ row.ket }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="12" class="py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <UIcon name="i-heroicons-scale" class="w-8 h-8 text-gray-400" />
                <p class="font-medium text-sm">Tidak ada data perkara banding untuk periode dan filter ini</p>
                <p class="text-xs text-gray-400">Coba ubah filter bulan, tahun, status banding, atau kata kunci pencarian</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Navigator -->
    <div v-if="pageSize > 0 && totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Menampilkan data ke-{{ ((page - 1) * pageSize) + 1 }} sampai {{ Math.min(page * pageSize, totalRows) }} dari {{ totalRows }} perkara banding
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="gray"
          variant="outline"
          size="xs"
          icon="i-heroicons-chevron-left"
          :disabled="page <= 1"
          @click="page--"
        >
          Sebelumnya
        </UButton>

        <span class="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">
          Hal. {{ page }} / {{ totalPages }}
        </span>

        <UButton
          color="gray"
          variant="outline"
          size="xs"
          trailing-icon="i-heroicons-chevron-right"
          :disabled="page >= totalPages"
          @click="page++"
        >
          Selanjutnya
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  statusFilter,
  searchQuery,
  page,
  pageSize,
  refreshSignal,
  pageSizeOptions,
  formatTanggal,
  formatMultiTanggal
} = useLipa2()

const searchInput = ref('')

const handleSearch = () => {
  searchQuery.value = searchInput.value
  page.value = 1
}

const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
  page.value = 1
}

watch(statusFilter, () => {
  page.value = 1
})

watch(pageSize, () => {
  page.value = 1
})

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa2/list', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    status: statusFilter.value,
    search: searchQuery.value,
    page: page.value,
    pageSize: pageSize.value
  })),
  watch: [selectedYear, selectedMonth, statusFilter, searchQuery, page, pageSize],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
const tableRows = computed(() => data.value?.data || [])
const totalRows = computed(() => data.value?.total || 0)
const totalPages = computed(() => data.value?.totalPages || 1)

watch(refreshSignal, () => {
  refresh()
})

const parseMajelis = (majelisText) => {
  if (!majelisText) return []
  return majelisText
    .replace(/<\/br>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/Hakim Ketua\s*:\s*/gi, '')
    .replace(/Hakim Anggota\s*:\s*/gi, '')
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}
</script>
