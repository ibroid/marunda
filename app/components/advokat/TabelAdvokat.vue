<template>
  <UCard :ui="{ body: { padding: 'p-0' } }">
    <!-- Loading progress strip saat fetching data -->
    <div v-if="isLoading" class="w-full h-1 bg-primary-100 dark:bg-primary-950/40 overflow-hidden relative">
      <div class="h-full bg-primary-600 dark:bg-primary-500 w-1/3 rounded-full animate-pulse transition-all"></div>
    </div>

    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Daftar Advokat & Kuasa Hukum
            <span v-if="searchQuery" class="text-xs text-primary-600 dark:text-primary-400 font-normal">
              (Hasil: "{{ searchQuery }}")
            </span>
          </h3>
          <UBadge v-if="isLoading" color="amber" variant="subtle" size="xs" class="inline-flex items-center">
            <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 mr-1 animate-spin text-amber-500" />
            <span>Memuat data advokat...</span>
          </UBadge>
          <UBadge v-else-if="data?.total !== undefined" color="primary" variant="subtle" size="xs">
            {{ formatNumber(data?.total || 0) }} Advokat Ditemukan
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
            <th class="px-3.5 py-3 min-w-[220px]">Nama Advokat / Kantor Hukum</th>
            <th class="px-3.5 py-3 min-w-[150px]">No. Induk / NIA</th>
            <th class="px-3.5 py-3 min-w-[130px]">Kontak</th>
            <th class="px-3.5 py-3 min-w-[200px]">Alamat Kantor / Domisili</th>
            <th class="px-3.5 py-3 min-w-[140px]">SK / Sumpah PT</th>
            <th class="px-3.5 py-3 text-center min-w-[100px]">Perkara Ditangani</th>
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
                <USkeleton class="h-2.5 w-16" />
              </div>
            </td>
            <td class="px-3.5 py-3">
              <USkeleton class="h-3.5 w-28" />
            </td>
            <td class="px-3.5 py-3">
              <div class="space-y-1">
                <USkeleton class="h-3.5 w-24" />
                <USkeleton class="h-2.5 w-32" />
              </div>
            </td>
            <td class="px-3.5 py-3">
              <USkeleton class="h-3.5 w-44" />
            </td>
            <td class="px-3.5 py-3">
              <div class="space-y-1">
                <USkeleton class="h-3.5 w-28" />
                <USkeleton class="h-2.5 w-20" />
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

            <!-- Nama Advokat -->
            <td class="px-3.5 py-3">
              <div class="font-semibold text-gray-900 dark:text-white leading-tight">
                {{ item.nama }}
              </div>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-[10px] text-gray-400">ID: {{ item.id }}</span>
                <UBadge
                  v-if="Number(item.total_perkara) > 0"
                  color="emerald"
                  variant="subtle"
                  size="xs"
                  class="text-[10px] px-1.5 py-0"
                >
                  Aktif Berperkara
                </UBadge>
              </div>
            </td>

            <!-- No. Induk / NIA -->
            <td class="px-3.5 py-3">
              <div v-if="item.nomor_induk" class="font-mono text-gray-800 dark:text-gray-200">
                {{ item.nomor_induk }}
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

            <!-- Alamat Kantor -->
            <td class="px-3.5 py-3">
              <div class="text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug">
                {{ item.alamat_kantor || '-' }}
              </div>
            </td>

            <!-- SK Menkeh / Sumpah PT -->
            <td class="px-3.5 py-3 text-gray-600 dark:text-gray-400">
              <div v-if="item.no_sk_menkeh" class="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                SK: {{ item.no_sk_menkeh }}
              </div>
              <div v-if="item.tanggal_penyumpahan_pt" class="text-[11px] text-gray-500">
                Sumpah PT: {{ formatDate(item.tanggal_penyumpahan_pt) }}
              </div>
              <span v-if="!item.no_sk_menkeh && !item.tanggal_penyumpahan_pt" class="text-gray-400 text-[11px]">-</span>
            </td>

            <!-- Jumlah Perkara -->
            <td class="px-3.5 py-3 text-center">
              <UBadge
                :color="Number(item.total_perkara) > 0 ? 'emerald' : 'gray'"
                variant="subtle"
                size="xs"
              >
                {{ formatNumber(item.total_perkara) }} Perkara
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

          <!-- Jika Data Kosong -->
          <tr v-if="!isLoading && !data?.data?.length">
            <td colspan="8" class="px-4 py-12 text-center">
              <div class="max-w-sm mx-auto space-y-2">
                <UIcon name="i-heroicons-face-frown" class="w-8 h-8 text-gray-400 mx-auto" />
                <p class="font-semibold text-gray-700 dark:text-gray-300">
                  Tidak ditemukan data advokat
                </p>
                <p class="text-xs text-gray-400">
                  Tidak ada data advokat yang cocok dengan kriteria pencarian Anda.
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
          <strong>{{ formatNumber(data?.total) }}</strong> data advokat
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
</template>

<script setup>
const {
  searchQuery,
  filterStatus,
  sortBy,
  page,
  limit,
  isSearching,
  refreshSignal,
  openDetail,
  formatDate
} = useAdvokat()

const queryParams = computed(() => ({
  search: searchQuery.value,
  filterStatus: filterStatus.value,
  sortBy: sortBy.value,
  page: page.value,
  limit: limit.value
}))

const { data, pending, refresh } = useLazyFetch('/api/advokat/list', {
  server: false,
  query: queryParams,
  watch: [searchQuery, filterStatus, sortBy, page, limit],
  default: () => null
})

const isLoading = computed(() => pending.value || isSearching.value)

watch(pending, (val) => {
  isSearching.value = val
})

watch(refreshSignal, () => {
  refresh()
})

const formatNumber = (val) => {
  if (!val) return '0'
  return new Intl.NumberFormat('id-ID').format(Number(val))
}
</script>
