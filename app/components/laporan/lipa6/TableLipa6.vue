<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden space-y-6 p-6 print:p-0 print:border-none print:shadow-none">
    <!-- Toolbar: Pencarian & Info Filter (Hidden in Print) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
      <!-- Search Input Hakim -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="searchHakim"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nama hakim / majelis..."
          size="sm"
          :trailing="searchHakim ? true : false"
        >
          <template v-if="searchHakim" #trailing>
            <UButton
              color="gray"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="searchHakim = ''"
            />
          </template>
        </UInput>
      </div>

      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 font-medium">
          <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-primary-500" />
          <span>{{ filteredRows.length }} Hakim/Majelis</span>
        </span>
        <span class="italic text-[11px] text-gray-400">
          * Klik baris untuk melihat rincian perkara
        </span>
      </div>
    </div>

    <!-- Header Dokumen Cetak / Screenshot Sesuai Format Resmi LIPA 6 -->
    <div class="text-center space-y-1 relative">
      <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
        LAPORAN KEGIATAN HAKIM
      </h2>
      <p class="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">
        PADA {{ namaSatker }}
      </p>
      <p class="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
        BULAN {{ getNamaBulan(selectedMonth) }} {{ selectedYear }}
      </p>
      <div class="text-right text-xs font-bold text-gray-800 dark:text-gray-200 absolute right-0 bottom-0">
        LIPA6
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="space-y-2 py-4">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <!-- Tabel LIPA 6 Sesuai Format Persis Gambar Screenshot -->
    <div v-else class="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg print:border-gray-800 print:rounded-none">
      <table class="w-full text-xs text-left border-collapse min-w-[1050px]">
        <thead>
          <!-- Header Baris 1: Grup Kolom -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold text-center border-b border-gray-300 dark:border-gray-600 print:bg-white print:text-black">
            <th rowspan="2" class="py-2 px-2 border-r border-gray-300 dark:border-gray-600 w-10 align-middle">
              No.
            </th>
            <th rowspan="2" class="py-2 px-3 border-r border-gray-300 dark:border-gray-600 min-w-[220px] align-middle text-center">
              Nama Hakim/Majelis
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600">
              Sisa bulan lalu
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600">
              Tambah bulan ybs
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600 bg-gray-200/50 dark:bg-gray-600/50 print:bg-transparent">
              Jumlah
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600">
              Diputus
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600">
              Sisa bulan ybs
            </th>
            <th colspan="2" class="py-1.5 px-2 border-r border-gray-300 dark:border-gray-600">
              Jumlah yang diminutir
            </th>
            <th colspan="2" class="py-1.5 px-2">
              Sisa yang belum diminutir
            </th>
          </tr>

          <!-- Header Baris 2: Sub-kolom G dan P -->
          <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-center border-b border-gray-300 dark:border-gray-600 print:bg-white print:text-black">
            <!-- Sisa bulan lalu -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">P</th>

            <!-- Tambah bulan ybs -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">P</th>

            <!-- Jumlah -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11 bg-gray-200/50 dark:bg-gray-600/50 print:bg-transparent">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11 bg-gray-200/50 dark:bg-gray-600/50 print:bg-transparent">P</th>

            <!-- Diputus -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">P</th>

            <!-- Sisa bulan ybs -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-11">P</th>

            <!-- Jumlah yang diminutir -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-12">G</th>
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-12">P</th>

            <!-- Sisa yang belum diminutir -->
            <th class="py-1 px-2 border-r border-gray-300 dark:border-gray-600 w-12">G</th>
            <th class="py-1 px-2 w-12">P</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
          <template v-if="filteredRows.length > 0">
            <tr
              v-for="(row, idx) in filteredRows"
              :key="row.hakim_id"
              class="hover:bg-primary-50/40 dark:hover:bg-primary-950/30 cursor-pointer transition-colors"
              @click="handleSelectHakim(row)"
            >
              <!-- 1. No -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 font-medium">
                {{ idx + 1 }}
              </td>

              <!-- 2. Nama Hakim/Majelis -->
              <td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                <div class="flex items-center justify-between gap-1">
                  <span>{{ row.nama_hakim }}</span>
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 print:hidden" />
                </div>
              </td>

              <!-- 3. Sisa bulan lalu G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.sisa_lalu_g }}
              </td>

              <!-- 3. Sisa bulan lalu P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.sisa_lalu_p }}
              </td>

              <!-- 4. Tambah bulan ybs G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.tambah_g }}
              </td>

              <!-- 4. Tambah bulan ybs P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.tambah_p }}
              </td>

              <!-- 5. Jumlah G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 font-semibold bg-gray-50/60 dark:bg-gray-750/50 print:bg-transparent">
                {{ row.jumlah_g }}
              </td>

              <!-- 5. Jumlah P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 font-semibold bg-gray-50/60 dark:bg-gray-750/50 print:bg-transparent">
                {{ row.jumlah_p }}
              </td>

              <!-- 6. Diputus G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.putus_g }}
              </td>

              <!-- 6. Diputus P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.putus_p }}
              </td>

              <!-- 7. Sisa bulan ybs G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 font-medium">
                {{ row.sisa_ybs_g }}
              </td>

              <!-- 7. Sisa bulan ybs P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700 font-medium">
                {{ row.sisa_ybs_p }}
              </td>

              <!-- 8. Jumlah yang diminutir G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.minutir_g }}
              </td>

              <!-- 8. Jumlah yang diminutir P -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.minutir_p }}
              </td>

              <!-- 9. Sisa yang belum diminutir G -->
              <td class="py-2 px-2 text-center border-r border-gray-200 dark:border-gray-700">
                {{ row.belum_minutir_g }}
              </td>

              <!-- 9. Sisa yang belum diminutir P -->
              <td class="py-2 px-2 text-center">
                {{ row.belum_minutir_p }}
              </td>
            </tr>
          </template>

          <tr v-else>
            <td colspan="16" class="py-8 text-center text-gray-500">
              Tidak ada data hakim / majelis yang ditemukan
            </td>
          </tr>
        </tbody>

        <!-- Baris Total Keseluruhan Sesuai Standar Laporan LIPA -->
        <tfoot v-if="totals" class="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100/90 dark:bg-gray-750 font-bold text-gray-900 dark:text-white print:bg-white print:text-black">
          <tr>
            <td colspan="2" class="py-2 px-3 text-center border-r border-gray-300 dark:border-gray-600 uppercase tracking-wider">
              JUMLAH
            </td>
            <!-- Sisa Lalu -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.sisa_lalu_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.sisa_lalu_p }}</td>

            <!-- Tambah -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.tambah_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.tambah_p }}</td>

            <!-- Jumlah -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600 bg-gray-200/60 dark:bg-gray-700/60 print:bg-transparent">{{ totals.jumlah_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600 bg-gray-200/60 dark:bg-gray-700/60 print:bg-transparent">{{ totals.jumlah_p }}</td>

            <!-- Putus -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.putus_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.putus_p }}</td>

            <!-- Sisa ybs -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.sisa_ybs_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.sisa_ybs_p }}</td>

            <!-- Diminutir -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.minutir_g }}</td>
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.minutir_p }}</td>

            <!-- Belum Diminutir -->
            <td class="py-2 px-2 text-center border-r border-gray-300 dark:border-gray-600">{{ totals.belum_minutir_g }}</td>
            <td class="py-2 px-2 text-center">{{ totals.belum_minutir_p }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Tanda Tangan Sesuai Screenshot Resmi -->
    <div class="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs sm:text-sm print:pt-4">
      <!-- Mengetahui: Ketua PA -->
      <div class="space-y-1">
        <p class="text-gray-700 dark:text-gray-300">Mengetahui</p>
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
        <p class="text-gray-700 dark:text-gray-300">
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

    <!-- Modal Detail Perkara Hakim -->
    <LaporanLipa6ModalDetailHakim
      v-model="isDetailModalOpen"
      :hakim-id="selectedHakimId"
      :hakim-nama="selectedHakimNama"
    />
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
  selectedRole,
  refreshSignal,
  getNamaBulan,
  formatTanggalIndo
} = useLipa6()

const searchHakim = ref('')
const isDetailModalOpen = ref(false)
const selectedHakimId = ref(null)
const selectedHakimNama = ref('')

const { data: rekapData, pending, refresh } = useLazyFetch('/api/laporan/lipa6/rekap', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    role: selectedRole.value
  })),
  watch: [selectedYear, selectedMonth, selectedRole],
  default: () => null
})

watch(refreshSignal, () => {
  refresh()
})

const isLoading = computed(() => pending.value || !rekapData.value)

const rows = computed(() => rekapData.value?.data || [])
const totals = computed(() => rekapData.value?.totals || null)

const filteredRows = computed(() => {
  if (!searchHakim.value.trim()) return rows.value
  const q = searchHakim.value.toLowerCase()
  return rows.value.filter(r =>
    (r.nama_hakim && r.nama_hakim.toLowerCase().includes(q)) ||
    (r.nip && r.nip.includes(q))
  )
})

const handleSelectHakim = (hakim) => {
  selectedHakimId.value = hakim.hakim_id
  selectedHakimNama.value = hakim.nama_hakim
  isDetailModalOpen.value = true
}
</script>
