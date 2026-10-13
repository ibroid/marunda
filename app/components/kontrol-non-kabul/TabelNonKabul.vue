<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Baris Atas: Info Jumlah & Input Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Daftar Perkara Non-Kabul: {{ activeStatusTitle }}
              </h3>
              <UBadge color="gray" variant="subtle" size="xs">
                {{ data?.pagination?.total || 0 }} Perkara
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan rincian perkara yang diputus dengan amar bukan dikabulkan beserta status administrasinya
            </p>
          </div>

          <!-- Search & Export -->
          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="w-full sm:w-72">
              <UInput
                v-model="searchInput"
                icon="i-heroicons-magnifying-glass"
                size="sm"
                placeholder="Cari nomor perkara, pihak, majelis, PP, no AC..."
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
                @click="exportToCsv(data?.items, `perkara-non-kabul-${filterYear}-${activeStatus}.csv`)"
              >
                Ekspor
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Baris Bawah: Tabs Kategori Status & Sorting -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <!-- Filter Kategori Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <button
              v-for="tab in statusTabs"
              :key="tab.id"
              type="button"
              class="px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 text-xs whitespace-nowrap"
              :class="[
                activeStatus === tab.id
                  ? (tab.id === 'anomali_ac' ? 'bg-red-600 text-white shadow-xs' : 'bg-primary-600 text-white shadow-xs')
                  : (tab.id === 'anomali_ac'
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
              ]"
              @click="setStatus(tab.id)"
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
            <th class="px-3.5 py-3 min-w-[180px]">Nomor &amp; Jenis Perkara</th>
            <th class="px-3.5 py-3 min-w-[200px]">Para Pihak</th>
            <th class="px-3.5 py-3 min-w-[120px]">Tgl Putus</th>
            <th class="px-3.5 py-3 min-w-[150px]">Status Putusan</th>
            <th class="px-3.5 py-3 min-w-[160px]">Validasi Audit</th>
            <th class="px-3.5 py-3 min-w-[180px]">Majelis Hakim</th>
            <th class="px-3.5 py-3 min-w-[170px]">PP &amp; Jurusita</th>
            <th class="px-3.5 py-3 text-center min-w-[90px]">Aksi SIPP</th>
          </tr>
        </thead>

        <!-- Skeleton Rows saat data awal belum termuat -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 8" :key="'skel-' + i" class="animate-pulse">
            <td class="px-3 py-3 text-center"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-36" />
              <USkeleton class="h-3 w-24" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-44" />
              <USkeleton class="h-3 w-32" />
            </td>
            <td class="px-3.5 py-3"><USkeleton class="h-4 w-20" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-5 w-24 rounded-full" /></td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-24" />
              <USkeleton class="h-3 w-20" />
            </td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-36" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-32" /></td>
            <td class="px-3.5 py-3 text-center"><USkeleton class="h-7 w-14 rounded mx-auto" /></td>
          </tr>
        </tbody>

        <!-- Empty State -->
        <tbody v-else-if="!data?.items?.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td colspan="9" class="px-4 py-12 text-center text-gray-500">
              <div class="flex flex-col items-center justify-center space-y-2">
                <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-emerald-500" />
                <p class="font-medium text-sm text-gray-800 dark:text-gray-200">
                  Tidak Ada Perkara Non-Kabul yang Sesuai Filter
                </p>
                <p class="text-xs text-gray-400 max-w-sm">
                  Tidak ditemukan perkara dengan filter status atau kata kunci pencarian yang dipilih saat ini.
                </p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Real Data Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data.items"
            :key="item.perkara_id"
            class="hover:bg-gray-50/75 dark:hover:bg-gray-800/40 transition"
            :class="{ 'bg-red-50/30 dark:bg-red-950/20': item.is_anomali_ac }"
          >
            <!-- 1. Nomor Baris -->
            <td class="px-3 py-3 text-center text-gray-400">
              {{ ((data?.pagination?.page || 1) - 1) * (data?.pagination?.limit || 20) + idx + 1 }}
            </td>

            <!-- 2. Nomor Perkara & Jenis Perkara -->
            <td class="px-3.5 py-3">
              <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{{ item.nomor_perkara }}</span>
                <span v-if="item.putusan_verstek === 'Y'" class="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold" title="Putusan Verstek">
                  VERSTEK
                </span>
              </div>
              <div class="text-[11px] text-gray-500 mt-0.5">
                {{ item.jenis_perkara_nama }}
              </div>
              <div class="text-[10px] text-gray-400">
                Daftar: {{ formatDate(item.tanggal_pendaftaran) }}
              </div>
            </td>

            <!-- 3. Para Pihak -->
            <td class="px-3.5 py-3 text-gray-600 dark:text-gray-300 leading-snug">
              <div class="line-clamp-2" :title="cleanHtml(item.para_pihak)">
                {{ cleanHtml(item.para_pihak) }}
              </div>
            </td>

            <!-- 4. Tanggal Putus -->
            <td class="px-3.5 py-3 whitespace-nowrap">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(item.tanggal_putusan) }}
              </div>
            </td>

            <!-- 5. Status Putusan -->
            <td class="px-3.5 py-3">
              <UBadge
                :color="getStatusBadgeColor(item.status_putusan_id, item.status_putusan_nama)"
                variant="subtle"
                size="xs"
                class="font-semibold"
              >
                {{ item.status_putusan_nama }}
              </UBadge>
            </td>

            <!-- 6. Validasi Audit (BHT, Minutasi, Anomali AC) -->
            <td class="px-3.5 py-3 space-y-1">
              <!-- Indikator Anomali Kritis: Ada Akta Cerai -->
              <div v-if="item.is_anomali_ac" class="flex items-center gap-1">
                <UBadge color="red" variant="solid" size="xs" class="font-bold animate-pulse">
                  ⚠️ Anomali: Ada AC
                </UBadge>
                <span class="text-[10px] text-red-600 dark:text-red-400 font-mono truncate max-w-[120px]" :title="item.nomor_akta_cerai">
                  {{ item.nomor_akta_cerai }}
                </span>
              </div>

              <!-- Status BHT -->
              <div class="flex items-center gap-1 text-[11px]">
                <span class="text-gray-400 text-[10px]">BHT:</span>
                <span v-if="item.tanggal_bht" class="text-emerald-600 dark:text-emerald-400 font-medium">
                  {{ formatDate(item.tanggal_bht) }}
                </span>
                <UBadge v-else color="amber" variant="subtle" size="xs" class="text-[10px] px-1 py-0.5">
                  Belum BHT
                </UBadge>
              </div>

              <!-- Status Minutasi -->
              <div class="flex items-center gap-1 text-[11px]">
                <span class="text-gray-400 text-[10px]">Minutasi:</span>
                <span v-if="item.tanggal_minutasi" class="text-gray-700 dark:text-gray-300 font-medium">
                  {{ formatDate(item.tanggal_minutasi) }}
                </span>
                <UBadge v-else color="rose" variant="subtle" size="xs" class="text-[10px] px-1 py-0.5">
                  Belum Minutasi
                </UBadge>
              </div>
            </td>

            <!-- 7. Majelis Hakim -->
            <td class="px-3.5 py-3 text-gray-700 dark:text-gray-300">
              <div class="line-clamp-2 text-[11px]" :title="cleanHtml(item.majelis_hakim_nama)">
                {{ cleanHtml(item.majelis_hakim_nama) }}
              </div>
            </td>

            <!-- 8. Panitera Pengganti & Jurusita -->
            <td class="px-3.5 py-3 space-y-0.5 text-[11px]">
              <div class="text-gray-800 dark:text-gray-200">
                <span class="text-gray-400 text-[10px]">PP:</span> {{ item.panitera_pengganti_nama || '-' }}
              </div>
              <div class="text-gray-500 dark:text-gray-400">
                <span class="text-gray-400 text-[10px]">JS:</span> {{ item.jurusita_nama || '-' }}
              </div>
            </td>

            <!-- 9. Tombol Buka SIPP -->
            <td class="px-3.5 py-3 text-center whitespace-nowrap">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                @click="openSipp(item.perkara_id)"
              >
                SIPP
              </UButton>
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
          <strong class="text-gray-800 dark:text-gray-200">
            {{ ((data?.pagination?.page || 1) - 1) * (data?.pagination?.limit || 20) + 1 }}
          </strong>
          -
          <strong class="text-gray-800 dark:text-gray-200">
            {{ Math.min((data?.pagination?.page || 1) * (data?.pagination?.limit || 20), data?.pagination?.total || 0) }}
          </strong>
          dari
          <strong class="text-gray-800 dark:text-gray-200">
            {{ data?.pagination?.total || 0 }}
          </strong>
          perkara
        </div>

        <UPagination
          v-if="(data?.pagination?.totalPages || 0) > 1"
          v-model="currentPage"
          :page-count="data?.pagination?.limit || 20"
          :total="data?.pagination?.total || 0"
          :max="5"
          size="xs"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup>
const {
  filterYear,
  activeStatus,
  setStatus,
  searchQuery,
  sortOrder,
  currentPage,
  limit,
  refreshSignal,
  loadingPerkaraId,
  formatDate,
  cleanHtml,
  openSipp,
  exportToCsv
} = useKontrolNonKabul()

// Debounce local search input
const searchInput = ref(searchQuery.value)
let searchTimeout = null

watch(searchInput, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 350)
})

const statusTabs = [
  { id: 'all', label: 'Semua Status', icon: 'i-heroicons-squares-2x2' },
  { id: 'dicabut', label: 'Dicabut', icon: 'i-heroicons-arrow-uturn-left' },
  { id: 'tidak_diterima', label: 'Tidak Diterima (NO)', icon: 'i-heroicons-exclamation-triangle' },
  { id: 'ditolak', label: 'Ditolak', icon: 'i-heroicons-x-circle' },
  { id: 'gugur', label: 'Gugur', icon: 'i-heroicons-archive-box-x-mark' },
  { id: 'dicoret', label: 'Dicoret Register', icon: 'i-heroicons-document-minus' },
  { id: 'perdamaian', label: 'Perdamaian', icon: 'i-heroicons-heart' },
  { id: 'anomali_ac', label: '⚠️ Anomali Terbit AC', icon: 'i-heroicons-shield-exclamation' },
  { id: 'belum_bht', label: 'Belum BHT', icon: 'i-heroicons-clock' },
  { id: 'belum_minutasi', label: 'Belum Minutasi', icon: 'i-heroicons-document-magnifying-glass' }
]

const sortOptions = [
  { label: 'Putusan Terbaru', value: 'putusan_desc' },
  { label: 'Putusan Terlama', value: 'putusan_asc' },
  { label: 'Pendaftaran Terbaru', value: 'daftar_desc' },
  { label: 'Nomor Perkara (A-Z)', value: 'nomor_asc' }
]

const activeStatusTitle = computed(() => {
  const match = statusTabs.find(t => t.id === activeStatus.value)
  return match ? match.label : 'Semua Putusan'
})

function getStatusBadgeColor(statusId, statusNama = '') {
  const sName = (statusNama || '').toLowerCase()
  if (sName.includes('cabut') || [67, 7, 37].includes(statusId)) return 'blue'
  if (sName.includes('tolak') || [63, 3, 32, 35].includes(statusId)) return 'rose'
  if (sName.includes('tidak dapat') || sName.includes('no') || [61, 64, 4, 33, 36, 84].includes(statusId)) return 'amber'
  if (sName.includes('gugur') || [65, 93, 6, 29, 31, 38].includes(statusId)) return 'purple'
  if (sName.includes('coret') || statusId === 66) return 'gray'
  if (sName.includes('damai') || [5, 85].includes(statusId)) return 'emerald'
  return 'gray'
}

// Data Fetching terdistribusi per komponen menggunakan useLazyFetch
const { data, pending, refresh } = useLazyFetch('/api/kontrol/non-kabul/list', {
  server: false,
  query: computed(() => ({
    year: filterYear.value,
    status: activeStatus.value,
    search: searchQuery.value,
    sort: sortOrder.value,
    page: currentPage.value,
    limit
  })),
  watch: [filterYear, activeStatus, searchQuery, sortOrder, currentPage],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([filterYear, activeStatus, searchQuery, sortOrder], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
