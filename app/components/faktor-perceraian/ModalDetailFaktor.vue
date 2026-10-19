<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-6xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Rincian Perkara: {{ modalDetailState.faktorNama || 'Faktor Perceraian' }}
                </h3>
                <UBadge v-if="modalDetailState.faktorId" color="gray" variant="subtle" size="xs">
                  ID {{ modalDetailState.faktorId }}
                </UBadge>
                <UBadge color="rose" variant="subtle" size="xs">
                  Tahun {{ selectedYear }}
                </UBadge>
                <UBadge
                  v-if="modalDetailState.jenisCerai && modalDetailState.jenisCerai !== 'all'"
                  :color="modalDetailState.jenisCerai === 'Cerai Gugat' ? 'pink' : 'indigo'"
                  variant="subtle"
                  size="xs"
                >
                  {{ modalDetailState.jenisCerai }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                Total <strong>{{ formatNumber(data?.total || modalDetailState.totalCount || 0) }}</strong> perkara terdaftar dengan akta cerai terbit
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="closeModal"
            />
          </div>
        </div>
      </template>

      <!-- Modal Body -->
      <div class="space-y-4">
        <!-- Search & Quick Filter Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Filter Jenis Cerai Modal -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition"
              :class="modalJenisCerai === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalJenisCerai('all')"
            >
              Semua Jenis
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalJenisCerai === 'Cerai Gugat' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalJenisCerai('Cerai Gugat')"
            >
              <span class="w-2 h-2 rounded-full bg-pink-500"></span>
              <span>Cerai Gugat</span>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalJenisCerai === 'Cerai Talak' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalJenisCerai('Cerai Talak')"
            >
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Cerai Talak</span>
            </button>
          </div>

          <!-- Search Input -->
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara / akta cerai / pihak..."
            size="xs"
            class="w-full sm:w-72"
            @keydown.enter="applySearch"
          >
            <template #trailing>
              <UButton
                v-if="searchInput"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="p-4 space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3">
            <USkeleton class="h-4 w-8" />
            <USkeleton class="h-4 w-36" />
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-4 w-20" />
            <USkeleton class="h-6 w-16" />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!data?.items || data.items.length === 0"
          class="py-12 text-center text-sm text-gray-500"
        >
          <UIcon name="i-heroicons-inbox" class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p>Tidak ditemukan data perkara yang cocok.</p>
        </div>

        <!-- Table Data Rincian Perkara -->
        <div v-else class="overflow-x-auto max-h-[60vh]">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/80 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-2.5 px-3 w-10 text-center">No</th>
                <th class="py-2.5 px-3">Nomor Perkara</th>
                <th class="py-2.5 px-3">Akta Cerai</th>
                <th class="py-2.5 px-3">Faktor Perceraian</th>
                <th class="py-2.5 px-3">Para Pihak</th>
                <th class="py-2.5 px-3 text-center">Tgl Putus</th>
                <th class="py-2.5 px-3 text-center">Aksi SIPP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60">
              <tr
                v-for="(item, idx) in data.items"
                :key="item.perkaraId"
                class="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
              >
                <!-- No -->
                <td class="py-2.5 px-3 text-center font-mono text-gray-400">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara & Jenis Cerai -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ item.nomorPerkara }}
                  </div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <UBadge
                      :color="item.jenisCerai?.includes('Gugat') ? 'pink' : 'indigo'"
                      variant="subtle"
                      size="2xs"
                    >
                      {{ item.jenisCerai }}
                    </UBadge>
                    <span class="text-[10px] text-gray-400">
                      Daftar: {{ formatDate(item.tanggalPendaftaran) }}
                    </span>
                  </div>
                </td>

                <!-- Nomor & Tanggal Akta Cerai -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {{ item.nomorAktaCerai || '-' }}
                  </div>
                  <div class="text-[10px] text-gray-400 mt-0.5">
                    Terbit: {{ formatDate(item.tglAktaCerai) }}
                  </div>
                  <div class="text-[10px] text-gray-400">
                    Status: <span class="text-gray-600 dark:text-gray-300">{{ item.statusAmbil }}</span>
                  </div>
                </td>

                <!-- Faktor Perceraian -->
                <td class="py-2.5 px-3">
                  <div class="font-medium text-gray-800 dark:text-gray-200 max-w-[200px]">
                    {{ item.faktorNama }}
                  </div>
                </td>

                <!-- Para Pihak (HTML rendering stripped or formatted) -->
                <td class="py-2.5 px-3 max-w-xs">
                  <div
                    class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2"
                    v-html="item.paraPihak"
                  />
                </td>

                <!-- Tgl Putusan -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <div class="font-mono text-gray-700 dark:text-gray-300">
                    {{ formatDate(item.tanggalPutusan) }}
                  </div>
                  <span class="text-[10px] text-gray-400">{{ item.statusPutusan }}</span>
                </td>

                <!-- Tombol SIPP -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UButton
                    size="2xs"
                    color="rose"
                    variant="soft"
                    icon="i-heroicons-arrow-top-right-on-square"
                    :loading="loadingPerkaraId === item.perkaraId"
                    @click="openSipp(item.perkaraId)"
                  >
                    Buka SIPP
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Menampilkan
            <strong>{{ data?.total ? (page - 1) * limit + 1 : 0 }}</strong>
            -
            <strong>{{ Math.min(page * limit, data?.total || 0) }}</strong>
            dari
            <strong>{{ formatNumber(data?.total || 0) }}</strong> perkara
          </div>

          <!-- Pagination -->
          <div class="flex items-center gap-1.5">
            <UButton
              color="gray"
              variant="outline"
              size="2xs"
              icon="i-heroicons-chevron-left"
              :disabled="page <= 1"
              @click="page--"
            />
            <span class="px-2 font-semibold text-[11px]">
              {{ page }} / {{ data?.totalPages || 1 }}
            </span>
            <UButton
              color="gray"
              variant="outline"
              size="2xs"
              icon="i-heroicons-chevron-right"
              :disabled="page >= (data?.totalPages || 1)"
              @click="page++"
            />
            <UButton
              color="gray"
              variant="solid"
              size="xs"
              class="ml-3"
              @click="closeModal"
            >
              Tutup
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  modalDetailState,
  closeDetailModal,
  loadingPerkaraId,
  formatNumber,
  formatDate,
  openSipp
} = useFaktorPerceraian()

const isOpen = computed({
  get: () => modalDetailState.value.isOpen,
  set: (val) => {
    if (!val) closeDetailModal()
  }
})

const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const activeSearch = ref('')
const modalJenisCerai = ref('all')

// Reset search & pagination saat modal dibuka
watch(() => modalDetailState.value.isOpen, (newVal) => {
  if (newVal) {
    page.value = 1
    searchInput.value = ''
    activeSearch.value = ''
    modalJenisCerai.value = modalDetailState.value.jenisCerai || 'all'
  }
})

function setModalJenisCerai(jenis) {
  modalJenisCerai.value = jenis
  page.value = 1
}

function applySearch() {
  activeSearch.value = searchInput.value.trim()
  page.value = 1
}

function clearSearch() {
  searchInput.value = ''
  activeSearch.value = ''
  page.value = 1
}

function closeModal() {
  closeDetailModal()
}

// Fetch on-demand: HANYA request jika modal sedang terbuka
const shouldFetch = computed(() => isOpen.value)

const { data, pending } = useLazyFetch('/api/faktor-perceraian/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    faktor_id: modalDetailState.value.faktorId,
    jenis_cerai: modalJenisCerai.value,
    search: activeSearch.value,
    page: page.value,
    limit: limit.value
  })),
  watch: [
    shouldFetch,
    () => modalDetailState.value.faktorId,
    modalJenisCerai,
    page,
    activeSearch
  ],
  default: () => null
})

const isLoading = computed(() => shouldFetch.value && (pending.value || !data.value))
</script>
