<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4 p-5">
    <!-- Kontrol Toolbar: Search & Paging Selector -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Box -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nomor perkara PA/PTA/Kasasi/PK..."
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
          Total: <strong class="text-gray-900 dark:text-white">{{ totalRows.toLocaleString('id-ID') }}</strong> perkara PK
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

    <!-- Tabel Detail LIPA 4 Sesuai Format Resmi 10 Kolom Gambar -->
    <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table class="w-full text-xs text-left border-collapse min-w-[1200px]">
        <thead>
          <!-- Header Baris 1: Kolom Utama & Grup Tanggal -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 w-12 align-middle">
              NO
            </th>
            <th colspan="3" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/50 dark:bg-gray-600/50 tracking-wider">
              NOMOR PERKARA
            </th>
            <th colspan="5" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/70 dark:bg-gray-600/60 tracking-wider">
              TANGGAL
            </th>
            <th rowspan="2" class="py-2.5 px-3 w-44 align-middle">
              KETERANGAN
            </th>
          </tr>
          <!-- Header Baris 2: Sub-kolom Nomor Perkara & Tanggal Sesuai Gambar LIPA 4 -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[150px]">
              TINGKAT PERTAMA
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[150px]">
              TINGKAT BANDING
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[130px]">
              TINGKAT KASASI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[130px]">
              PERMOHONAN<br />DAN RISALAH<br />PENINJAUAN KEMBALI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[110px]">
              PENGIRIMAN<br />BERKAS KE MA
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[110px]">
              PUTUS<br />PENINJAUAN<br />KEMBALI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[125px]">
              PENERIMAAN<br />KEMBALI BERKAS<br />PENINJAUAN<br />KEMBALI DI PA
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[125px]">
              PEMBERITAHUAN<br />KE PARA PIHAK
            </th>
          </tr>
          <!-- Header Baris 3: Nomor Kolom (1 s/d 9) Sesuai Gambar Asli LIPA 4 -->
          <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold text-center border-b border-gray-300 dark:border-gray-600">
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">1</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">2</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700"></th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">3</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">4</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">5</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">6</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">7</th>
            <th class="py-1 px-1 border-r border-gray-200 dark:border-gray-700">8</th>
            <th class="py-1 px-1">9</th>
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

              <!-- 2. NOMOR PERKARA TINGKAT PERTAMA -->
              <td class="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">
                <span class="font-semibold text-primary-700 dark:text-primary-300">
                  {{ row.nomor_perkara_pa }}
                </span>
              </td>

              <!-- 3. NOMOR PERKARA TINGKAT BANDING -->
              <td class="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <span v-if="row.nomor_perkara_banding && row.nomor_perkara_banding !== '-'" class="font-medium text-gray-800 dark:text-gray-200">
                  {{ row.nomor_perkara_banding }}
                </span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>

              <!-- 4. NOMOR PERKARA TINGKAT KASASI -->
              <td class="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <span v-if="row.nomor_perkara_kasasi && row.nomor_perkara_kasasi !== '-'" class="font-medium text-gray-800 dark:text-gray-200">
                  {{ row.nomor_perkara_kasasi }}
                </span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>

              <!-- 5. PERMOHONAN DAN RISALAH PENINJAUAN KEMBALI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                {{ formatTanggal(row.permohonan_pk) }}
              </td>

              <!-- 6. PENGIRIMAN BERKAS KE MA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.pengiriman_berkas_ma" class="font-medium text-emerald-700 dark:text-emerald-300">
                  {{ formatTanggal(row.pengiriman_berkas_ma) }}
                </span>
                <span v-else class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-medium border border-rose-200 dark:border-rose-900">
                  Belum kirim
                </span>
              </td>

              <!-- 7. PUTUS PENINJAUAN KEMBALI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.putusan_pk" class="font-semibold text-emerald-600 dark:text-emerald-400">
                  {{ formatTanggal(row.putusan_pk) }}
                </span>
                <span v-else class="text-gray-400 italic">
                  Proses MA
                </span>
              </td>

              <!-- 8. PENERIMAAN KEMBALI BERKAS PENINJAUAN KEMBALI DI PA -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap text-[11px]">
                <span v-if="row.penerimaan_kembali_pa" class="font-medium text-gray-800 dark:text-gray-200">
                  {{ formatTanggal(row.penerimaan_kembali_pa) }}
                </span>
                <span v-else-if="row.putusan_pk" class="text-amber-600 dark:text-amber-400 text-[10px] italic">
                  Belum kembali
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- 9. PEMBERITAHUAN KE PARA PIHAK -->
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
                <div v-else-if="row.pemberitahuan_putusan_pk" class="text-gray-800 dark:text-gray-200 whitespace-nowrap text-center">
                  {{ formatTanggal(row.pemberitahuan_putusan_pk) }}
                </div>
                <span v-else class="text-gray-400 italic block text-center">-</span>
              </td>

              <!-- 10. KETERANGAN -->
              <td class="py-2.5 px-3 text-left text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                <span v-if="row.keterangan && row.keterangan !== '-'" class="line-clamp-2" :title="row.keterangan">
                  {{ row.keterangan }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="10" class="py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <UIcon name="i-heroicons-scale" class="w-8 h-8 text-gray-400" />
                <p class="font-medium text-sm">Tidak ada data perkara peninjauan kembali (PK) untuk periode dan filter ini</p>
                <p class="text-xs text-gray-400">Coba ubah filter bulan, tahun, status PK, atau kata kunci pencarian</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tanda Tangan Sesuai Format Resmi Badilag & Screenshot -->
    <div class="pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs sm:text-sm">
      <!-- Mengetahui: Ketua PA -->
      <div class="space-y-1">
        <p class="text-gray-600 dark:text-gray-400">Mengetahui</p>
        <p class="font-semibold text-gray-900 dark:text-white uppercase">
          Ketua {{ namaSatker }}
        </p>
        <div class="h-20"></div>
        <p class="font-bold underline text-gray-900 dark:text-white">
          {{ pejabat.ketuaNama }}
        </p>
        <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">
          NIP. {{ pejabat.ketuaNip }}
        </p>
      </div>

      <!-- Kanan: Panitera -->
      <div class="space-y-1 text-left sm:text-right">
        <p class="text-gray-600 dark:text-gray-400">
          {{ pejabat.kotaSatker }}, {{ formatTanggalIndo() }}
        </p>
        <p class="font-semibold text-gray-900 dark:text-white uppercase">
          Panitera
        </p>
        <div class="h-20"></div>
        <p class="font-bold underline text-gray-900 dark:text-white">
          {{ pejabat.paniteraNama }}
        </p>
        <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">
          NIP. {{ pejabat.paniteraNip }}
        </p>
      </div>
    </div>

    <!-- Pagination Navigator -->
    <div v-if="pageSize > 0 && totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Menampilkan data ke-{{ ((page - 1) * pageSize) + 1 }} sampai {{ Math.min(page * pageSize, totalRows) }} dari {{ totalRows }} perkara PK
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
const props = defineProps({
  namaSatker: {
    type: String,
    default: 'PENGADILAN AGAMA JAKARTA UTARA'
  },
  pejabat: {
    type: Object,
    default: () => ({
      ketuaNama: 'Dr. Khoiriyah Roihan, S.Ag., M.H.',
      ketuaNip: '197409261999032001',
      paniteraNama: 'H. Dede Supriadi, S.H., M.H.',
      paniteraNip: '197305041998031002',
      kotaSatker: 'Jakarta Utara'
    })
  }
})

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
  formatMultiTanggal,
  formatTanggalIndo
} = useLipa4()

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

const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa4/list', {
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
</script>
