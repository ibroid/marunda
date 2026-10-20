<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-6xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-teal-50 dark:bg-teal-950/40 rounded-lg text-teal-600 dark:text-teal-400">
              <UIcon name="i-heroicons-briefcase" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Rincian Perkara: {{ modalDetailState.pekerjaanNama || 'Profesi / Pekerjaan' }}
                </h3>
                <UBadge color="gray" variant="subtle" size="xs">
                  Tahun {{ selectedYear }}
                </UBadge>
                <UBadge
                  v-if="modalJenisCerai && modalJenisCerai !== 'all'"
                  :color="modalJenisCerai === 'Cerai Gugat' ? 'pink' : 'blue'"
                  variant="subtle"
                  size="xs"
                >
                  {{ modalJenisCerai }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                Total <strong>{{ formatNumber(data?.total || modalDetailState.totalCount || 0) }}</strong> perkara terdaftar dengan pekerjaan pengaju tersebut
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
        <!-- Search & Filter Controls -->
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
              :class="modalJenisCerai === 'Cerai Talak' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalJenisCerai('Cerai Talak')"
            >
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Cerai Talak</span>
            </button>
          </div>

          <!-- Search Input -->
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara / nama pengaju..."
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

        <!-- Table Loading State -->
        <div v-if="isLoading" class="p-6 space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4">
            <USkeleton class="h-5 w-12" />
            <USkeleton class="h-5 w-44" />
            <USkeleton class="h-5 w-28" />
            <USkeleton class="h-5 flex-1" />
            <USkeleton class="h-5 w-24" />
            <USkeleton class="h-5 w-20" />
          </div>
        </div>

        <!-- Table Content -->
        <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-2.5 px-3 w-12 text-center">No</th>
                <th class="py-2.5 px-3 w-44">Nomor Perkara</th>
                <th class="py-2.5 px-3 w-28">Tgl Daftar</th>
                <th class="py-2.5 px-3 w-32">Jenis Perkara</th>
                <th class="py-2.5 px-3">Nama Pengaju (Pihak 1)</th>
                <th class="py-2.5 px-3 w-40">Pekerjaan Pengaju</th>
                <th class="py-2.5 px-3 w-36">Status / Tahapan</th>
                <th class="py-2.5 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(item, idx) in data?.items || []"
                :key="item.perkara_id"
                class="hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors"
              >
                <!-- No -->
                <td class="py-2.5 px-3 text-center text-gray-400 font-mono">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara -->
                <td class="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                  <button
                    type="button"
                    class="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono text-left"
                    :disabled="loadingPerkaraId === item.perkara_id"
                    @click="openSipp(item.perkara_id)"
                  >
                    <span>{{ item.nomor_perkara }}</span>
                    <UIcon
                      v-if="loadingPerkaraId === item.perkara_id"
                      name="i-heroicons-arrow-path"
                      class="w-3.5 h-3.5 animate-spin text-teal-500 shrink-0"
                    />
                  </button>
                </td>

                <!-- Tanggal Pendaftaran -->
                <td class="py-2.5 px-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {{ formatDate(item.tanggal_pendaftaran) }}
                </td>

                <!-- Jenis Perkara -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <UBadge
                    :color="item.jenis_perkara_nama === 'Cerai Gugat' ? 'pink' : 'blue'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ item.jenis_perkara_nama }}
                  </UBadge>
                </td>

                <!-- Nama Pengaju -->
                <td class="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                  <div class="truncate max-w-xs" :title="item.nama_pengaju">
                    {{ item.nama_pengaju || '-' }}
                  </div>
                </td>

                <!-- Pekerjaan Pengaju -->
                <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <UIcon name="i-heroicons-briefcase" class="w-3 h-3 text-gray-400 shrink-0" />
                    <span class="truncate max-w-[140px]" :title="item.pekerjaan_pengaju">{{ item.pekerjaan_pengaju }}</span>
                  </span>
                </td>

                <!-- Status / Tahapan -->
                <td class="py-2.5 px-3 text-[11px]">
                  <div class="truncate max-w-[150px]">
                    <span v-if="item.tanggal_putusan" class="text-emerald-600 dark:text-emerald-400 font-medium">
                      Putus ({{ item.status_putusan_nama || 'Berkekuatan Hukum' }})
                    </span>
                    <span v-else-if="item.proses_terakhir_text" class="text-amber-600 dark:text-amber-400">
                      {{ item.proses_terakhir_text }}
                    </span>
                    <span v-else class="text-gray-400">
                      {{ item.tahapan_terakhir_text || '-' }}
                    </span>
                  </div>
                </td>

                <!-- Aksi -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UButton
                    size="2xs"
                    color="teal"
                    variant="soft"
                    icon="i-heroicons-arrow-top-right-on-square"
                    :loading="loadingPerkaraId === item.perkara_id"
                    @click="openSipp(item.perkara_id)"
                  >
                    SIPP
                  </UButton>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="!data?.items || data.items.length === 0">
                <td colspan="8" class="py-8 text-center text-gray-500">
                  Tidak ada perkara yang sesuai dengan filter atau kata kunci pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination & Summary Footer -->
        <div v-if="data?.total > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div class="text-xs text-gray-500">
            Menampilkan {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, data.total) }} dari {{ formatNumber(data.total) }} perkara
          </div>
          <UPagination
            v-if="data?.totalPages > 1"
            v-model="page"
            :page-count="limit"
            :total="data?.total || 0"
            size="xs"
          />
        </div>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex items-center justify-end">
          <UButton
            color="gray"
            variant="solid"
            size="sm"
            @click="closeModal"
          >
            Tutup
          </UButton>
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
  formatNumber,
  formatDate,
  openSipp,
  loadingPerkaraId
} = usePekerjaanPerceraian()

const isOpen = computed({
  get: () => modalDetailState.value.isOpen,
  set: (val) => {
    if (!val) closeDetailModal()
  }
})

const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const searchActive = ref('')
const modalJenisCerai = ref('all')

// Sinkronisasi jenisCerai saat modal terbuka
watch(() => modalDetailState.value.isOpen, (newVal) => {
  if (newVal) {
    modalJenisCerai.value = modalDetailState.value.jenisCerai || 'all'
    page.value = 1
    searchInput.value = ''
    searchActive.value = ''
  }
})

const setModalJenisCerai = (val) => {
  modalJenisCerai.value = val
  page.value = 1
}

const applySearch = () => {
  searchActive.value = searchInput.value.trim()
  page.value = 1
}

const clearSearch = () => {
  searchInput.value = ''
  searchActive.value = ''
  page.value = 1
}

const closeModal = () => {
  closeDetailModal()
}

// Fetch data detail perkara
const { data, pending } = useLazyFetch('/api/pekerjaan-perceraian/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis_cerai: modalJenisCerai.value,
    pekerjaan: modalDetailState.value.pekerjaan !== null ? modalDetailState.value.pekerjaan : 'all',
    search: searchActive.value,
    page: page.value,
    limit: limit.value
  })),
  watch: [selectedYear, selectedMonth, modalJenisCerai, page, searchActive, () => modalDetailState.value.pekerjaan],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
</script>
