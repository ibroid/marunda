<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Baris Atas: Info Jumlah & Input Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Daftar Perkara: {{ activeAgingTitle }}
              </h3>
              <UBadge color="gray" variant="subtle" size="xs">
                {{ data?.pagination?.total || 0 }} Perkara
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan rincian perkara yang belum diisi tanggal minutasi pada tabel perkara_putusan
            </p>
          </div>

          <!-- Search & Export -->
          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="w-full sm:w-72">
              <UInput
                v-model="searchInput"
                icon="i-heroicons-magnifying-glass"
                size="sm"
                placeholder="Cari nomor perkara, pihak, majelis, PP..."
                :ui="{ icon: { trailing: { pointer: '' } } }"
              >
                <template v-if="searchInput" #trailing>
                  <UButton
                    color="gray"
                    variant="link"
                    icon="i-heroicons-x-mark"
                    :padded="false"
                    @click="searchInput = ''"
                  />
                </template>
              </UInput>
            </div>

            <!-- Tombol Ekspor CSV -->
            <UTooltip text="Ekspor data saat ini ke CSV / Excel">
              <UButton
                color="gray"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-down-tray"
                :disabled="!data?.items?.length"
                @click="exportToCsv(data?.items, `belum-minutasi-${filterYear}.csv`)"
              >
                Ekspor
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Baris Bawah: Tabs Kategori Aging & Sorting -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <!-- Filter Kategori Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button
              v-for="tab in agingTabs"
              :key="tab.id"
              type="button"
              class="px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 text-xs"
              :class="[
                activeAging === tab.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              @click="setAging(tab.id)"
            >
              <UIcon :name="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- Selector Urutan (Sort) -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-gray-400 text-[11px]">Urutkan:</span>
            <USelect
              v-model="sortOrder"
              :options="sortOptions"
              size="2xs"
              class="w-44"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Table Responsive Container -->
    <div class="overflow-x-auto -mx-4 sm:mx-0 min-h-[360px] relative">
      <!-- Loading Overlay saat perpindahan halaman / search -->
      <div v-if="pending && data?.items" class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-800">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 font-semibold">
          <tr>
            <th class="px-3 py-3 text-center w-12">No</th>
            <th class="px-3.5 py-3 min-w-[190px]">Nomor Perkara &amp; Jenis</th>
            <th class="px-3.5 py-3 min-w-[210px]">Para Pihak</th>
            <th class="px-3.5 py-3 min-w-[120px]">Tanggal Putus</th>
            <th class="px-3.5 py-3 min-w-[140px]">Lama dari Putus</th>
            <th class="px-3.5 py-3 min-w-[180px]">Majelis Hakim</th>
            <th class="px-3.5 py-3 min-w-[170px]">PP &amp; Jurusita</th>
            <th class="px-3.5 py-3 text-center min-w-[90px]">Aksi SIPP</th>
          </tr>
        </thead>

        <!-- Skeleton Rows saat data belum ada -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 8" :key="'skel-' + i" class="animate-pulse">
            <td class="px-3 py-3 text-center"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-36" />
              <USkeleton class="h-3 w-24" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-44" />
              <USkeleton class="h-2.5 w-32" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-20" />
              <USkeleton class="h-4 w-16 rounded" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-20 rounded-full" />
              <USkeleton class="h-2.5 w-16" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-32" />
              <USkeleton class="h-2.5 w-24" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-2.5 w-20" />
            </td>
            <td class="px-3.5 py-3 text-center">
              <USkeleton class="h-6 w-16 mx-auto rounded" />
            </td>
          </tr>
        </tbody>

        <!-- Real Data Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800/80">
          <tr
            v-for="(item, idx) in data?.items || []"
            :key="item.perkara_id"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
          >
            <!-- No -->
            <td class="px-3 py-3 text-center text-gray-400 font-mono">
              {{ (currentPage - 1) * limit + idx + 1 }}
            </td>

            <!-- Nomor Perkara & Jenis -->
            <td class="px-3.5 py-3">
              <span
                class="font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer block"
                title="Buka di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                {{ item.nomor_perkara }}
              </span>
              <span class="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                {{ item.jenis_perkara_nama || '-' }}
              </span>
            </td>

            <!-- Para Pihak -->
            <td class="px-3.5 py-3">
              <div
                class="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs"
                :title="cleanHtml(item.para_pihak)"
              >
                {{ cleanHtml(item.para_pihak) || '-' }}
              </div>
            </td>

            <!-- Tanggal Putusan & Status Putusan -->
            <td class="px-3.5 py-3 whitespace-nowrap">
              <span class="font-medium text-gray-800 dark:text-gray-200 block">
                {{ formatDate(item.tanggal_putusan) }}
              </span>
              <UBadge
                color="gray"
                variant="subtle"
                size="2xs"
                class="mt-1"
              >
                {{ item.status_putusan_nama || 'Putus' }}
              </UBadge>
            </td>

            <!-- Lama Keterlambatan / Selisih Hari -->
            <td class="px-3.5 py-3 whitespace-nowrap">
              <UBadge
                :color="getAgingBadgeColor(item.selisih_hari)"
                variant="subtle"
                size="xs"
                class="font-semibold"
              >
                <UIcon :name="getAgingIcon(item.selisih_hari)" class="w-3 h-3 mr-1" />
                {{ item.selisih_hari }} Hari
              </UBadge>
              <div class="text-[10px] text-gray-400 mt-0.5">
                {{ getAgingStatusText(item.selisih_hari) }}
              </div>
            </td>

            <!-- Majelis Hakim -->
            <td class="px-3.5 py-3">
              <div
                class="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs"
                :title="cleanHtml(item.majelis_hakim_nama)"
              >
                {{ cleanHtml(item.majelis_hakim_nama) || '-' }}
              </div>
            </td>

            <!-- Panitera Pengganti & Jurusita -->
            <td class="px-3.5 py-3">
              <div class="space-y-0.5">
                <div class="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate max-w-xs" :title="item.panitera_pengganti_nama">
                  <span class="text-gray-400 text-[10px]">PP:</span> {{ item.panitera_pengganti_nama || '-' }}
                </div>
                <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-xs" :title="item.jurusita_nama">
                  <span class="text-gray-400 text-[10px]">JS:</span> {{ item.jurusita_nama || '-' }}
                </div>
              </div>
            </td>

            <!-- Aksi: Buka SIPP -->
            <td class="px-3.5 py-3 text-center whitespace-nowrap">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                title="Buka detail perkara di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                Buka SIPP
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!data?.items?.length">
            <td colspan="8" class="px-4 py-12 text-center">
              <div class="max-w-sm mx-auto space-y-2">
                <UIcon name="i-heroicons-check-badge" class="w-10 h-10 text-emerald-500 mx-auto" />
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Perkara Belum Minutasi
                </p>
                <p class="text-xs text-gray-400">
                  {{ searchQuery ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Seluruh perkara telah selesai diminutasi sesuai kriteria filter yang dipilih.' }}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <template #footer>
      <div v-if="isLoading" class="flex items-center justify-between">
        <USkeleton class="h-4 w-44" />
        <USkeleton class="h-6 w-36 rounded" />
      </div>
      <div v-else-if="(data?.pagination?.total || 0) > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Menampilkan
          <strong class="text-gray-900 dark:text-white">
            {{ ((currentPage - 1) * limit) + 1 }}
          </strong>
          sampai
          <strong class="text-gray-900 dark:text-white">
            {{ Math.min(currentPage * limit, data?.pagination?.total || 0) }}
          </strong>
          dari
          <strong class="text-gray-900 dark:text-white">
            {{ data?.pagination?.total || 0 }}
          </strong>
          perkara
        </div>

        <div v-if="(data?.pagination?.totalPages || 0) > 1">
          <UPagination
            v-model="currentPage"
            :page-count="limit"
            :total="data?.pagination?.total || 0"
            :max="5"
            size="xs"
            :disabled="pending"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const {
  filterYear,
  activeAging,
  searchQuery,
  sortOrder,
  currentPage,
  limit,
  refreshSignal,
  loadingPerkaraId,
  setAging,
  formatDate,
  cleanHtml,
  openSipp,
  exportToCsv
} = useKontrolBelumMinutasi()

const searchInput = ref(searchQuery.value)
let debounceTimeout = null

watch(searchInput, (val) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 350)
})

const agingTabs = [
  { id: 'all', label: 'Semua Belum Minutasi', icon: 'i-heroicons-clipboard-document-list' },
  { id: 'aman', label: 'Masa Aman (<= 7 Hari)', icon: 'i-heroicons-check-circle' },
  { id: 'atensi', label: 'Atensi (8 - 14 Hari)', icon: 'i-heroicons-exclamation-triangle' },
  { id: 'terlambat', label: 'Terlambat (> 14 Hari)', icon: 'i-heroicons-shield-exclamation' }
]

const sortOptions = [
  { label: 'Putusan Terbaru', value: 'putusan_desc' },
  { label: 'Putusan Terlama', value: 'putusan_asc' },
  { label: 'Keterlambatan Terlama', value: 'hari_desc' },
  { label: 'Keterlambatan Terendah', value: 'hari_asc' },
  { label: 'Nomor Perkara (A-Z)', value: 'nomor_asc' }
]

const activeAgingTitle = computed(() => {
  const map = {
    all: 'Semua Perkara Belum Minutasi',
    aman: 'Perkara Dalam Masa Aman (≤ 7 Hari)',
    atensi: 'Perkara Kategori Atensi (8 - 14 Hari)',
    terlambat: 'Perkara Terlambat / EWS (> 14 Hari)'
  }
  return map[activeAging.value] || 'Daftar Perkara'
})

const { data, pending, refresh } = useLazyFetch('/api/kontrol/belum-minutasi/list', {
  server: false,
  query: computed(() => ({
    year: filterYear.value,
    aging: activeAging.value,
    search: searchQuery.value,
    sort: sortOrder.value,
    page: currentPage.value,
    limit
  })),
  watch: [filterYear, activeAging, searchQuery, sortOrder, currentPage],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([filterYear, activeAging, searchQuery, sortOrder], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})

function getAgingBadgeColor(selisihHari) {
  if (selisihHari > 14) return 'red'
  if (selisihHari > 7) return 'amber'
  return 'emerald'
}

function getAgingIcon(selisihHari) {
  if (selisihHari > 14) return 'i-heroicons-shield-exclamation'
  if (selisihHari > 7) return 'i-heroicons-exclamation-triangle'
  return 'i-heroicons-clock'
}

function getAgingStatusText(selisihHari) {
  if (selisihHari > 14) return 'Melewati 14 hari'
  if (selisihHari > 7) return 'Mendekati 14 hari'
  return 'Dalam tenggang normal'
}
</script>
