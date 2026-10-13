<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Baris Atas: Info Jumlah & Input Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-500" />
                <span>Penundaan Sidang Belum di-Isi</span>
              </h3>
              <UBadge color="amber" variant="subtle" size="xs">
                {{ data?.pagination?.total || 0 }} Perkara
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Audit perkara yang telah lewat tanggal sidang dengan status ditunda (<code class="font-mono text-[11px]">ditunda = 'T'</code>) namun alasan/keterangan penundaan belum diinput di SIPP
            </p>
          </div>

          <!-- Search & Export -->
          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="w-full sm:w-72">
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

            <!-- Tombol Ekspor CSV -->
            <UTooltip text="Ekspor data ke CSV / Excel">
              <UButton
                color="gray"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-down-tray"
                :disabled="!data?.items?.length"
                @click="exportToCsv(data?.items, `penundaan-sidang-belum-diisi-${todayStr}.csv`)"
              >
                Ekspor
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Baris Bawah: Tabs Filter Waktu Keterlambatan -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button
              v-for="tab in waktuTabs"
              :key="tab.id"
              type="button"
              class="px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 text-xs"
              :class="[
                filterWaktuPenundaan === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              @click="setWaktuTab(tab.id)"
            >
              <UIcon :name="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <div class="text-xs text-gray-400">
            Halaman {{ data?.pagination?.page || 1 }} dari {{ data?.pagination?.totalPages || 1 }}
          </div>
        </div>
      </div>
    </template>

    <!-- Table Responsive Container -->
    <div class="overflow-x-auto -mx-4 sm:mx-0 min-h-[360px] relative">
      <!-- Loading Overlay saat perpindahan halaman / search -->
      <div v-if="pending && data?.items" class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-amber-500" />
      </div>

      <!-- Skeleton Table saat Inisialisasi Pertama -->
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
            <th class="py-2.5 px-3 font-semibold w-48">Ketua Majelis & PP</th>
            <th class="py-2.5 px-3 font-semibold w-56">Tgl Sidang Terakhir | Agenda</th>
            <th class="py-2.5 px-3 font-semibold text-center w-24">Sidang Keliling</th>
            <th class="py-2.5 px-3 font-semibold text-center w-36">Status Waktu</th>
            <th class="py-2.5 px-3 font-semibold text-center w-24">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
          <tr
            v-for="(item, idx) in data?.items"
            :key="item.perkara_id"
            class="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors"
          >
            <!-- No -->
            <td class="py-2.5 px-3 text-center text-gray-400 font-mono">
              {{ (currentPage - 1) * limit + idx + 1 }}
            </td>

            <!-- Nomor Perkara -->
            <td class="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
              <div class="font-mono text-xs">{{ item.nomor_perkara }}</div>
              <span class="inline-block mt-0.5 text-[10px] text-gray-400 capitalize">
                {{ item.proses_terakhir_text || 'Persidangan' }}
              </span>
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

            <!-- Ketua Majelis & PP -->
            <td class="py-2.5 px-3">
              <div class="text-[11px] font-medium text-gray-800 dark:text-gray-200">
                {{ item.ketua_majelis || '-' }}
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">
                PP: {{ item.panitera_pengganti || '-' }}
              </div>
            </td>

            <!-- Tgl Sidang Terakhir | Riwayat Agenda -->
            <td class="py-2.5 px-3">
              <div class="font-semibold text-xs text-gray-800 dark:text-gray-200">
                {{ formatDate(item.tanggal_sidang) }}
              </div>
              <div
                v-if="item.riwayat_sidang"
                class="text-[10px] text-gray-500 mt-0.5 line-clamp-2 max-w-xs cursor-help"
                :title="cleanHtml(item.riwayat_sidang)"
                v-html="item.riwayat_sidang"
              />
            </td>

            <!-- Sidang Keliling -->
            <td class="py-2.5 px-3 text-center">
              <UBadge
                :color="item.sidang_keliling === 'Y' ? 'cyan' : 'gray'"
                variant="subtle"
                size="xs"
              >
                {{ item.sidang_keliling === 'Y' ? 'Sidkel' : 'Kantor' }}
              </UBadge>
            </td>

            <!-- Status Waktu -->
            <td class="py-2.5 px-3 text-center">
              <UBadge
                :color="item.status_waktu === 'DALAM 24 JAM' ? 'amber' : 'rose'"
                variant="solid"
                size="xs"
              >
                {{ item.status_waktu }}
              </UBadge>
              <div class="text-[10px] text-gray-400 mt-0.5">
                {{ item.selisih_jam }} jam lalu
              </div>
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
            <td colspan="8" class="px-4 py-12 text-center">
              <div class="max-w-sm mx-auto space-y-2">
                <UIcon name="i-heroicons-check-badge" class="w-10 h-10 text-emerald-500 mx-auto" />
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Penundaan Sidang yang Belum di-Isi
                </p>
                <p class="text-xs text-gray-400">
                  {{ searchQuery ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Seluruh jadwal sidang tunda telah terisi alasannya dengan lengkap di SIPP.' }}
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
const {
  filterWaktuPenundaan,
  searchQuery,
  currentPage,
  limit,
  refreshSignal,
  loadingPerkaraId,
  formatDate,
  cleanHtml,
  openSipp,
  exportToCsv
} = usePersidangan()

const todayStr = new Date().toISOString().split('T')[0]
const searchInput = ref(searchQuery.value)
let debounceTimeout = null

watch(searchInput, (val) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 350)
})

const waktuTabs = [
  { id: 'all', label: 'Semua Status', icon: 'i-heroicons-clipboard-document-list' },
  { id: 'dalam_24_jam', label: 'Dalam 24 Jam', icon: 'i-heroicons-clock' },
  { id: 'lebih_24_jam', label: 'Lebih dari 24 Jam', icon: 'i-heroicons-exclamation-triangle' }
]

const setWaktuTab = (id) => {
  filterWaktuPenundaan.value = id
  currentPage.value = 1
}

const { data, pending, refresh } = useLazyFetch('/api/persidangan/penundaan', {
  server: false,
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: searchQuery.value,
    waktu: filterWaktuPenundaan.value
  })),
  watch: [currentPage, filterWaktuPenundaan, searchQuery],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})
</script>
