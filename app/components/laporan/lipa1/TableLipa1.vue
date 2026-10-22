<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4 p-5">
    <!-- Kontrol Toolbar: Search & Paging Selector -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Box -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nomor perkara, majelis, PP..."
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
          Total: <strong class="text-gray-900 dark:text-white">{{ totalRows.toLocaleString('id-ID') }}</strong> perkara
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
      <USkeleton class="h-10 w-full" />
    </div>

    <!-- Tabel Detail LIPA 1 Sesuai Format Resmi 14 Kolom -->
    <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table class="w-full text-xs text-left border-collapse min-w-[1200px]">
        <thead>
          <!-- Header Baris 1 -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 w-12">No</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[150px]">Nomor Perkara</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[130px]">Kode Perkara</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[220px]">Nama Majelis Hakim</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[140px]">Nama PP</th>
            <th colspan="5" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/70 dark:bg-gray-600/60">Tanggal</th>
            <th rowspan="2" class="py-2.5 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[110px]">Jenis Putusan</th>
            <th colspan="2" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/70 dark:bg-gray-600/60">Sisa Akhir Bulan</th>
            <th rowspan="2" class="py-2.5 px-2 w-16">Ket</th>
          </tr>
          <!-- Header Baris 2 -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[85px]">Penerimaan</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[85px]">PMH</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[85px]">PHS</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[85px]">Sidang I</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[85px]">Diputus</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[130px]">Belum Dibagi</th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[130px]">Belum Diputus</th>
          </tr>
          <!-- Header Baris 3: Nomor Kolom (1 s/d 14) -->
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
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">12</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">13</th>
            <th class="py-1 px-1">14</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
          <template v-if="tableRows.length > 0">
            <tr
              v-for="row in tableRows"
              :key="row.perkara_id"
              class="hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-colors"
            >
              <!-- 1. No -->
              <td class="py-2 px-2 text-center font-medium border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                {{ row.no }}
              </td>

              <!-- 2. Nomor Perkara -->
              <td class="py-2 px-3 font-semibold border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-primary-700 dark:text-primary-300">
                {{ row.nomor_perkara }}
              </td>

              <!-- 3. Kode Perkara -->
              <td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700">
                <span class="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {{ row.kode_perkara }}
                </span>
              </td>

              <!-- 4. Nama Majelis Hakim -->
              <td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700 text-[11px] leading-relaxed">
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

              <!-- 5. Nama PP -->
              <td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700 text-[11px] font-medium">
                {{ row.panitera_pengganti || '-' }}
              </td>

              <!-- 6. Penerimaan -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.tanggal_pendaftaran) }}
              </td>

              <!-- 7. PMH -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.pmh) }}
              </td>

              <!-- 8. PHS -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.phs) }}
              </td>

              <!-- 9. Sidang I -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                {{ formatTanggal(row.sidang_pertama) }}
              </td>

              <!-- 10. Diputus -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]" :class="row.tanggal_putusan ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''">
                {{ formatTanggal(row.tanggal_putusan) }}
              </td>

              <!-- 11. Jenis Putusan -->
              <td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <UBadge
                  v-if="row.jenis_putusan"
                  :color="getPutusanBadgeColor(row.jenis_putusan)"
                  variant="subtle"
                  size="xs"
                >
                  {{ row.jenis_putusan }}
                </UBadge>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- 12. Belum Dibagi -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.belum_dibagi" class="text-red-600 dark:text-red-400 font-semibold">
                  {{ row.belum_dibagi }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- 13. Belum Diputus -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.belum_diputus" class="text-amber-600 dark:text-amber-400 font-semibold">
                  {{ row.belum_diputus }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- 14. Ket -->
              <td class="py-2 px-2 text-center text-gray-400 text-[11px]">
                {{ row.ket || '-' }}
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="14" class="py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <UIcon name="i-heroicons-inbox" class="w-8 h-8 text-gray-400" />
                <p class="font-medium text-sm">Tidak ada data perkara untuk periode dan kriteria ini</p>
                <p class="text-xs text-gray-400">Coba ubah filter bulan, tahun, alur perkara, atau kata kunci pencarian</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Navigator -->
    <div v-if="pageSize > 0 && totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Menampilkan data ke-{{ ((page - 1) * pageSize) + 1 }} sampai {{ Math.min(page * pageSize, totalRows) }} dari {{ totalRows }} perkara
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
  selectedAlur,
  searchQuery,
  page,
  pageSize,
  refreshSignal,
  pageSizeOptions,
  formatTanggal
} = useLipa1()

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

watch(selectedAlur, () => {
  page.value = 1
})

watch(pageSize, () => {
  page.value = 1
})

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa1/list', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    alur: selectedAlur.value,
    search: searchQuery.value,
    page: page.value,
    pageSize: pageSize.value
  })),
  watch: [selectedYear, selectedMonth, selectedAlur, searchQuery, page, pageSize],
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
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

const getPutusanBadgeColor = (jenisPutusan) => {
  if (!jenisPutusan) return 'gray'
  const text = jenisPutusan.toLowerCase()
  if (text.includes('kabul') || text.includes('dikabulkan')) return 'emerald'
  if (text.includes('cabut') || text.includes('dicabut')) return 'orange'
  if (text.includes('tolak') || text.includes('ditolak')) return 'red'
  if (text.includes('gugur')) return 'amber'
  if (text.includes('tidak dapat diterima') || text.includes('n.o') || text.includes('no')) return 'rose'
  return 'blue'
}
</script>
