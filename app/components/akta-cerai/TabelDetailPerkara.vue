<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Rincian Daftar Perkara: {{ formatKategori(activeKategori) }}
          </h3>
          <UBadge color="gray" variant="subtle" size="xs">
            {{ data?.pagination?.total ?? (data?.detail?.length || 0) }} perkara
          </UBadge>
        </div>

        <!-- Search Input & Limit Per Halaman -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <div class="w-full sm:w-72">
            <UInput
              v-model="searchInput"
              icon="i-heroicons-magnifying-glass"
              size="xs"
              placeholder="Cari no. perkara, majelis, PP, JS, akta..."
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

          <USelect
            v-model="perPage"
            :options="limitOptions"
            size="xs"
            class="w-24 shrink-0"
            @change="currentPage = 1"
          />
        </div>
      </div>
    </template>

    <div class="overflow-x-auto min-h-[320px] relative">
      <!-- Loading Overlay saat ganti halaman / search -->
      <div v-if="pending && data" class="absolute inset-0 bg-white/60 dark:bg-gray-800/60 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-semibold">
          <tr>
            <th class="px-3.5 py-2.5 w-12 text-center">No</th>
            <th class="px-3.5 py-2.5 min-w-[160px]">Nomor Perkara</th>
            <th class="px-3.5 py-2.5 min-w-[200px]">Majelis Hakim</th>
            <th class="px-3.5 py-2.5 min-w-[170px]">PP &amp; Jurusita</th>
            <th class="px-3.5 py-2.5 min-w-[110px]">Tanggal BHT</th>
            <th v-if="activeKategori === 'ct_belum_ikrar'" class="px-3.5 py-2.5 min-w-[180px]">Status Sidang Ikrar</th>
            <th v-else-if="activeKategori === 'belum_diambil'" class="px-3.5 py-2.5 min-w-[200px]">Status &amp; Pengambilan Akta</th>
            <th v-else class="px-3.5 py-2.5 min-w-[180px]">Status / Nomor Akta Cerai</th>
            <th class="px-3.5 py-2.5 text-center w-20">Aksi</th>
          </tr>
        </thead>

        <!-- Skeleton Rows saat loading awal -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-32" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-40" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-28" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-4 w-28 rounded-full" /></td>
            <td class="px-3.5 py-3 text-center"><USkeleton class="h-6 w-12 rounded mx-auto" /></td>
          </tr>
        </tbody>
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.detail || []"
            :key="item.perkara_id || idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <td class="px-3.5 py-2.5 text-center text-gray-400">
              {{ ((data?.pagination?.page || 1) - 1) * (data?.pagination?.limit || perPage) + idx + 1 }}
            </td>
            <td class="px-3.5 py-2.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
              {{ item.nomor_perkara }}
            </td>
            <!-- Majelis Hakim -->
            <td class="px-3.5 py-2.5">
              <div class="line-clamp-2 text-[11px] text-gray-700 dark:text-gray-300" :title="cleanHtml(item.majelis_hakim_nama)">
                {{ cleanHtml(item.majelis_hakim_nama) || '-' }}
              </div>
            </td>
            <!-- Panitera Pengganti & Jurusita -->
            <td class="px-3.5 py-2.5">
              <div class="space-y-0.5 text-[11px]">
                <div class="text-gray-800 dark:text-gray-200 font-medium truncate max-w-xs" :title="item.panitera_pengganti_nama">
                  <span class="text-gray-400 text-[10px]">PP:</span> {{ item.panitera_pengganti_nama || '-' }}
                </div>
                <div class="text-gray-500 dark:text-gray-400 truncate max-w-xs" :title="item.jurusita_nama">
                  <span class="text-gray-400 text-[10px]">JS:</span> {{ item.jurusita_nama || '-' }}
                </div>
              </div>
            </td>
            <td class="px-3.5 py-2.5 text-gray-500 whitespace-nowrap">
              {{ formatDate(item.tanggal_bht) }}
            </td>

            <!-- Status Kolom Khusus CT -->
            <td v-if="activeKategori === 'ct_belum_ikrar'" class="px-3.5 py-2.5">
              <UBadge color="amber" variant="subtle" size="xs">
                {{ item.tgl_sidang_ikrar ? 'Jadwal: ' + formatDate(item.tgl_sidang_ikrar) : 'Belum Ada Jadwal Sidang Ikrar' }}
              </UBadge>
            </td>

            <!-- Status Kolom Khusus Akta Belum Diambil -->
            <td v-else-if="activeKategori === 'belum_diambil'" class="px-3.5 py-2.5">
              <div class="space-y-0.5">
                <div class="font-medium text-gray-800 dark:text-gray-200">
                  {{ item.nomor_akta_cerai || '-' }}
                  <span class="text-xs text-gray-400 font-normal"> (Tgl: {{ formatDate(item.tgl_akta_cerai) }})</span>
                </div>
                <div class="flex items-center gap-2 text-[11px]">
                  <span :class="item.tgl_ambil_p1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 font-medium'">
                    P1: {{ item.tgl_ambil_p1 ? formatDate(item.tgl_ambil_p1) : 'Belum diambil' }}
                  </span>
                  <span class="text-gray-300 dark:text-gray-600">•</span>
                  <span :class="item.tgl_ambil_p2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 font-medium'">
                    P2: {{ item.tgl_ambil_p2 ? formatDate(item.tgl_ambil_p2) : 'Belum diambil' }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Status Kolom Khusus CG -->
            <td v-else class="px-3.5 py-2.5">
              <span v-if="item.nomor_akta_cerai" class="font-medium text-gray-800 dark:text-gray-200">
                {{ item.nomor_akta_cerai }}
                <span class="text-xs text-gray-400 font-normal"> (Tgl: {{ formatDate(item.tgl_akta_cerai) }})</span>
              </span>
              <UBadge v-else color="rose" variant="subtle" size="xs">
                Belum Terbit Akta Cerai
              </UBadge>
            </td>

            <!-- Aksi Buka SIPP -->
            <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                title="Buka perkara di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                SIPP
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!data?.detail?.length">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">
              <div class="flex flex-col items-center justify-center space-y-1">
                <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-1" />
                <p class="font-medium text-xs text-gray-600 dark:text-gray-300">
                  Tidak ada data perkara untuk kategori ini.
                </p>
                <p v-if="searchQuery" class="text-[11px] text-gray-400">
                  Coba ubah kata kunci pencarian Anda.
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
          <strong class="text-gray-800 dark:text-gray-200">
            {{ ((data?.pagination?.page || 1) - 1) * (data?.pagination?.limit || perPage) + 1 }}
          </strong>
          -
          <strong class="text-gray-800 dark:text-gray-200">
            {{ Math.min((data?.pagination?.page || 1) * (data?.pagination?.limit || perPage), data?.pagination?.total || 0) }}
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
          :page-count="data?.pagination?.limit || perPage"
          :total="data?.pagination?.total || 0"
          :max="5"
          size="xs"
          :disabled="pending"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  activeKategori,
  refreshSignal,
  currentPage,
  perPage,
  searchQuery,
  loadingPerkaraId,
  formatKategori,
  formatDate,
  cleanHtml,
  openSipp
} = useAktaCerai()

const limitOptions = [
  { label: '10 / hal', value: 10 },
  { label: '20 / hal', value: 20 },
  { label: '50 / hal', value: 50 },
  { label: '100 / hal', value: 100 }
]

// Debounce pencarian
const searchInput = ref(searchQuery.value)
let searchTimeout = null

watch(searchInput, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = newVal
    currentPage.value = 1
  }, 350)
})

watch(searchQuery, (newVal) => {
  if (searchInput.value !== newVal) {
    searchInput.value = newVal
  }
})

const { data, pending, refresh } = useLazyFetch('/api/akta-cerai/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    kategori: activeKategori.value,
    page: currentPage.value,
    limit: perPage.value,
    search: searchQuery.value
  })),
  watch: [selectedYear, activeKategori, currentPage, perPage, searchQuery],
  default: () => null
})

const isLoading = computed(() => pending.value && !data.value)

watch([selectedYear, activeKategori], () => {
  currentPage.value = 1
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
