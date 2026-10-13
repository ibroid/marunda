<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 p-3 sm:p-4 shadow-sm">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-rectangle-stack" class="w-5 h-5 text-primary-500" />
        <span class="text-sm font-semibold text-gray-900 dark:text-white">Pilih Jenis Laporan LIPA / RK</span>
        <UBadge size="xs" color="gray" variant="solid" class="font-mono">
          {{ activeLipaItem?.code }}
        </UBadge>
      </div>

      <!-- Search Input & Category Filter -->
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari laporan..."
          size="xs"
          class="w-full sm:w-56"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template #trailing>
            <UButton
              v-show="searchQuery"
              color="gray"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="searchQuery = ''"
            />
          </template>
        </UInput>

        <USelect
          v-model="selectedCategory"
          :options="categoryOptions"
          size="xs"
          class="w-full sm:w-44"
        />
      </div>
    </div>

    <!-- Horizontal Category Pills for quick access -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
      <button
        v-for="cat in categoryOptions"
        :key="cat.value"
        type="button"
        class="text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
        :class="[
          selectedCategory === cat.value
            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-800'
            : 'bg-gray-100/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Report Items Grid (Compact & Clickable) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2 max-h-52 overflow-y-auto pr-1">
      <button
        v-for="item in filteredReports"
        :key="item.id"
        type="button"
        class="flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all duration-150 relative group"
        :class="[
          selectedLipa === item.id
            ? 'bg-primary-50/80 dark:bg-primary-950/40 border-primary-500 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-500'
            : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        ]"
        @click="handleSelect(item.id)"
      >
        <div class="flex items-center justify-between w-full mb-1">
          <span class="font-bold text-[11px] font-mono tracking-tight" :class="selectedLipa === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'">
            {{ item.code }}
          </span>
          <UBadge
            v-if="item.isManualDipa"
            size="xs"
            color="amber"
            variant="subtle"
            class="text-[9px] px-1 py-0"
          >
            DIPA
          </UBadge>
        </div>
        <span class="line-clamp-2 text-[11px] leading-tight font-medium" :title="item.title">
          {{ item.shortTitle }}
        </span>
      </button>
    </div>

    <!-- Empty search result state -->
    <div v-if="filteredReports.length === 0" class="py-6 text-center text-xs text-gray-500">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 mx-auto text-gray-400 mb-1" />
      <p>Tidak ada laporan yang sesuai dengan pencarian "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script setup>
const { lipaCatalog, selectedLipa, activeLipaItem, triggerRefresh } = useLaporan()

const searchQuery = ref('')
const selectedCategory = ref('all')

const categoryOptions = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Keadaan Perkara', value: 'keadaan' },
  { label: 'Upaya Hukum & Eksekusi', value: 'upaya_hukum' },
  { label: 'Kinerja Hakim & Mediasi', value: 'kinerja_hakim' },
  { label: 'Tematik & Perceraian', value: 'tematik' },
  { label: 'Keuangan Perkara', value: 'keuangan' },
  { label: 'Bantuan Hukum & DIPA', value: 'bantuan_hukum' },
  { label: 'Rekapitulasi (RK)', value: 'rekapitulasi' }
]

const filteredReports = computed(() => {
  return lipaCatalog.filter((item) => {
    // Filter Category
    if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
      return false
    }

    // Filter Search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchCode = item.code.toLowerCase().includes(q)
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchShort = item.shortTitle.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      return matchCode || matchTitle || matchShort || matchDesc
    }

    return true
  })
})

function handleSelect(id) {
  selectedLipa.value = id
  triggerRefresh()
}
</script>
