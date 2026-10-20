<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-6xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <UIcon name="i-heroicons-academic-cap" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Rincian Perkara: {{ modalDetailState.pendidikanNama || 'Tingkat Pendidikan' }}
                </h3>
                <UBadge v-if="modalDetailState.pendidikanKode" color="emerald" variant="subtle" size="xs">
                  {{ modalDetailState.pendidikanKode }}
                </UBadge>
                <UBadge color="gray" variant="subtle" size="xs">
                  Tahun {{ selectedYear }}
                </UBadge>
                <UBadge
                  v-if="modalKategori && modalKategori !== 'all'"
                  :color="modalKategori === 'pria' ? 'blue' : modalKategori === 'wanita' ? 'pink' : 'teal'"
                  variant="subtle"
                  size="xs"
                >
                  {{ modalKategori === 'pria' ? 'Calon Suami (L)' : modalKategori === 'wanita' ? 'Calon Istri (P)' : 'Anak Dimohonkan' }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                Total <strong>{{ formatNumber(data?.total || modalDetailState.totalCount || 0) }}</strong> calon mempelai terdaftar dengan pendidikan tersebut
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
          <!-- Filter Subjek Mempelai Modal -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition"
              :class="modalKategori === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalKategori('all')"
            >
              Semua Mempelai
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalKategori === 'pria' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalKategori('pria')"
            >
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Calon Suami (L)</span>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalKategori === 'wanita' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setModalKategori('wanita')"
            >
              <span class="w-2 h-2 rounded-full bg-pink-500"></span>
              <span>Calon Istri (P)</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="flex items-center gap-2">
            <div class="relative w-full sm:w-64">
              <UInput
                v-model="searchInput"
                icon="i-heroicons-magnifying-glass"
                placeholder="Cari no perkara / nama anak / pemohon..."
                size="xs"
                @keydown.enter="applySearch"
              />
              <button
                v-if="searchInput"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                @click="clearSearch"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
              </button>
            </div>
            <UButton
              size="xs"
              color="emerald"
              variant="solid"
              @click="applySearch"
            >
              Cari
            </UButton>
          </div>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-3 px-3 w-10 text-center">No</th>
                <th class="py-3 px-3 w-44">Nomor Perkara</th>
                <th class="py-3 px-3 w-40">Pemohon (Ortu/Wali)</th>
                <th class="py-3 px-3">Nama Anak / Calon Mempelai</th>
                <th class="py-3 px-3 w-28 text-center">Subjek</th>
                <th class="py-3 px-3 w-24 text-center">Usia</th>
                <th class="py-3 px-3 w-36">Pendidikan</th>
                <th class="py-3 px-3 w-32">Status Putusan</th>
                <th class="py-3 px-3 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-sans">
              <!-- Loading Skeleton -->
              <tr v-if="isLoading" v-for="i in 5" :key="i">
                <td class="py-3 px-3"><USkeleton class="h-4 w-6 mx-auto" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-36" /><USkeleton class="h-3 w-20 mt-1" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-32" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-36" /></td>
                <td class="py-3 px-3"><USkeleton class="h-5 w-20 mx-auto" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-12 mx-auto" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-28" /></td>
                <td class="py-3 px-3"><USkeleton class="h-4 w-24" /></td>
                <td class="py-3 px-3"><USkeleton class="h-6 w-14 mx-auto" /></td>
              </tr>

              <!-- Items List -->
              <tr
                v-else-if="data?.items?.length"
                v-for="(item, idx) in data.items"
                :key="`${item.perkaraId}-${item.mempelaiId}`"
                class="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <!-- No -->
                <td class="py-2.5 px-3 text-center text-gray-400 font-mono">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara & Tanggal -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="font-semibold text-emerald-700 dark:text-emerald-400">
                    {{ item.nomorPerkara }}
                  </div>
                  <div class="text-[11px] text-gray-500 mt-0.5">
                    Daftar: {{ formatDate(item.tanggalPendaftaran) }}
                  </div>
                </td>

                <!-- Pemohon -->
                <td class="py-2.5 px-3">
                  <div class="font-medium text-gray-900 dark:text-white line-clamp-1" :title="item.pemohonNama">
                    {{ item.pemohonNama }}
                  </div>
                  <div class="text-[10px] text-gray-400 line-clamp-1 mt-0.5" :title="item.pemohonAlamat">
                    {{ item.pemohonAlamat }}
                  </div>
                </td>

                <!-- Nama Anak / Calon Mempelai -->
                <td class="py-2.5 px-3">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ item.namaAnak }}
                  </div>
                  <div class="text-[11px] text-gray-500 mt-0.5">
                    Pekerjaan: {{ item.pekerjaanNama }}
                  </div>
                </td>

                <!-- Subjek / Jenis Kelamin -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UBadge
                    :color="item.isLaki ? 'blue' : 'pink'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ item.jenisMempelaiLabel }}
                  </UBadge>
                </td>

                <!-- Usia -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono">
                  <span v-if="item.usiaSaatDaftar !== null" class="font-semibold" :class="item.usiaSaatDaftar < 19 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'">
                    {{ item.usiaSaatDaftar }} thn
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Pendidikan -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="font-medium text-gray-800 dark:text-gray-200">
                    {{ item.pendidikanNama }}
                  </div>
                  <UBadge v-if="item.pendidikanKode" color="gray" variant="subtle" size="xs" class="mt-0.5">
                    {{ item.pendidikanKode }}
                  </UBadge>
                </td>

                <!-- Status Putusan -->
                <td class="py-2.5 px-3">
                  <div v-if="item.tanggalPutusan" class="text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Putus: {{ formatDate(item.tanggalPutusan) }}</span>
                    <div v-if="item.statusPutusanNama" class="text-[10px] text-gray-500">
                      {{ item.statusPutusanNama }}
                    </div>
                  </div>
                  <span v-else class="text-amber-600 dark:text-amber-400 font-medium">
                    Dalam Proses
                  </span>
                </td>

                <!-- Aksi -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UButton
                    size="2xs"
                    color="emerald"
                    variant="soft"
                    icon="i-heroicons-arrow-top-right-on-square"
                    :loading="loadingPerkaraId === item.perkaraId"
                    @click="openSipp(item.perkaraId)"
                  >
                    SIPP
                  </UButton>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="!data?.items || data.items.length === 0">
                <td colspan="9" class="py-8 text-center text-gray-500">
                  Tidak ada perkara yang sesuai dengan filter atau kata kunci pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination & Summary Footer -->
        <div v-if="data?.total > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div class="text-xs text-gray-500">
            Menampilkan {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, data.total) }} dari {{ formatNumber(data.total) }} calon mempelai
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
} = usePendidikanDispensasi()

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
const modalKategori = ref('all')

// Sinkronisasi kategori saat modal terbuka
watch(() => modalDetailState.value.isOpen, (newVal) => {
  if (newVal) {
    modalKategori.value = modalDetailState.value.kategori || 'all'
    page.value = 1
    searchInput.value = ''
    searchActive.value = ''
  }
})

const setModalKategori = (val) => {
  modalKategori.value = val
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
const { data, pending, refresh } = useLazyFetch('/api/pendidikan-dispensasi/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    kategori: modalKategori.value,
    pendidikan_id: modalDetailState.value.pendidikanId !== null ? modalDetailState.value.pendidikanId : 'all',
    search: searchActive.value,
    page: page.value,
    limit: limit.value
  })),
  watch: [selectedYear, selectedMonth, modalKategori, page, searchActive, () => modalDetailState.value.pendidikanId],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
</script>
