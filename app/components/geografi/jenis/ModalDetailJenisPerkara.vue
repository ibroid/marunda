<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-5xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <UIcon name="i-heroicons-rectangle-stack" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Rincian Perkara: {{ jenisNama || 'Jenis Perkara' }}
                </h3>
                <UBadge color="gray" variant="subtle" size="xs">
                  ID {{ jenisId }}
                </UBadge>
                <UBadge color="emerald" variant="subtle" size="xs">
                  Tahun {{ selectedYear }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ selectedKecamatan ? `Kecamatan: ${selectedKecamatan} • ` : '' }}
                Total {{ formatNumber(data?.total || totalCount || 0) }} perkara terdaftar
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
          <!-- Alur Filter (Semua, Gugatan, Permohonan) -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition"
              :class="modalAlur === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="modalAlur = 'all'"
            >
              Semua Alur
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalAlur === '15' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="modalAlur = '15'"
            >
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Gugatan</span>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="modalAlur === '16' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="modalAlur = '16'"
            >
              <span class="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Permohonan</span>
            </button>
          </div>

          <!-- Search Input -->
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara / pihak..."
            size="xs"
            class="w-full sm:w-64"
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
            <USkeleton class="h-5 w-10" />
            <USkeleton class="h-5 w-36" />
            <USkeleton class="h-5 w-24" />
            <USkeleton class="h-5 flex-1" />
            <USkeleton class="h-5 w-24" />
          </div>
        </div>

        <!-- Real Table -->
        <div v-else class="overflow-x-auto max-h-[60vh]">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/80 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-200 dark:border-gray-700 z-10">
              <tr>
                <th class="py-2.5 px-3 w-10 text-center">No</th>
                <th class="py-2.5 px-3">Nomor Perkara</th>
                <th class="py-2.5 px-3">Tgl Daftar</th>
                <th class="py-2.5 px-3">Jenis Perkara</th>
                <th class="py-2.5 px-3">Para Pihak</th>
                <th class="py-2.5 px-3">Domisili Pihak</th>
                <th class="py-2.5 px-3">Tahapan Terakhir</th>
                <th class="py-2.5 px-3 w-20 text-center">Aksi SIPP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-sans">
              <tr
                v-for="(item, idx) in data?.items || []"
                :key="item.perkara_id"
                class="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <!-- No -->
                <td class="py-2.5 px-3 text-center text-gray-400 font-mono">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara -->
                <td class="py-2.5 px-3 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                  {{ item.nomor_perkara }}
                </td>

                <!-- Tanggal Pendaftaran -->
                <td class="py-2.5 px-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {{ formatDate(item.tanggal_pendaftaran) }}
                </td>

                <!-- Jenis Perkara & Alur -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ item.jenis_perkara_nama || jenisNama || '-' }}
                  </div>
                  <div class="mt-0.5">
                    <UBadge
                      :color="item.alur_nama === 'Gugatan' ? 'blue' : 'purple'"
                      variant="subtle"
                      size="2xs"
                    >
                      {{ item.alur_nama }}
                    </UBadge>
                  </div>
                </td>

                <!-- Para Pihak -->
                <td class="py-2.5 px-3 max-w-xs text-[11px]">
                  <div v-if="item.para_pihak" class="text-gray-700 dark:text-gray-300 space-y-0.5 line-clamp-2" v-html="item.para_pihak" />
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Domisili -->
                <td class="py-2.5 px-3 text-[11px] whitespace-nowrap">
                  <p class="font-medium text-gray-800 dark:text-gray-200">
                    Kec. {{ item.kecamatan_nama }}
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 text-[10px]">
                    Kel. {{ item.kelurahan_nama }}
                  </p>
                </td>

                <!-- Tahapan Terakhir -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <UBadge color="gray" variant="solid" size="2xs">
                    {{ item.tahapan_terakhir_text }}
                  </UBadge>
                </td>

                <!-- Aksi SIPP -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UButton
                    size="2xs"
                    color="primary"
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
                <td colspan="8" class="py-8 text-center text-xs text-gray-500">
                  Tidak ada perkara yang ditemukan.
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
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  jenisId: {
    type: Number,
    default: null
  },
  jenisNama: {
    type: String,
    default: ''
  },
  totalCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const {
  selectedYear,
  selectedAlurPerkara,
  selectedPihakType,
  selectedKecamatan,
  loadingPerkaraId,
  formatNumber,
  formatDate,
  openSipp
} = useStatistikJenisPerkara()

const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const activeSearch = ref('')
const modalAlur = ref('all')

// Inisialisasi filter alur modal mengikuti filter halaman saat pertama buka
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    page.value = 1
    searchInput.value = ''
    activeSearch.value = ''
    modalAlur.value = selectedAlurPerkara.value || 'all'
  }
})

watch(modalAlur, () => {
  page.value = 1
})

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
  isOpen.value = false
}

// Fetch on-demand: Hanya request ke API jika modal sedang terbuka dan jenisId ada
const shouldFetch = computed(() => isOpen.value && props.jenisId !== null)

const { data, pending } = useLazyFetch('/api/geografi/jenis/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    jenis_perkara_id: props.jenisId,
    alur: modalAlur.value,
    pihak_type: selectedPihakType.value,
    kecamatan: selectedKecamatan.value,
    search: activeSearch.value,
    page: page.value,
    limit: limit.value
  })),
  watch: [
    shouldFetch,
    () => props.jenisId,
    modalAlur,
    activeSearch,
    page,
    selectedYear,
    selectedKecamatan,
    selectedPihakType
  ],
  default: () => null
})

const isLoading = computed(() => shouldFetch.value && (pending.value || !data.value))
</script>
