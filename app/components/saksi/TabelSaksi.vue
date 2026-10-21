<template>
  <div class="space-y-4">
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <!-- Loading Progress Strip saat Fetching Data -->
      <div v-if="isLoading" class="w-full h-1 bg-primary-100 dark:bg-primary-950/40 overflow-hidden relative">
        <div class="h-full bg-primary-600 dark:bg-primary-500 w-1/3 rounded-full animate-pulse transition-all"></div>
      </div>

      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Daftar Saksi Persidangan SIPP
            </h3>
            <UBadge v-if="isLoading" color="amber" variant="subtle" size="xs" class="inline-flex items-center">
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 mr-1 animate-spin text-amber-500" />
              <span>Memuat data...</span>
            </UBadge>
            <UBadge v-else-if="data?.total !== undefined" color="primary" variant="subtle" size="xs">
              {{ formatNumber(data?.total || 0) }} Saksi Terdaftar
            </UBadge>
          </div>
          <span v-if="!isLoading && data?.total" class="text-xs text-gray-400">
            Halaman {{ page }} dari {{ data?.totalPages || 1 }}
          </span>
          <div v-else-if="isLoading" class="flex items-center gap-1.5">
            <USkeleton class="h-3.5 w-24" />
          </div>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 font-medium">
            <tr>
              <th class="px-3.5 py-3 w-12 text-center">No</th>
              <th class="px-3.5 py-3 min-w-[200px]">Nama Saksi & Keterangan</th>
              <th class="px-3.5 py-3 min-w-[180px]">Perkara Yang Disaksikan</th>
              <th class="px-3.5 py-3 min-w-[140px]">Identitas & Gender</th>
              <th class="px-3.5 py-3 min-w-[130px]">Pekerjaan</th>
              <th class="px-3.5 py-3 min-w-[180px]">Alamat / Domisili</th>
              <th class="px-3.5 py-3 text-center min-w-[110px]">Catatan BAP</th>
              <th class="px-3.5 py-3 text-center w-24">Aksi</th>
            </tr>
          </thead>

          <!-- Skeleton Rows saat Loading -->
          <tbody v-if="isLoading" class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="n in 8" :key="n" class="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td class="px-3.5 py-3.5 text-center"><USkeleton class="h-4 w-5 mx-auto" /></td>
              <td class="px-3.5 py-3.5 space-y-1">
                <USkeleton class="h-4 w-40" />
                <USkeleton class="h-3 w-24" />
              </td>
              <td class="px-3.5 py-3.5 space-y-1">
                <USkeleton class="h-4 w-32" />
                <USkeleton class="h-3 w-20" />
              </td>
              <td class="px-3.5 py-3.5 space-y-1">
                <USkeleton class="h-4 w-28" />
                <USkeleton class="h-3 w-16" />
              </td>
              <td class="px-3.5 py-3.5"><USkeleton class="h-4 w-24" /></td>
              <td class="px-3.5 py-3.5"><USkeleton class="h-4 w-36" /></td>
              <td class="px-3.5 py-3.5 text-center"><USkeleton class="h-5 w-16 mx-auto rounded-full" /></td>
              <td class="px-3.5 py-3.5 text-center"><USkeleton class="h-7 w-16 mx-auto rounded" /></td>
            </tr>
          </tbody>

          <!-- Empty State: Data Tidak Ditemukan -->
          <tbody v-else-if="!data?.data || data.data.length === 0">
            <tr>
              <td colspan="8" class="px-6 py-12 text-center">
                <div class="max-w-sm mx-auto space-y-3">
                  <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
                  </div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Data Saksi Tidak Ditemukan
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Tidak ada saksi yang sesuai dengan kriteria pencarian dan filter yang Anda tentukan.
                  </p>
                  <UButton
                    color="gray"
                    variant="outline"
                    size="xs"
                    icon="i-heroicons-arrow-path"
                    @click="resetFilters"
                  >
                    Reset Filter
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Data Baris Saksi -->
          <tbody v-else class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            <tr
              v-for="(row, index) in data.data"
              :key="row.saksi_id"
              class="hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-colors"
            >
              <!-- 1. Nomor Urut -->
              <td class="px-3.5 py-3 text-center font-mono text-gray-400">
                {{ (page - 1) * limit + index + 1 }}
              </td>

              <!-- 2. Nama Saksi & Status Hubungan -->
              <td class="px-3.5 py-3">
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ row.nama }}
                </div>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <!-- Saksi Pihak Ke-1 / Ke-2 -->
                  <UBadge
                    :color="row.saksi_pihak_ke === 1 ? 'sky' : (row.saksi_pihak_ke === 2 ? 'purple' : 'gray')"
                    variant="subtle"
                    size="xs"
                  >
                    {{ row.saksi_pihak_ke === 1 ? 'Saksi Penggugat/Pemohon' : (row.saksi_pihak_ke === 2 ? 'Saksi Tergugat/Termohon' : 'Saksi') }}
                  </UBadge>

                  <!-- Urutan Saksi -->
                  <span v-if="row.urutan" class="text-[10px] text-gray-400">
                    Ke-{{ row.urutan }}
                  </span>

                  <!-- Hubungan / Keterangan (misal Teman, Tetangga, Orang Tua) -->
                  <UBadge
                    v-if="row.keterangan_saksi"
                    color="gray"
                    variant="soft"
                    size="xs"
                    class="italic"
                  >
                    {{ row.keterangan_saksi }}
                  </UBadge>
                </div>
              </td>

              <!-- 3. Perkara Yang Disaksikan -->
              <td class="px-3.5 py-3">
                <div class="font-medium text-primary-600 dark:text-primary-400">
                  {{ row.nomor_perkara || '-' }}
                </div>
                <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ row.jenis_perkara_nama || 'Perkara' }}
                  <span v-if="row.tanggal_pendaftaran" class="text-gray-400">
                    • {{ formatDate(row.tanggal_pendaftaran) }}
                  </span>
                </div>
              </td>

              <!-- 4. Identitas & Gender -->
              <td class="px-3.5 py-3">
                <div class="font-mono text-gray-700 dark:text-gray-300">
                  {{ row.nomor_indentitas || '-' }}
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <UBadge
                    v-if="row.jenis_kelamin"
                    :color="row.jenis_kelamin === 'L' ? 'blue' : 'pink'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}
                  </UBadge>
                  <span v-if="row.agama_nama" class="text-[10px] text-gray-400">
                    {{ row.agama_nama }}
                  </span>
                </div>
              </td>

              <!-- 5. Pekerjaan -->
              <td class="px-3.5 py-3">
                <div class="text-gray-800 dark:text-gray-200">
                  {{ row.pekerjaan || '-' }}
                </div>
                <div v-if="row.pendidikan" class="text-[10px] text-gray-400 mt-0.5">
                  {{ row.pendidikan }}
                </div>
              </td>

              <!-- 6. Alamat / Domisili -->
              <td class="px-3.5 py-3">
                <div class="text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[220px]" :title="row.alamat">
                  {{ row.alamat || '-' }}
                </div>
              </td>

              <!-- 7. Status Keterangan Sidang / BAP -->
              <td class="px-3.5 py-3 text-center">
                <UBadge
                  v-if="row.has_keterangan"
                  color="emerald"
                  variant="subtle"
                  size="xs"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-emerald-600" />
                  <span>{{ row.total_keterangan }} BAP</span>
                </UBadge>
                <span v-else class="text-gray-400 text-[11px]">-</span>
              </td>

              <!-- 8. Aksi Detail -->
              <td class="px-3.5 py-3 text-center">
                <UButton
                  color="primary"
                  variant="soft"
                  size="xs"
                  icon="i-heroicons-eye"
                  @click="openDetail(row.saksi_id)"
                >
                  Detail
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <template #footer v-if="!isLoading && data?.total > 0">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="text-gray-500 dark:text-gray-400">
            Menampilkan <span class="font-medium text-gray-900 dark:text-white">{{ (page - 1) * limit + 1 }}</span>
            sampai <span class="font-medium text-gray-900 dark:text-white">{{ Math.min(page * limit, data.total) }}</span>
            dari <span class="font-medium text-gray-900 dark:text-white">{{ formatNumber(data.total) }}</span> data saksi
          </div>

          <UPagination
            v-model="page"
            :page-count="limit"
            :total="data.total"
            :max="5"
            size="sm"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
const {
  searchQuery,
  searchBy,
  saksiPihakKe,
  jenisKelamin,
  selectedYear,
  hasKeterangan,
  sortBy,
  page,
  limit,
  refreshSignal,
  openDetail,
  resetFilters,
  formatDate
} = useSaksi()

// Independent Lazy Fetch sesuai arsitektur Monev SIPP
const { data, pending } = useLazyFetch('/api/saksi/list', {
  server: false,
  query: computed(() => ({
    search: searchQuery.value,
    searchBy: searchBy.value,
    saksiPihakKe: saksiPihakKe.value,
    jenisKelamin: jenisKelamin.value,
    year: selectedYear.value,
    hasKeterangan: hasKeterangan.value,
    sortBy: sortBy.value,
    page: page.value,
    limit: limit.value
  })),
  watch: [
    refreshSignal,
    page,
    limit,
    searchQuery,
    searchBy,
    saksiPihakKe,
    jenisKelamin,
    selectedYear,
    hasKeterangan,
    sortBy
  ],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(num))
}
</script>
