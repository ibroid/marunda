<template>
  <div class="space-y-4">
    <!-- State 1: Belum Melakukan Pencarian (Halaman Awal) -->
    <UCard
      v-if="!searchQuery"
      :ui="{ body: { padding: 'p-8 sm:p-12' } }"
      class="text-center"
    >
      <div class="max-w-md mx-auto space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Pencarian Data Principal SIPP
          </h3>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            Menampilkan data pihak prinsipal perkara SIPP (Penggugat, Tergugat, Intervensi, dan Turut Tergugat). Saksi persidangan otomatis disaring. Silakan ketik nama pihak, NIK, atau kriteria lainnya di kolom pencarian.
          </p>
        </div>

        <!-- Quick filter chips / shortcut suggestions -->
        <div class="pt-2 flex flex-wrap justify-center gap-2">
          <UBadge
            color="gray"
            variant="subtle"
            size="sm"
            class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="quickSearch('Siti')"
          >
            Contoh: "Siti"
          </UBadge>
          <UBadge
            color="gray"
            variant="subtle"
            size="sm"
            class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="quickSearch('Ahmad')"
          >
            Contoh: "Ahmad"
          </UBadge>
          <UBadge
            color="gray"
            variant="subtle"
            size="sm"
            class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="quickSearch('PT')"
          >
            Contoh: "PT"
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- State 2 & 3: Sedang Mencari / Menampilkan Hasil -->
    <UCard v-else :ui="{ body: { padding: 'p-0' } }">
      <!-- Loading progress strip saat fetching data -->
      <div v-if="isLoading" class="w-full h-1 bg-primary-100 dark:bg-primary-950/40 overflow-hidden relative">
        <div class="h-full bg-primary-600 dark:bg-primary-500 w-1/3 rounded-full animate-pulse transition-all"></div>
      </div>

      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Hasil Pencarian: "{{ searchQuery }}"
            </h3>
            <UBadge v-if="isLoading" color="amber" variant="subtle" size="xs" class="inline-flex items-center">
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 mr-1 animate-spin text-amber-500" />
              <span>Mencari data pihak...</span>
            </UBadge>
            <UBadge v-else-if="data?.total !== undefined" color="primary" variant="subtle" size="xs">
              {{ formatNumber(data?.total || 0) }} Pihak Ditemukan
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
              <th class="px-3.5 py-3 min-w-[200px]">Nama Pihak</th>
              <th class="px-3.5 py-3 min-w-[140px]">Identitas (NIK)</th>
              <th class="px-3.5 py-3 min-w-[120px]">Kontak</th>
              <th class="px-3.5 py-3 min-w-[180px]">Alamat & Wilayah</th>
              <th class="px-3.5 py-3 min-w-[130px]">Pekerjaan</th>
              <th class="px-3.5 py-3 text-center min-w-[90px]">Perkara</th>
              <th class="px-3.5 py-3 text-center w-24">Aksi</th>
            </tr>
          </thead>

          <!-- Skeleton Rows saat Loading -->
          <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="i in Math.min(Number(limit) || 20, 10)" :key="i" class="animate-pulse">
              <td class="px-3.5 py-3 text-center">
                <USkeleton class="h-3 w-4 mx-auto" />
              </td>
              <td class="px-3.5 py-3">
                <div class="space-y-1.5">
                  <USkeleton class="h-3.5 w-48" />
                  <div class="flex gap-1.5">
                    <USkeleton class="h-3 w-16" />
                    <USkeleton class="h-3 w-12" />
                    <USkeleton class="h-3 w-14" />
                  </div>
                </div>
              </td>
              <td class="px-3.5 py-3">
                <div class="space-y-1">
                  <USkeleton class="h-3.5 w-32" />
                  <USkeleton class="h-2.5 w-14" />
                </div>
              </td>
              <td class="px-3.5 py-3">
                <div class="space-y-1">
                  <USkeleton class="h-3.5 w-24" />
                  <USkeleton class="h-2.5 w-28" />
                </div>
              </td>
              <td class="px-3.5 py-3">
                <div class="space-y-1">
                  <USkeleton class="h-3.5 w-44" />
                  <USkeleton class="h-2.5 w-32" />
                </div>
              </td>
              <td class="px-3.5 py-3">
                <div class="space-y-1">
                  <USkeleton class="h-3.5 w-28" />
                  <USkeleton class="h-2.5 w-16" />
                </div>
              </td>
              <td class="px-3.5 py-3 text-center">
                <USkeleton class="h-5 w-16 mx-auto rounded-full" />
              </td>
              <td class="px-3.5 py-3 text-center">
                <USkeleton class="h-6 w-14 mx-auto rounded" />
              </td>
            </tr>
          </tbody>

          <!-- Real Rows -->
          <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(item, idx) in data?.data || []"
              :key="item.id"
              class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
            >
              <!-- No -->
              <td class="px-3.5 py-3 text-center text-gray-400">
                {{ (page - 1) * limit + idx + 1 }}
              </td>

              <!-- Nama Pihak & Tag -->
              <td class="px-3.5 py-3">
                <div class="font-semibold text-gray-900 dark:text-white leading-tight">
                  {{ item.nama }}
                </div>
                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                  <!-- Tag Jenis Pihak -->
                  <UBadge
                    :color="getJenisPihakColor(item.jenis_pihak_id)"
                    variant="subtle"
                    size="xs"
                    class="text-[10px] px-1.5 py-0"
                  >
                    {{ item.jenis_pihak_nama }}
                  </UBadge>
                  <!-- Tag Gender -->
                  <UBadge
                    v-if="item.jenis_kelamin"
                    :color="item.jenis_kelamin === 'L' ? 'blue' : 'pink'"
                    variant="subtle"
                    size="xs"
                    class="text-[10px] px-1.5 py-0"
                  >
                    {{ item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}
                  </UBadge>
                  <!-- ID Pihak -->
                  <span class="text-[10px] text-gray-400">ID: {{ item.id }}</span>
                </div>
              </td>

              <!-- NIK / Identitas -->
              <td class="px-3.5 py-3">
                <div v-if="item.nomor_indentitas" class="space-y-0.5">
                  <div class="font-mono text-gray-800 dark:text-gray-200">
                    {{ item.nomor_indentitas }}
                  </div>
                  <span class="text-[10px] text-gray-400 uppercase">
                    {{ item.jenis_indentitas_nama || 'Identitas' }}
                  </span>
                </div>
                <span v-else class="text-gray-400 italic text-[11px]">- Tidak Tercatat -</span>
              </td>

              <!-- Kontak -->
              <td class="px-3.5 py-3">
                <div v-if="item.telepon || item.email" class="space-y-0.5">
                  <div v-if="item.telepon" class="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <UIcon name="i-heroicons-phone" class="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{{ item.telepon }}</span>
                  </div>
                  <div v-if="item.email" class="flex items-center gap-1 text-gray-500 text-[11px] truncate max-w-[140px]">
                    <UIcon name="i-heroicons-envelope" class="w-3 h-3 text-gray-400 shrink-0" />
                    <span class="truncate">{{ item.email }}</span>
                  </div>
                </div>
                <span v-else class="text-gray-400 text-[11px]">-</span>
              </td>

              <!-- Alamat & Wilayah -->
              <td class="px-3.5 py-3">
                <div class="text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug">
                  {{ item.alamat || '-' }}
                </div>
                <div
                  v-if="(item.kecamatan_nama && item.kecamatan_nama !== '-') || (item.kelurahan_nama && item.kelurahan_nama !== '-')"
                  class="flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 mt-0.5"
                >
                  <UIcon name="i-heroicons-map-pin" class="w-3 h-3 shrink-0" />
                  <span class="truncate">
                    {{ item.kelurahan_nama !== '-' ? item.kelurahan_nama : '' }}
                    {{ item.kelurahan_nama !== '-' && item.kecamatan_nama !== '-' ? ', ' : '' }}
                    {{ item.kecamatan_nama !== '-' ? 'Kec. ' + item.kecamatan_nama : '' }}
                  </span>
                </div>
              </td>

              <!-- Pekerjaan -->
              <td class="px-3.5 py-3 text-gray-600 dark:text-gray-400">
                <div class="font-medium text-gray-800 dark:text-gray-200">
                  {{ item.pekerjaan || '-' }}
                </div>
                <div v-if="item.pendidikan" class="text-[10px] text-gray-400">
                  {{ item.pendidikan }}
                </div>
              </td>

              <!-- Jumlah Perkara -->
              <td class="px-3.5 py-3 text-center">
                <UBadge
                  :color="Number(item.total_perkara) > 0 ? 'emerald' : 'gray'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.total_perkara || 0 }} Perkara
                </UBadge>
              </td>

              <!-- Aksi -->
              <td class="px-3.5 py-3 text-center">
                <UButton
                  color="primary"
                  variant="ghost"
                  size="2xs"
                  icon="i-heroicons-eye"
                  @click="openDetail(item.id)"
                >
                  Detail
                </UButton>
              </td>
            </tr>

            <!-- Jika Data Tidak Ditemukan -->
            <tr v-if="!isLoading && !data?.data?.length">
              <td colspan="8" class="px-4 py-12 text-center">
                <div class="max-w-sm mx-auto space-y-2">
                  <UIcon name="i-heroicons-face-frown" class="w-8 h-8 text-gray-400 mx-auto" />
                  <p class="font-semibold text-gray-700 dark:text-gray-300">
                    Tidak ditemukan data pihak
                  </p>
                  <p class="text-xs text-gray-400">
                    Tidak ada pihak yang cocok dengan kata kunci "{{ searchQuery }}". Cobalah menggunakan kata kunci yang lebih umum atau periksa ejaan.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <template #footer v-if="!isLoading && data?.total > 0">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-xs text-gray-500">
            Menampilkan <strong>{{ (page - 1) * limit + 1 }}</strong> -
            <strong>{{ Math.min(page * limit, data?.total || 0) }}</strong> dari
            <strong>{{ formatNumber(data?.total) }}</strong> data pihak
          </div>
          <UPagination
            v-model="page"
            :total="data?.total || 0"
            :page-count="limit"
            :ui="{ wrapper: 'flex items-center gap-1' }"
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
  jenisPihak,
  jenisKelamin,
  page,
  limit,
  isSearching,
  refreshSignal,
  openDetail
} = usePrincipal()

const queryParams = computed(() => ({
  search: searchQuery.value,
  searchBy: searchBy.value,
  jenisPihak: jenisPihak.value,
  jenisKelamin: jenisKelamin.value,
  page: page.value,
  limit: limit.value
}))

const { data, pending, refresh } = useLazyFetch('/api/principal/list', {
  server: false,
  query: queryParams,
  watch: [searchQuery, searchBy, jenisPihak, jenisKelamin, page, limit],
  default: () => null
})

// Loading indicator aktif ketika request pending atau saat tombol cari/filter dipicu
const isLoading = computed(() => pending.value || isSearching.value)

watch(pending, (val) => {
  isSearching.value = val
})

watch(refreshSignal, () => {
  if (searchQuery.value) {
    refresh()
  }
})

const quickSearch = (keyword) => {
  isSearching.value = true
  searchQuery.value = keyword
  page.value = 1
}

const getJenisPihakColor = (id) => {
  switch (Number(id)) {
    case 1:
      return 'blue'
    case 3:
      return 'violet'
    case 2:
    case 4:
      return 'amber'
    default:
      return 'gray'
  }
}

const formatNumber = (val) => {
  if (!val) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(val))
}
</script>
