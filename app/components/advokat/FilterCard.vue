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
            placeholder="Cari nama advokat, nomor induk / NIA, kantor, telepon, no. SK..."
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
            {{ isSearching ? 'Mencari...' : 'Cari Advokat' }}
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
      <div class="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <!-- Filter Status Perkara/Registrasi -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status Advokat
          </label>
          <USelect
            v-model="filterStatus"
            :options="statusOptions"
            size="sm"
            @change="page = 1"
          />
        </div>

        <!-- Urutkan Berdasarkan -->
        <div>
          <label class="block font-medium text-gray-700 dark:text-gray-300 mb-1">
            Urutkan
          </label>
          <USelect
            v-model="sortBy"
            :options="sortByOptions"
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
    </form>
  </UCard>
</template>

<script setup>
const {
  searchQuery,
  filterStatus,
  sortBy,
  page,
  limit,
  isSearching,
  resetFilters
} = useAdvokat()

const localSearchInput = ref(searchQuery.value)

watch(searchQuery, (newVal) => {
  localSearchInput.value = newVal
})

const statusOptions = [
  { label: 'Semua Advokat', value: 'all' },
  { label: 'Pernah / Sedang Menangani Perkara', value: 'with_cases' },
  { label: 'Tercatat Nomor Induk (NIA)', value: 'has_nia' }
]

const sortByOptions = [
  { label: 'Paling Banyak Perkara (Top Advokat)', value: 'cases_desc' },
  { label: 'Nama Advokat (A - Z)', value: 'name_asc' },
  { label: 'ID Terdaftar Terbaru', value: 'id_desc' }
]

const limitOptions = [
  { label: '10 Data / Halaman', value: 10 },
  { label: '20 Data / Halaman', value: 20 },
  { label: '50 Data / Halaman', value: 50 },
  { label: '100 Data / Halaman', value: 100 }
]

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
