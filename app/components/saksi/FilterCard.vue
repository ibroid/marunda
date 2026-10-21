<template>
  <UCard :ui="{ body: { padding: 'p-4 sm:p-5' } }">
    <form @submit.prevent="handleSearch" class="space-y-4">
      <!-- Main Search Input & Primary Action -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div class="relative flex-1">
          <UInput
            v-model="localSearchInput"
            :icon="isSearching ? 'i-heroicons-arrow-path' : 'i-heroicons-magnifying-glass'"
            :loading="isSearching"
            size="md"
            :placeholder="searchPlaceholder"
            :ui="{ icon: { leading: { pointer: '' } } }"
            @keydown.enter.prevent="handleSearch"
          >
            <template #trailing>
              <UButton
                v-if="localSearchInput && !isSearching"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            type="submit"
            color="primary"
            size="md"
            icon="i-heroicons-magnifying-glass"
            :loading="isSearching"
            :disabled="isSearching"
            class="flex-1 sm:flex-none justify-center px-5 font-semibold"
          >
            {{ isSearching ? 'Mencari...' : 'Cari Saksi' }}
          </UButton>
          <UButton
            type="button"
            color="gray"
            variant="outline"
            size="md"
            icon="i-heroicons-arrow-path"
            class="flex-1 sm:flex-none justify-center"
            @click="handleReset"
          >
            Reset
          </UButton>
        </div>
      </div>

      <!-- Additional Filters Grid -->
      <div class="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <!-- Filter Kriteria Kolom -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cari Berdasarkan
          </label>
          <USelect
            v-model="searchBy"
            :options="searchByOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Filter Saksi Pihak Ke -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Saksi Pihak
          </label>
          <USelect
            v-model="saksiPihakKe"
            :options="saksiPihakKeOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Filter Jenis Kelamin -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Jenis Kelamin
          </label>
          <USelect
            v-model="jenisKelamin"
            :options="jenisKelaminOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Filter Tahun Perkara -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tahun Perkara
          </label>
          <USelect
            v-model="selectedYear"
            :options="yearOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Filter Keterangan Sidang / BAP -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keterangan Sidang
          </label>
          <USelect
            v-model="hasKeterangan"
            :options="hasKeteranganOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Jumlah Baris Per Halaman -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Baris / Halaman
          </label>
          <USelect
            v-model="limit"
            :options="limitOptions"
            size="sm"
            @change="page = 1"
          />
        </div>
      </div>
    </form>
  </UCard>
</template>

<script setup>
const {
  searchQuery,
  searchBy,
  saksiPihakKe,
  jenisKelamin,
  selectedYear,
  hasKeterangan,
  page,
  limit,
  isSearching,
  resetFilters
} = useSaksi()

const localSearchInput = ref(searchQuery.value)

watch(searchQuery, (newVal) => {
  localSearchInput.value = newVal
})

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: 'Semua Tahun', value: 'all' },
  { label: `${currentYear}`, value: `${currentYear}` },
  { label: `${currentYear - 1}`, value: `${currentYear - 1}` },
  { label: `${currentYear - 2}`, value: `${currentYear - 2}` },
  { label: `${currentYear - 3}`, value: `${currentYear - 3}` },
  { label: `${currentYear - 4}`, value: `${currentYear - 4}` },
  { label: `${currentYear - 5}`, value: `${currentYear - 5}` },
  { label: `${currentYear - 6}`, value: `${currentYear - 6}` }
]

const searchByOptions = [
  { label: 'Semua Kolom', value: 'semua' },
  { label: 'Nama Saksi', value: 'nama' },
  { label: 'Nomor Perkara', value: 'nomor_perkara' },
  { label: 'NIK / No. Identitas', value: 'nomor_indentitas' },
  { label: 'Pekerjaan', value: 'pekerjaan' },
  { label: 'Alamat / Domisili', value: 'alamat' }
]

const saksiPihakKeOptions = [
  { label: 'Semua Saksi', value: 'all' },
  { label: 'Penggugat / Pemohon', value: '1' },
  { label: 'Tergugat / Termohon', value: '2' }
]

const jenisKelaminOptions = [
  { label: 'Semua Gender', value: 'all' },
  { label: 'Laki-laki', value: 'L' },
  { label: 'Perempuan', value: 'P' }
]

const hasKeteranganOptions = [
  { label: 'Semua Status BAP', value: 'all' },
  { label: 'Ada Keterangan BAP', value: 'yes' },
  { label: 'Belum Ada BAP', value: 'no' }
]

const limitOptions = [
  { label: '10 Data', value: 10 },
  { label: '20 Data', value: 20 },
  { label: '50 Data', value: 50 },
  { label: '100 Data', value: 100 }
]

const searchPlaceholder = computed(() => {
  switch (searchBy.value) {
    case 'nama':
      return 'Ketik nama saksi (contoh: Siti, Ahmad, Budi)...'
    case 'nomor_perkara':
      return 'Ketik nomor perkara (contoh: 2832/Pdt.G/2026/PA.JU)...'
    case 'nomor_indentitas':
      return 'Ketik 16 digit NIK atau nomor identitas saksi...'
    case 'pekerjaan':
      return 'Ketik pekerjaan (contoh: Wiraswasta, Karyawan, Guru)...'
    case 'alamat':
      return 'Ketik nama jalan, kelurahan, atau kecamatan...'
    default:
      return 'Cari nama saksi, nomor perkara, NIK, pekerjaan, atau alamat...'
  }
})

const handleSearch = () => {
  page.value = 1
  searchQuery.value = localSearchInput.value.trim()
}

const clearSearch = () => {
  localSearchInput.value = ''
  searchQuery.value = ''
  page.value = 1
}

const handleReset = () => {
  resetFilters()
  localSearchInput.value = ''
}
</script>
