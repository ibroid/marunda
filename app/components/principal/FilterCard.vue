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
            {{ isSearching ? 'Mencari...' : 'Cari Pihak' }}
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

      <!-- Additional Filters Row -->
      <div class="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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

        <!-- Filter Jenis Pihak -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Jenis Pihak
          </label>
          <USelect
            v-model="jenisPihak"
            :options="jenisPihakOptions"
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

        <!-- Jumlah Data Per Halaman -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Baris Per Halaman
          </label>
          <USelect
            v-model="limit"
            :options="limitOptions"
            size="sm"
            @change="page = 1"
          />
        </div>
      </div>

      <!-- Hint text -->
      <div class="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-primary-500 shrink-0" />
        <span>
          Basis data SIPP berisi <strong>> 120.000 pihak</strong>. Data akan dimuat secara otomatis setelah Anda memasukkan kata kunci pencarian.
        </span>
      </div>
    </form>
  </UCard>
</template>

<script setup>
const {
  searchQuery,
  searchBy,
  jenisPihak,
  jenisKelamin,
  page,
  limit,
  isSearching,
  resetFilters
} = usePrincipal()

const localSearchInput = ref(searchQuery.value)

// Keep localSearchInput in sync if searchQuery is modified externally (e.g. on reset)
watch(searchQuery, (newVal) => {
  localSearchInput.value = newVal
})

const searchByOptions = [
  { label: 'Semua Kriteria (Nama, NIK, Telp, Alamat)', value: 'semua' },
  { label: 'Nama Pihak', value: 'nama' },
  { label: 'NIK / Nomor Identitas', value: 'nomor_indentitas' },
  { label: 'Nomor Telepon / HP', value: 'telepon' },
  { label: 'Alamat / Domisili / Wilayah', value: 'alamat' },
  { label: 'Pekerjaan', value: 'pekerjaan' }
]

const jenisPihakOptions = [
  { label: 'Semua Jenis Pihak', value: 'all' },
  { label: 'Perorangan', value: '1' },
  { label: 'Badan Hukum', value: '3' },
  { label: 'Pemerintah', value: '2' }
]

const jenisKelaminOptions = [
  { label: 'Semua Gender', value: 'all' },
  { label: 'Laki-laki (L)', value: 'L' },
  { label: 'Perempuan (P)', value: 'P' }
]

const limitOptions = [
  { label: '10 Data / Halaman', value: 10 },
  { label: '20 Data / Halaman', value: 20 },
  { label: '50 Data / Halaman', value: 50 },
  { label: '100 Data / Halaman', value: 100 }
]

const searchPlaceholder = computed(() => {
  switch (searchBy.value) {
    case 'nama':
      return 'Ketik nama lengkap pihak (contoh: Siti, Ahmad, CV...)'
    case 'nomor_indentitas':
      return 'Ketik nomor NIK / KTP / Paspor...'
    case 'telepon':
      return 'Ketik nomor telepon atau HP...'
    case 'alamat':
      return 'Ketik jalan, kelurahan, atau kecamatan...'
    case 'pekerjaan':
      return 'Ketik profesi atau pekerjaan...'
    default:
      return 'Ketik nama pihak, NIK, telepon, atau alamat...'
  }
})

const handleSearch = () => {
  const val = localSearchInput.value.trim()
  searchQuery.value = val
  page.value = 1
  if (val) {
    isSearching.value = true
  }
}

const clearSearch = () => {
  localSearchInput.value = ''
  searchQuery.value = ''
  isSearching.value = false
  page.value = 1
}

const handleReset = () => {
  localSearchInput.value = ''
  isSearching.value = false
  resetFilters()
}
</script>
