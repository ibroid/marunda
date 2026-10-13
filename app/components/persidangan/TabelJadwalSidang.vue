<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Baris Atas: Info Jadwal & Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-primary-500" />
                <span>Jadwal Sidang Pengadilan</span>
              </h3>
              <UBadge color="primary" variant="subtle" size="xs">
                {{ data?.pagination?.total || 0 }} Perkara
              </UBadge>
              <UBadge color="gray" variant="outline" size="xs" class="font-mono">
                {{ formatDate(filterDate) }}
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan jadwal perkara yang disidangkan pada hari ini atau tanggal yang ditentukan
            </p>
          </div>

          <!-- Controls: Tanggal, Search & Export -->
          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <!-- Pemilih Tanggal -->
            <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5 text-gray-400" />
              <input
                v-model="filterDate"
                type="date"
                class="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 border-none outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            <!-- Tombol Hari Ini -->
            <UButton
              size="xs"
              color="gray"
              variant="outline"
              @click="setToday"
            >
              Hari Ini
            </UButton>

            <!-- Search Bar -->
            <div class="w-full sm:w-60">
              <UInput
                v-model="searchInput"
                icon="i-heroicons-magnifying-glass"
                size="sm"
                placeholder="Cari nomor perkara, pihak, majelis..."
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

            <!-- Tombol Ekspor -->
            <UTooltip text="Ekspor jadwal ke CSV / Excel">
              <UButton
                color="gray"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-down-tray"
                :disabled="!data?.items?.length"
                @click="exportToCsv(data?.items, `jadwal-sidang-${filterDate}.csv`)"
              >
                Ekspor
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Baris Bawah: Filter Ruangan & Jenis Sidang -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Tabs Jenis Sidang -->
            <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
              <button
                v-for="tab in jenisSidangTabs"
                :key="tab.id"
                type="button"
                class="px-2.5 py-1 rounded-md font-medium text-xs transition"
                :class="[
                  filterJenisSidang === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                ]"
                @click="setJenisSidang(tab.id)"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Filter Ruangan Dropdown jika ada opsi ruangan -->
            <div v-if="data?.ruanganOptions?.length" class="flex items-center gap-1.5 ml-2">
              <span class="text-gray-400">Ruangan:</span>
              <select
                v-model="filterRuangan"
                class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer"
              >
                <option value="all">Semua Ruangan</option>
                <option v-for="ruang in data.ruanganOptions" :key="ruang" :value="ruang">
                  {{ ruang }}
                </option>
              </select>
            </div>
          </div>

          <div class="text-xs text-gray-400">
            Halaman {{ data?.pagination?.page || 1 }} dari {{ data?.pagination?.totalPages || 1 }}
          </div>
        </div>
      </div>
    </template>

    <!-- Table Responsive Container -->
    <div class="overflow-x-auto -mx-4 sm:mx-0 min-h-[360px] relative">
      <div v-if="pending && data?.items" class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <!-- Skeleton Table -->
      <div v-if="isLoading" class="p-4 space-y-3">
        <div v-for="i in 5" :key="i" class="flex gap-4 items-center">
          <USkeleton class="h-4 w-8" />
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-4 w-48" />
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-28" />
        </div>
      </div>

      <!-- Real Table -->
      <table v-else class="w-full text-left text-xs border-collapse">
        <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-y border-gray-200 dark:border-gray-800">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-center w-12">No</th>
            <th class="py-2.5 px-3 font-semibold w-48">Nomor Perkara</th>
            <th class="py-2.5 px-3 font-semibold">Pihak Penggugat / Pemohon</th>
            <th class="py-2.5 px-3 font-semibold w-36">Jam & Ruangan</th>
            <th class="py-2.5 px-3 font-semibold w-48">Majelis Hakim & PP</th>
            <th class="py-2.5 px-3 font-semibold w-56">Agenda Sidang</th>
            <th class="py-2.5 px-3 font-semibold text-center w-28">Status / Tunda</th>
            <th class="py-2.5 px-3 font-semibold text-center w-24">Lama Proses</th>
            <th class="py-2.5 px-3 font-semibold text-center w-20">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
          <tr
            v-for="(item, idx) in data?.items"
            :key="item.jadwal_id || `${item.perkara_id}-${idx}`"
            class="hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-colors"
          >
            <!-- No -->
            <td class="py-2.5 px-3 text-center text-gray-400 font-mono">
              {{ (currentPage - 1) * limit + idx + 1 }}
            </td>

            <!-- Nomor Perkara -->
            <td class="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
              <div class="font-mono text-xs">{{ item.nomor_perkara }}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <UBadge
                  v-if="item.sidang_keliling === 'Y'"
                  color="cyan"
                  variant="subtle"
                  size="xs"
                >
                  Sidang Keliling
                </UBadge>
                <span class="text-[10px] text-gray-400 capitalize">
                  {{ item.proses_terakhir_text || item.tahapan_terakhir_text || 'Sidang' }}
                </span>
              </div>
            </td>

            <!-- Para Pihak -->
            <td class="py-2.5 px-3 max-w-xs">
              <div class="font-medium text-gray-800 dark:text-gray-200 line-clamp-1" :title="item.pihak1_text">
                {{ item.pihak1_text || '-' }}
              </div>
              <div v-if="item.pihak2_text" class="text-[11px] text-gray-400 line-clamp-1 mt-0.5" :title="item.pihak2_text">
                vs {{ item.pihak2_text }}
              </div>
            </td>

            <!-- Jam & Ruangan -->
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-1 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-gray-400" />
                <span>{{ item.jam_sidang || '09:00' }}</span>
                <span v-if="item.sampai_jam" class="text-gray-400 font-normal"> - {{ item.sampai_jam }}</span>
              </div>
              <div class="mt-1 flex items-center gap-1">
                <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5 text-primary-500" />
                <span
                  class="text-[11px] font-medium"
                  :class="item.ruangan ? 'text-gray-700 dark:text-gray-300' : 'text-rose-500 italic'"
                >
                  {{ item.ruangan || 'Belum diisi' }}
                </span>
              </div>
            </td>

            <!-- Majelis Hakim & PP -->
            <td class="py-2.5 px-3">
              <div class="text-[11px] font-medium text-gray-800 dark:text-gray-200 line-clamp-1" :title="item.nama_ketua_majelis">
                {{ item.nama_ketua_majelis || '-' }}
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5 line-clamp-1" :title="item.nama_pp">
                PP: {{ item.nama_pp || '-' }}
              </div>
              <div v-if="item.nama_js" class="text-[10px] text-gray-400 line-clamp-1" :title="item.nama_js">
                JS: {{ item.nama_js }}
              </div>
            </td>

            <!-- Agenda Sidang -->
            <td class="py-2.5 px-3">
              <div class="text-xs text-gray-800 dark:text-gray-200 line-clamp-2" :title="item.agenda">
                {{ item.agenda || 'Agenda Belum Diisi' }}
              </div>
            </td>

            <!-- Status Tunda / Keterangan -->
            <td class="py-2.5 px-3 text-center">
              <div v-if="item.ditunda === 'Y' || item.ditunda === 'T'">
                <UBadge
                  :color="item.ditunda === 'Y' ? 'emerald' : 'amber'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.ditunda === 'Y' ? 'Selesai' : 'Ditunda' }}
                </UBadge>
                <div v-if="item.alasan_ditunda || item.keterangan" class="text-[10px] text-gray-400 mt-0.5 line-clamp-1" :title="item.alasan_ditunda || item.keterangan">
                  {{ item.alasan_ditunda || item.keterangan }}
                </div>
              </div>
              <span v-else class="text-xs text-gray-400 italic">
                Terjadwal
              </span>
            </td>

            <!-- Lama Proses -->
            <td class="py-2.5 px-3 text-center font-mono">
              <span class="font-bold text-gray-900 dark:text-white">{{ item.lamaproses || 0 }}</span>
              <span class="text-[10px] text-gray-400 ml-0.5">hr</span>
            </td>

            <!-- Aksi Buka SIPP -->
            <td class="py-2.5 px-3 text-center">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                title="Buka detail perkara di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                SIPP
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!data?.items?.length">
            <td colspan="9" class="px-4 py-12 text-center">
              <div class="max-w-sm mx-auto space-y-2">
                <UIcon name="i-heroicons-calendar" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Jadwal Sidang
                </p>
                <p class="text-xs text-gray-400">
                  {{ searchQuery ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : `Tidak ada jadwal sidang yang tercatat pada tanggal ${formatDate(filterDate)}.` }}
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
          Menampilkan baris <strong>{{ (currentPage - 1) * limit + 1 }}</strong> hingga
          <strong>{{ Math.min(currentPage * limit, data?.pagination?.total || 0) }}</strong>
          dari <strong>{{ data?.pagination?.total || 0 }}</strong> perkara
        </div>

        <div class="flex items-center gap-2">
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
const persidangan = usePersidangan()

const filterDate = persidangan.filterDate
const filterRuangan = persidangan.filterRuangan
const filterJenisSidang = persidangan.filterJenisSidang
const searchQuery = persidangan.searchQuery
const currentPage = persidangan.currentPage
const limit = persidangan.limit
const refreshSignal = persidangan.refreshSignal
const loadingPerkaraId = persidangan.loadingPerkaraId
const formatDate = persidangan.formatDate
const openSipp = persidangan.openSipp
const exportToCsv = persidangan.exportToCsv
const setToday = persidangan.setToday

const searchInput = ref(searchQuery.value)
let debounceTimeout = null

watch(searchInput, (val) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 350)
})

const jenisSidangTabs = [
  { id: 'all', label: 'Semua Sidang' },
  { id: 'kantor', label: 'Di Kantor' },
  { id: 'keliling', label: 'Sidang Keliling' }
]

const setJenisSidang = (id) => {
  filterJenisSidang.value = id
  currentPage.value = 1
}

watch(filterRuangan, () => {
  currentPage.value = 1
})

watch(filterDate, () => {
  currentPage.value = 1
})

const { data, pending, refresh } = useLazyFetch('/api/persidangan/jadwal', {
  server: false,
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: searchQuery.value,
    date: filterDate.value,
    ruangan: filterRuangan.value,
    jenis_sidang: filterJenisSidang.value
  })),
  watch: [currentPage, filterDate, filterRuangan, filterJenisSidang, searchQuery],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})
</script>
