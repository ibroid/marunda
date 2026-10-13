<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Tabs Navigasi Filter -->
        <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <UButton
            v-for="t in tabs"
            :key="t.key"
            size="xs"
            :variant="activeTab === t.key ? 'solid' : 'ghost'"
            :color="activeTab === t.key ? 'primary' : 'gray'"
            class="rounded-lg transition-colors"
            @click="handleTabChange(t.key)"
          >
            {{ t.label }}
          </UButton>
        </div>

        <!-- Search Input -->
        <div class="w-full md:w-64">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara / pihak..."
            size="xs"
            clearable
          />
        </div>
      </div>
    </template>

    <!-- Table Container -->
    <div class="overflow-x-auto -mx-4 -my-4">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
          <tr>
            <th class="py-3 px-3.5 w-12 text-center font-semibold">No</th>
            <th class="py-3 px-3 font-semibold min-w-[180px]">Nomor Perkara & Jenis</th>
            <th class="py-3 px-3 font-semibold min-w-[200px]">Para Pihak</th>
            <th class="py-3 px-3 font-semibold min-w-[120px]">Tgl Daftar / Usia</th>
            <th class="py-3 px-3 font-semibold min-w-[170px]">Panitera Pengganti</th>
            <th class="py-3 px-3 font-semibold min-w-[130px]">Status Putusan</th>
            <th class="py-3 px-3.5 text-center font-semibold w-24">Aksi SIPP</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-3 px-3 text-center">
              <USkeleton class="h-4 w-5 mx-auto" />
            </td>
            <td class="py-3 px-3 space-y-1">
              <USkeleton class="h-4 w-32" />
              <USkeleton class="h-3 w-20" />
            </td>
            <td class="py-3 px-3 space-y-1">
              <USkeleton class="h-3 w-40" />
              <USkeleton class="h-3 w-32" />
            </td>
            <td class="py-3 px-3 space-y-1">
              <USkeleton class="h-3 w-20" />
              <USkeleton class="h-3 w-16" />
            </td>
            <td class="py-3 px-3">
              <USkeleton class="h-4 w-28" />
            </td>
            <td class="py-3 px-3 space-y-1">
              <USkeleton class="h-4 w-20" />
              <USkeleton class="h-3 w-14" />
            </td>
            <td class="py-3 px-3 text-center">
              <USkeleton class="h-7 w-16 mx-auto rounded-lg" />
            </td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in listItems"
            :key="item.perkara_id"
            class="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
          >
            <!-- No -->
            <td class="py-3 px-3.5 text-center text-gray-400 font-medium">
              {{ (page - 1) * limit + idx + 1 }}
            </td>

            <!-- Nomor Perkara & Jenis -->
            <td class="py-3 px-3">
              <div class="font-bold text-gray-900 dark:text-white">
                {{ item.nomor_perkara }}
              </div>
              <div class="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                <UBadge color="gray" variant="subtle" size="xs">
                  {{ item.jenis_perkara_nama }}
                </UBadge>
              </div>
            </td>

            <!-- Para Pihak -->
            <td class="py-3 px-3">
              <div class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs" :title="cleanHtml(item.para_pihak)">
                {{ cleanHtml(item.para_pihak) }}
              </div>
              <div class="text-[10px] text-gray-400 mt-1 truncate">
                Proses: {{ item.proses_terakhir_text || '-' }}
              </div>
            </td>

            <!-- Tgl Daftar & Usia -->
            <td class="py-3 px-3">
              <div class="text-gray-700 dark:text-gray-300 font-medium">
                {{ formatDate(item.tanggal_pendaftaran) }}
              </div>
              <div class="mt-0.5 flex items-center gap-1">
                <UBadge
                  :color="item.is_tunggakan ? 'red' : item.usia_hari > 60 ? 'amber' : 'gray'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.usia_hari }} hari
                </UBadge>
              </div>
            </td>

            <!-- Panitera Pengganti -->
            <td class="py-3 px-3">
              <div class="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[160px]">
                {{ item.panitera_pengganti_text || '-' }}
              </div>
            </td>

            <!-- Status Putusan & Minutasi -->
            <td class="py-3 px-3 space-y-1">
              <div v-if="item.is_putus" class="flex flex-col gap-0.5">
                <UBadge color="emerald" variant="subtle" size="xs" class="w-fit">
                  Putus: {{ formatDate(item.tanggal_putusan) }}
                </UBadge>
                <div class="flex items-center gap-1 mt-0.5">
                  <UBadge
                    :color="item.is_minutasi ? 'teal' : 'amber'"
                    variant="soft"
                    size="xs"
                  >
                    {{ item.is_minutasi ? 'Minutasi' : 'Blm Minutasi' }}
                  </UBadge>
                  <UBadge
                    :color="item.is_edoc ? 'blue' : 'gray'"
                    variant="soft"
                    size="xs"
                  >
                    {{ item.is_edoc ? 'e-Doc' : 'No e-Doc' }}
                  </UBadge>
                </div>
              </div>
              <div v-else>
                <UBadge color="blue" variant="subtle" size="xs">
                  Proses Sidang
                </UBadge>
              </div>
            </td>

            <!-- Aksi Buka SIPP -->
            <td class="py-3 px-3.5 text-center">
              <UButton
                color="primary"
                variant="soft"
                size="xs"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                title="Buka langsung di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                SIPP
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!listItems.length">
            <td colspan="7" class="py-12 text-center text-gray-400">
              <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p class="font-medium text-sm">Tidak ada data perkara untuk filter ini</p>
              <p class="text-xs text-gray-400 mt-1">Coba ubah kata kunci pencarian atau tab filter</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer Pagination -->
    <template #footer>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Menampilkan <span class="font-bold text-gray-700 dark:text-gray-300">{{ showingFrom }}</span>
          hingga <span class="font-bold text-gray-700 dark:text-gray-300">{{ showingTo }}</span>
          dari <span class="font-bold text-gray-700 dark:text-gray-300">{{ totalRecords }}</span> perkara
        </div>

        <div v-if="totalPages > 1">
          <UPagination
            v-model="page"
            :page-count="limit"
            :total="totalRecords"
            size="xs"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const toast = useToast()
const {
  hakimId,
  selectedYear,
  roleFilter,
  activeTab,
  searchQuery,
  page,
  limit,
  setTab,
  refreshSignal,
  loadingPerkaraId,
  formatDate,
  cleanHtml,
  openSipp: baseOpenSipp
} = useKinerjaHakimDetail()

const openSipp = (perkaraId) => baseOpenSipp(perkaraId, toast)

const tabs = [
  { key: 'semua', label: 'Semua Perkara' },
  { key: 'aktif', label: 'Sisa / Berjalan' },
  { key: 'putus', label: 'Sudah Putus' },
  { key: 'belum_minutasi', label: 'Belum Minutasi' },
  { key: 'tunggakan', label: 'Tunggakan (>90 Hari)' },
  { key: 'belum_edoc', label: 'Belum e-Doc' }
]

const debouncedSearch = ref(searchQuery.value)
let searchTimeout = null

watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 350)
})

const handleTabChange = (tabKey) => {
  setTab(tabKey)
}

const { data, pending, refresh } = useLazyFetch(
  () => `/api/kinerja/hakim/${hakimId.value}/list`,
  {
    server: false,
    query: computed(() => ({
      year: selectedYear.value,
      role: roleFilter.value,
      tab: activeTab.value,
      page: page.value,
      limit,
      q: debouncedSearch.value
    })),
    watch: [hakimId, selectedYear, roleFilter, activeTab, page, debouncedSearch],
    default: () => null
  }
)

const isLoading = computed(() => pending.value || !data.value)
const listItems = computed(() => data.value?.items || [])
const totalRecords = computed(() => data.value?.total || 0)
const totalPages = computed(() => data.value?.totalPages || 0)

const showingFrom = computed(() => {
  if (totalRecords.value === 0) return 0
  return (page.value - 1) * limit + 1
})

const showingTo = computed(() => {
  return Math.min(page.value * limit, totalRecords.value)
})

watch(refreshSignal, () => {
  refresh()
})
</script>
