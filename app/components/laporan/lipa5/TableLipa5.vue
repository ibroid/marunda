<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-4 p-5">
    <!-- Kontrol Toolbar: Search & Paging Selector -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Box -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchInput"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nomor perkara / eksekusi / pemohon..."
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
          Total: <strong class="text-gray-900 dark:text-white">{{ totalRows.toLocaleString('id-ID') }}</strong> perkara eksekusi
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

    <!-- Tabel Detail LIPA 5 Sesuai Format Resmi 14 Kolom Gambar -->
    <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table class="w-full text-xs text-left border-collapse min-w-[1400px]">
        <thead>
          <!-- Header Baris 1: Kolom Utama & Grup Tanggal -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600">
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 w-12 align-middle">
              NO
            </th>
            <th colspan="2" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/50 dark:bg-gray-600/50 tracking-wider">
              NOMOR
            </th>
            <th colspan="7" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/70 dark:bg-gray-600/60 tracking-wider">
              TANGGAL
            </th>
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[110px] align-middle">
              PENETAPAN NON<br />EKSEKUTABEL
            </th>
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[100px] align-middle">
              BERGANTUNG
            </th>
            <th rowspan="2" class="py-2.5 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[130px] align-middle">
              ALASAN
            </th>
            <th rowspan="2" class="py-2.5 px-2 min-w-[100px] align-middle">
              KET.
            </th>
          </tr>

          <!-- Header Baris 2: Sub-kolom Nomor & Tanggal Sesuai Gambar LIPA 5 -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-center border-b border-gray-300 dark:border-gray-600 text-[11px]">
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[150px]">
              EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[160px]">
              PUTUSAN ATAU<br />GROS AKTA YANG<br />DIMOHONKAN<br />EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PERMOHONAN<br />EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PENETAPAN<br />AANMANING
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PELAKSANAAN<br />AANMANING
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PENETAPAN<br />SITA<br />EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PELAKSANAAN<br />SITA<br />EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PENETAPAN<br />EKSEKUSI
            </th>
            <th class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 min-w-[105px]">
              PELAKSANAAN<br />EKSEKUSI
            </th>
          </tr>

          <!-- Header Baris 3: Nomor Kolom (1 s/d 14) Sesuai Template LIPA 5 -->
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
              :key="row.eksekusi_id"
              class="hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-colors"
            >
              <!-- 1. NO -->
              <td class="py-2.5 px-2 text-center font-medium border-r border-gray-200 dark:border-gray-700 align-middle">
                {{ row.no }}
              </td>

              <!-- 2. NOMOR EKSEKUSI -->
              <td class="py-2.5 px-2 text-center font-semibold text-primary-700 dark:text-primary-300 border-r border-gray-200 dark:border-gray-700 align-middle">
                {{ row.nomor_eksekusi }}
              </td>

              <!-- 3. PUTUSAN ATAU GROS AKTA YANG DIMOHONKAN -->
              <td class="py-2.5 px-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 align-middle">
                {{ row.nomor_perkara_pa }}
              </td>

              <!-- 4. PERMOHONAN EKSEKUSI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.permohonan_eksekusi) }}
              </td>

              <!-- 5. PENETAPAN AANMANING -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.penetapan_teguran_eksekusi) }}
              </td>

              <!-- 6. PELAKSANAAN AANMANING -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.pelaksanaan_teguran_eksekusi) }}
              </td>

              <!-- 7. PENETAPAN SITA EKSEKUSI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.penetapan_sita_eksekusi) }}
              </td>

              <!-- 8. PELAKSANAAN SITA EKSEKUSI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.pelaksanaan_sita_eksekusi) }}
              </td>

              <!-- 9. PENETAPAN EKSEKUSI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.penetapan_eksekusi_rill) }}
              </td>

              <!-- 10. PELAKSANAAN EKSEKUSI -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.pelaksanaan_eksekusi_rill) }}
              </td>

              <!-- 11. PENETAPAN NON EKSEKUTABEL -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap align-middle">
                {{ formatTanggal(row.penetapan_noneksekusi) }}
              </td>

              <!-- 12. BERGANTUNG -->
              <td class="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-700 text-gray-400 italic align-middle">
                {{ row.bergantung || '-' }}
              </td>

              <!-- 13. ALASAN -->
              <td class="py-2.5 px-2 text-left text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 text-[11px] leading-relaxed align-middle">
                <span v-if="row.alasan" class="line-clamp-2" :title="row.alasan">
                  {{ row.alasan }}
                </span>
                <span v-else class="text-gray-400 italic block text-center">-</span>
              </td>

              <!-- 14. KET. -->
              <td class="py-2.5 px-2 text-left text-gray-600 dark:text-gray-400 text-[11px] align-middle">
                <span v-if="row.keterangan" class="line-clamp-2" :title="row.keterangan">
                  {{ row.keterangan }}
                </span>
                <span v-else class="text-gray-400 italic block text-center">-</span>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else>
            <td colspan="14" class="py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <UIcon name="i-heroicons-bolt" class="w-8 h-8 text-gray-400" />
                <p class="font-medium text-sm">Tidak ada data perkara yang dimohonkan eksekusi untuk periode dan filter ini</p>
                <p class="text-xs text-gray-400">Coba ubah filter bulan, tahun, status eksekusi, atau kata kunci pencarian</p>
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
        Menampilkan data ke-{{ ((page - 1) * pageSize) + 1 }} sampai {{ Math.min(page * pageSize, totalRows) }} dari {{ totalRows }} perkara eksekusi
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
  pageSizeOptions,
  formatTanggal,
  refreshSignal
} = useLipa5()

const searchInput = ref(searchQuery.value)

// Lazy fetch data list perkara eksekusi mandiri (sesuai pilar arsitektur)
const { data, pending, refresh } = useLazyFetch('/api/laporan/lipa5/list', {
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

// Reset page ke 1 jika filter berubah
watch([selectedYear, selectedMonth, statusFilter, searchQuery, pageSize], () => {
  page.value = 1
})

const handleSearch = () => {
  searchQuery.value = searchInput.value.trim()
}

const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
}

const formatTanggalIndo = () => {
  const bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const d = new Date()
  return `${d.getDate()} ${bulanIndo[d.getMonth()]} ${d.getFullYear()}`
}
</script>
