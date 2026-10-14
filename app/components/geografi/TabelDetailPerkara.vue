<template>
  <div id="tabel-detail-perkara" class="scroll-mt-6">
    <UCard>
      <template #header>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <UIcon name="i-heroicons-document-magnifying-glass" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Daftar Rincian Penerimaan Perkara
                </h3>
                <!-- Badge Kecamatan Terpilih -->
                <UBadge
                  v-if="selectedKecamatan"
                  color="emerald"
                  variant="subtle"
                  size="xs"
                >
                  Kecamatan: {{ selectedKecamatanNama || selectedKecamatan }}
                </UBadge>
                <!-- Badge Kelurahan Terpilih -->
                <UBadge
                  v-if="selectedKecamatan && selectedKelurahan"
                  color="teal"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1 font-semibold"
                >
                  <span>Kel. {{ selectedKelurahan }}</span>
                  <button
                    type="button"
                    class="ml-0.5 hover:text-teal-950 font-bold"
                    title="Hapus Filter Kelurahan"
                    @click="clearKelurahan"
                  >
                    ✕
                  </button>
                </UBadge>
                <!-- Badge Gugatan / Permohonan -->
                <UBadge
                  v-if="selectedKecamatan && selectedAlurPerkara === '15'"
                  color="blue"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1"
                >
                  <span>Gugatan (Pdt.G)</span>
                  <button
                    type="button"
                    class="ml-0.5 hover:text-blue-950 font-bold"
                    title="Ubah ke Semua Alur"
                    @click="selectedAlurPerkara = 'all'"
                  >
                    ✕
                  </button>
                </UBadge>
                <UBadge
                  v-else-if="selectedKecamatan && selectedAlurPerkara === '16'"
                  color="purple"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1 font-semibold"
                >
                  <span>Permohonan (Pdt.P)</span>
                  <button
                    type="button"
                    class="ml-0.5 hover:text-purple-950 font-bold"
                    title="Ubah ke Semua Alur"
                    @click="selectedAlurPerkara = 'all'"
                  >
                    ✕
                  </button>
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span v-if="selectedKecamatan">
                  Menampilkan rincian perkara di Kecamatan {{ selectedKecamatanNama || selectedKecamatan }}
                  <template v-if="selectedKelurahan"> • Kelurahan {{ selectedKelurahan }}</template>
                  <template v-if="selectedAlurPerkara === '15'"> • Khusus Gugatan (Pdt.G)</template>
                  <template v-else-if="selectedAlurPerkara === '16'"> • Khusus Permohonan (Pdt.P)</template>
                  (Pihak Utama Urutan 1)
                </span>
                <span v-else>
                  Silakan klik salah satu batang grafik atau tombol kecamatan untuk menampilkan daftar perkara
                </span>
              </p>
            </div>
          </div>

          <!-- Filter Bar (Hanya tampil jika kecamatan sedang aktif dilihat) -->
          <div v-if="selectedKecamatan" class="flex flex-wrap items-center gap-2.5">
            <!-- Filter Kelurahan: menampilkan kelurahan di bawah kecamatan yang sedang dilihat -->
            <div class="flex items-center gap-1.5">
              <USelect
                v-model="selectedKelurahan"
                :options="kelurahanOptions"
                placeholder="Semua Kelurahan"
                size="sm"
                class="w-48"
                icon="i-heroicons-map-pin"
                @change="onKelurahanChange"
              />
            </div>

            <!-- Filter Alur Perkara (Gugatan / Permohonan) -->
            <USelect
              v-model="selectedAlurPerkara"
              :options="alurOptions"
              size="sm"
              class="w-40"
            />

            <!-- Search Input -->
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Cari nomor, pihak, alamat..."
              size="sm"
              class="w-48"
              :trailing="false"
              @keydown.enter="handleSearch"
            />

            <!-- Tombol Tutup / Reset Pilihan Kecamatan -->
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              icon="i-heroicons-x-mark"
              title="Tutup Rincian Kecamatan"
              @click="clearKecamatan"
            >
              Tutup
            </UButton>
          </div>
        </div>
      </template>

      <!-- KONDISI 1: Belum Memilih Kecamatan -->
      <div
        v-if="!selectedKecamatan"
        class="py-14 px-4 text-center max-w-xl mx-auto space-y-4"
      >
        <div class="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <UIcon name="i-heroicons-map-pin" class="w-7 h-7 animate-bounce" />
        </div>
        <div class="space-y-1.5">
          <h4 class="text-base font-semibold text-gray-900 dark:text-white">
            Pilih Kecamatan Terlebih Dahulu
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Data perkara tidak dimuat sekaligus untuk menjaga performa sistem. Silakan klik batang
            <span class="font-semibold text-blue-600 dark:text-blue-400">Gugatan</span> /
            <span class="font-semibold text-purple-600 dark:text-purple-400">Permohonan</span> pada grafik di atas, atau pilih salah satu wilayah di bawah:
          </p>
        </div>

        <!-- Tombol Cepat Pilihan 8 Kecamatan di Wilayah Hukum (Jakarta Utara & Kepulauan Seribu) -->
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <UButton
            v-for="kec in quickKecamatanList"
            :key="kec"
            color="gray"
            variant="soft"
            size="xs"
            icon="i-heroicons-map-pin"
            class="hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            @click="selectQuickKecamatan(kec)"
          >
            {{ kec }}
          </UButton>
        </div>
      </div>

      <!-- KONDISI 2: Sudah Memilih Kecamatan tapi Sedang Loading -->
      <div v-else-if="isLoading" class="p-4 space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4">
          <USkeleton class="h-5 w-8" />
          <USkeleton class="h-5 w-32" />
          <USkeleton class="h-5 w-24" />
          <USkeleton class="h-5 w-40" />
          <USkeleton class="h-5 flex-1" />
        </div>
      </div>

      <!-- KONDISI 3: Sudah Memilih Kecamatan dan Hasil Kosong -->
      <div
        v-else-if="!data?.items || data.items.length === 0"
        class="text-center py-12 px-4 space-y-3"
      >
        <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
          Tidak ditemukan data perkara untuk Kecamatan {{ selectedKecamatanNama || selectedKecamatan }}
          <span v-if="selectedKelurahan" class="font-semibold text-teal-600 dark:text-teal-400"> (Kelurahan {{ selectedKelurahan }})</span>
          <span v-if="selectedAlurPerkara === '15'"> (Jenis Gugatan)</span>
          <span v-else-if="selectedAlurPerkara === '16'"> (Jenis Permohonan)</span>
          <span v-if="searchQuery"> dengan kata kunci "{{ searchQuery }}"</span>
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton
            v-if="selectedKelurahan"
            color="teal"
            variant="soft"
            size="xs"
            @click="clearKelurahan"
          >
            Tampilkan Semua Kelurahan
          </UButton>
          <UButton
            v-if="selectedAlurPerkara !== 'all'"
            color="gray"
            variant="soft"
            size="xs"
            @click="selectedAlurPerkara = 'all'"
          >
            Tampilkan Semua Jenis Perkara
          </UButton>
          <UButton
            v-if="searchQuery"
            color="emerald"
            variant="soft"
            size="xs"
            @click="resetSearch"
          >
            Bersihkan Pencarian
          </UButton>
        </div>
      </div>

      <!-- KONDISI 4: Menampilkan Tabel Data Perkara Terfilter -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-3 w-10 text-center">No</th>
              <th class="py-3 px-3 w-44">Nomor Perkara</th>
              <th class="py-3 px-3 w-28">Tgl Daftar</th>
              <th class="py-3 px-3 w-40">Jenis Perkara</th>
              <th class="py-3 px-3">Nama Pihak (Pemohon/Penggugat I)</th>
              <th class="py-3 px-3 w-44">Wilayah (Kelurahan)</th>
              <th class="py-3 px-3">Alamat</th>
              <th class="py-3 px-3 w-36">Status Terakhir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
            <tr
              v-for="(row, idx) in data.items"
              :key="row.perkara_id"
              class="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-3 px-3 text-center text-xs text-gray-500 dark:text-gray-400">
                {{ (currentPage - 1) * pageLimit + idx + 1 }}
              </td>
              <td class="py-3 px-3 font-semibold">
                <button
                  type="button"
                  class="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-left"
                  :disabled="loadingPerkaraId === row.perkara_id"
                  title="Buka Berkas di SIPP"
                  @click="openSipp(row.perkara_id)"
                >
                  <span>{{ row.nomor_perkara }}</span>
                  <UIcon
                    v-if="loadingPerkaraId === row.perkara_id"
                    name="i-heroicons-arrow-path"
                    class="w-3.5 h-3.5 animate-spin text-emerald-500"
                  />
                </button>
              </td>
              <td class="py-3 px-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ formatDate(row.tanggal_pendaftaran) }}
              </td>
              <td class="py-3 px-3 text-xs">
                <!-- Badge Jenis Perkara: Khusus Permohonan menggunakan warna UNGU (purple), Gugatan menggunakan warna BIRU (blue) -->
                <UBadge
                  :color="isPermohonan(row) ? 'purple' : 'blue'"
                  variant="subtle"
                  size="xs"
                  class="font-medium"
                >
                  <span class="font-bold mr-1">{{ isPermohonan(row) ? 'Pdt.P' : 'Pdt.G' }}</span>
                  <span>• {{ row.jenis_perkara_nama }}</span>
                </UBadge>
              </td>
              <td class="py-3 px-3 font-semibold text-gray-900 dark:text-white max-w-[200px] truncate" :title="row.nama_pihak">
                {{ row.nama_pihak || '-' }}
              </td>
              <td class="py-3 px-3">
                <div class="space-y-0.5">
                  <p class="font-semibold text-xs text-gray-800 dark:text-gray-200">
                    {{ row.kecamatan_nama }}
                  </p>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-teal-500 shrink-0" />
                    <span>Kel. {{ row.kelurahan_nama }}</span>
                  </p>
                </div>
              </td>
              <td class="py-3 px-3 text-xs text-gray-600 dark:text-gray-400 max-w-[240px] truncate" :title="row.alamat">
                {{ row.alamat || '-' }}
              </td>
              <td class="py-3 px-3 text-xs">
                <span class="text-gray-700 dark:text-gray-300">
                  {{ row.proses_terakhir_text || row.tahapan_terakhir_text || '-' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <template v-if="selectedKecamatan && data?.total > 0" #footer>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div>
            Menampilkan {{ (currentPage - 1) * pageLimit + 1 }} - {{ Math.min(currentPage * pageLimit, data?.total || 0) }} dari total {{ data?.total || 0 }} perkara di Kecamatan {{ selectedKecamatanNama || selectedKecamatan }}
            <span v-if="selectedKelurahan" class="font-semibold text-teal-600 dark:text-teal-400"> (Kelurahan {{ selectedKelurahan }})</span>
            <span v-if="selectedAlurPerkara === '15'" class="font-semibold text-blue-600 dark:text-blue-400"> (Gugatan)</span>
            <span v-else-if="selectedAlurPerkara === '16'" class="font-semibold text-purple-600 dark:text-purple-400"> (Permohonan)</span>
          </div>
          <div v-if="(data?.totalPages || 0) > 1">
            <UPagination
              v-model="currentPage"
              :page-count="pageLimit"
              :total="data?.total || 0"
              size="xs"
            />
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedPihakType,
  selectedAlurPerkara,
  selectedKecamatan,
  selectedKecamatanNama,
  selectedKelurahan,
  refreshSignal,
  loadingPerkaraId,
  setKecamatanDanAlur,
  formatDate,
  openSipp
} = useStatistikGeografi()

const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = 15

const quickKecamatanList = [
  'Koja',
  'Cilincing',
  'Tanjung Priok',
  'Penjaringan',
  'Pademangan',
  'Kelapa Gading',
  'Kepulauan Seribu Utara',
  'Kepulauan Seribu Selatan'
]

const alurOptions = [
  { label: 'Semua Alur', value: 'all' },
  { label: 'Gugatan (Pdt.G)', value: '15' },
  { label: 'Permohonan (Pdt.P)', value: '16' }
]

// useLazyFetch hanya fetch jika selectedKecamatan bernilai truthy
const { data, pending, refresh } = useLazyFetch('/api/geografi/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    pihak_type: selectedPihakType.value,
    alur: selectedAlurPerkara.value,
    kecamatan: selectedKecamatan.value,
    kelurahan: selectedKelurahan.value,
    search: searchQuery.value,
    page: currentPage.value,
    limit: pageLimit
  })),
  watch: [selectedYear, selectedPihakType, selectedAlurPerkara, selectedKecamatan, selectedKelurahan, currentPage],
  default: () => null
})

// Opsi kelurahan yang berada di bawah kecamatan yang sedang dilihat
const kelurahanOptions = computed(() => {
  const options = [{ label: '-- Semua Kelurahan --', value: '' }]
  const list = data.value?.availableKelurahan || []
  list.forEach(item => {
    options.push({
      label: `${item.nama} (${item.total})`,
      value: item.nama
    })
  })
  return options
})

function onKelurahanChange() {
  currentPage.value = 1
}

function clearKelurahan() {
  selectedKelurahan.value = ''
  currentPage.value = 1
}

// Deteksi akurat apakah perkara adalah Permohonan (Pdt.P - alur 16)
function isPermohonan(row) {
  if (!row) return false
  if (Number(row.alur_perkara_id) === 16 || String(row.alur_perkara_id) === '16') return true
  if (row.nomor_perkara && String(row.nomor_perkara).includes('/Pdt.P/')) return true
  if (row.jenis_perkara_nama && String(row.jenis_perkara_nama).toLowerCase().includes('permohonan')) return true
  return false
}

function selectQuickKecamatan(kecNama) {
  selectedKelurahan.value = ''
  setKecamatanDanAlur(kecNama, kecNama, selectedAlurPerkara.value || 'all')
  scrollToDetail()
}

function scrollToDetail() {
  nextTick(() => {
    const el = document.getElementById('tabel-detail-perkara')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// Reset page ke 1 jika filter berubah
watch([selectedYear, selectedPihakType, selectedAlurPerkara, selectedKecamatan, selectedKelurahan], () => {
  currentPage.value = 1
})

// Reset kelurahan jika kecamatan berganti
watch(selectedKecamatan, () => {
  selectedKelurahan.value = ''
  currentPage.value = 1
})

const isLoading = computed(() => {
  if (!selectedKecamatan.value) return false
  return pending.value || !data.value
})

function handleSearch() {
  currentPage.value = 1
  refresh()
}

function resetSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  refresh()
}

function clearKecamatan() {
  selectedKecamatan.value = ''
  selectedKecamatanNama.value = ''
  selectedKelurahan.value = ''
  selectedAlurPerkara.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
}

watch(refreshSignal, () => {
  if (selectedKecamatan.value) {
    refresh()
  }
})
</script>
