<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col gap-3">
        <!-- Baris Atas: Info Jumlah & Input Controls -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-purple-500" />
                <span>Perkara Ditegur / Ditentukan Kemudian (Mediasi)</span>
              </h3>
              <UBadge color="purple" variant="subtle" size="xs">
                {{ data?.pagination?.total || 0 }} Perkara
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Monitoring penundaan persidangan karena ditegur, menunggu laporan hasil mediasi, atau tanggal sidang berikutnya ditentukan kemudian
            </p>
          </div>

          <!-- Search & Export -->
          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="w-full sm:w-72">
              <UInput
                v-model="searchInput"
                icon="i-heroicons-magnifying-glass"
                size="sm"
                placeholder="Cari nomor perkara, pihak, keterangan..."
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

            <UTooltip text="Ekspor data ke CSV / Excel">
              <UButton
                color="gray"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-down-tray"
                :disabled="!data?.items?.length"
                @click="exportToCsv(data?.items, `perkara-ditegur-mediasi-${todayStr}.csv`)"
              >
                Ekspor
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Baris Bawah: Tabs Filter Durasi Lama Proses -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button
              v-for="tab in durasiTabs"
              :key="tab.id"
              type="button"
              class="px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 text-xs"
              :class="[
                filterStatusDitegur === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              @click="setDurasiTab(tab.id)"
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
      <div v-if="pending && data?.items" class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-purple-500" />
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
            <th class="py-2.5 px-3 font-semibold w-44">Ketua Majelis & PP</th>
            <th class="py-2.5 px-3 font-semibold w-52">Tgl Sidang | Agenda</th>
            <th class="py-2.5 px-3 font-semibold w-56">Keterangan Penundaan</th>
            <th class="py-2.5 px-3 font-semibold text-center w-28">Lama Proses</th>
            <th class="py-2.5 px-3 font-semibold text-center w-32">Status</th>
            <th class="py-2.5 px-3 font-semibold text-center w-20">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
          <tr
            v-for="(item, idx) in data?.items"
            :key="item.perkara_id"
            class="hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-colors"
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

            <!-- Keterangan Penundaan -->
            <td class="py-2.5 px-3">
              <div class="text-xs text-gray-800 dark:text-gray-200 line-clamp-2" :title="item.keterangan">
                {{ item.keterangan || '-' }}
              </div>
            </td>

            <!-- Lama Proses -->
            <td class="py-2.5 px-3 text-center font-mono">
              <span class="font-bold text-gray-900 dark:text-white">{{ item.lama_proses || 0 }}</span>
              <span class="text-[11px] text-gray-400 ml-1">Hari</span>
            </td>

            <!-- Status Waktu -->
            <td class="py-2.5 px-3 text-center">
              <UBadge
                :color="item.status_waktu === 'DALAM 30 HARI' ? 'purple' : 'rose'"
                variant="solid"
                size="xs"
              >
                {{ item.status_waktu }}
              </UBadge>
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
                <UIcon name="i-heroicons-check-badge" class="w-10 h-10 text-emerald-500 mx-auto" />
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Perkara Ditegur / Ditentukan Kemudian
                </p>
                <p class="text-xs text-gray-400">
                  {{ searchQuery ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Seluruh proses mediasi dan penetapan jadwal sidang berjalan lancar.' }}
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
  filterStatusDitegur,
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

const durasiTabs = [
  { id: 'all', label: 'Semua Status', icon: 'i-heroicons-clipboard-document-list' },
  { id: 'dalam_30_hari', label: 'Dalam 30 Hari', icon: 'i-heroicons-clock' },
  { id: 'lebih_30_hari', label: 'Lebih dari 30 Hari', icon: 'i-heroicons-exclamation-triangle' }
]

const setDurasiTab = (id) => {
  filterStatusDitegur.value = id
  currentPage.value = 1
}

const { data, pending, refresh } = useLazyFetch('/api/persidangan/ditegur', {
  server: false,
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: searchQuery.value,
    status_waktu: filterStatusDitegur.value
  })),
  watch: [currentPage, filterStatusDitegur, searchQuery],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})
</script>
