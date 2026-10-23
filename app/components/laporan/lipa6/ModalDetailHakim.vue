<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary-500" />
            <div>
              <h3 class="text-base font-bold text-gray-900 dark:text-white">
                Detail Perkara - {{ hakimNama }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Periode {{ getNamaBulan(selectedMonth) }} {{ selectedYear }}
              </p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4 py-1">
        <!-- Filter Tabs Kategori -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="tab in filterTabs"
              :key="tab.value"
              :variant="activeTab === tab.value ? 'solid' : 'ghost'"
              :color="activeTab === tab.value ? 'primary' : 'gray'"
              size="xs"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </UButton>
          </div>

          <!-- Search Box -->
          <div class="w-full sm:w-64">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Cari nomor perkara..."
              size="xs"
            />
          </div>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="pending" class="space-y-2 py-4">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="h-8 w-full" />
          <USkeleton class="h-8 w-full" />
          <USkeleton class="h-8 w-full" />
        </div>

        <!-- Tabel Kasus -->
        <div v-else class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold border-b border-gray-300 dark:border-gray-600">
                <th class="py-2 px-3 text-center w-10">No</th>
                <th class="py-2 px-3 min-w-[140px]">Nomor Perkara</th>
                <th class="py-2 px-3 min-w-[120px]">Jenis Perkara</th>
                <th class="py-2 px-3 text-center min-w-[90px]">Tgl Daftar</th>
                <th class="py-2 px-3 text-center min-w-[90px]">Tgl PMH</th>
                <th class="py-2 px-3 text-center min-w-[90px]">Tgl Putus</th>
                <th class="py-2 px-3 text-center min-w-[90px]">Tgl Minutasi</th>
                <th class="py-2 px-3 text-center min-w-[110px]">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <template v-if="perkaraList.length > 0">
                <tr
                  v-for="(item, idx) in perkaraList"
                  :key="item.perkara_id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <td class="py-2 px-3 text-center text-gray-500">
                    {{ ((page - 1) * pageSize) + idx + 1 }}
                  </td>
                  <td class="py-2 px-3 font-semibold text-primary-600 dark:text-primary-400">
                    {{ item.nomor_perkara || '-' }}
                  </td>
                  <td class="py-2 px-3 text-gray-700 dark:text-gray-300">
                    {{ item.jenis_perkara_nama || '-' }}
                  </td>
                  <td class="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                    {{ formatDate(item.tanggal_pendaftaran) }}
                  </td>
                  <td class="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                    {{ formatDate(item.penetapan_majelis_hakim) }}
                  </td>
                  <td class="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                    {{ formatDate(item.tanggal_putusan) }}
                  </td>
                  <td class="py-2 px-3 text-center text-gray-600 dark:text-gray-400">
                    {{ formatDate(item.tanggal_minutasi) }}
                  </td>
                  <td class="py-2 px-3 text-center">
                    <UBadge
                      :color="getStatusColor(item.status_tahapan)"
                      variant="subtle"
                      size="xs"
                    >
                      {{ item.status_tahapan }}
                    </UBadge>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8" class="py-8 text-center text-gray-400">
                  Tidak ada perkara untuk kategori dan pencarian ini
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
          <span class="text-xs text-gray-500">
            Total {{ totalRows }} perkara
          </span>
          <div class="flex items-center gap-1.5">
            <UButton
              color="gray"
              variant="outline"
              size="xs"
              icon="i-heroicons-chevron-left"
              :disabled="page <= 1"
              @click="page--"
            />
            <span class="text-xs px-2 font-medium">{{ page }} / {{ totalPages }}</span>
            <UButton
              color="gray"
              variant="outline"
              size="xs"
              icon="i-heroicons-chevron-right"
              :disabled="page >= totalPages"
              @click="page++"
            />
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hakimId: {
    type: [Number, String],
    default: null
  },
  hakimNama: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const {
  selectedYear,
  selectedMonth,
  selectedRole,
  getNamaBulan
} = useLipa6()

const activeTab = ref('semua')
const searchQuery = ref('')
const page = ref(1)
const pageSize = 15

const filterTabs = [
  { label: 'Semua Beban', value: 'semua' },
  { label: 'Sisa Bulan Lalu', value: 'sisa_lalu' },
  { label: 'Tambah Bulan Ini', value: 'tambah' },
  { label: 'Diputus', value: 'putus' },
  { label: 'Sisa Bulan Ini', value: 'sisa_ybs' },
  { label: 'Sudah Minutasi', value: 'minutir' },
  { label: 'Belum Minutasi', value: 'belum_minutir' }
]

watch([() => props.hakimId, activeTab, searchQuery], () => {
  page.value = 1
})

const { data: detailData, pending } = useLazyFetch('/api/laporan/lipa6/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    role: selectedRole.value,
    hakim_id: props.hakimId,
    kategori: activeTab.value,
    search: searchQuery.value,
    page: page.value,
    pageSize
  })),
  watch: [() => props.hakimId, activeTab, searchQuery, page, selectedYear, selectedMonth, selectedRole],
  default: () => null
})

const perkaraList = computed(() => detailData.value?.data || [])
const totalRows = computed(() => detailData.value?.total || 0)
const totalPages = computed(() => detailData.value?.totalPages || 1)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const str = String(dateStr).trim()
  if (str === '0000-00-00' || str === '' || str === 'null') return '-'
  try {
    const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0]
    const p = clean.split('-')
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`
    return str
  } catch {
    return str
  }
}

const getStatusColor = (status) => {
  if (status === 'Sudah Minutasi') return 'emerald'
  if (status === 'Putus Belum Minutasi') return 'amber'
  return 'blue'
}
</script>
