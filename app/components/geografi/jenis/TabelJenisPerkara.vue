<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
            <UIcon name="i-heroicons-table-cells" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Tabel Rekapitulasi Jenis Perkara Pengadilan Agama (ID 341 - 371)
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Menghitung total beban perkara per jenis perkara pada Tahun {{ selectedYear }}
            </p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Search input for jenis perkara table -->
          <UInput
            v-model="searchKeyword"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari jenis perkara..."
            size="xs"
            class="w-48"
          />

          <!-- Sort Selector -->
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            size="xs"
            class="w-36"
          />
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="p-4 space-y-3">
      <div v-for="i in 10" :key="i" class="flex items-center gap-4">
        <USkeleton class="h-5 w-8" />
        <USkeleton class="h-5 w-16" />
        <USkeleton class="h-5 w-48" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 flex-1" />
        <USkeleton class="h-5 w-16" />
      </div>
    </div>

    <!-- Table Content -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-3 px-4 w-12 text-center">No</th>
            <th class="py-3 px-3 w-20 text-center">ID</th>
            <th class="py-3 px-4">Nama Jenis Perkara</th>
            <th class="py-3 px-4 text-right">Gugatan (Pdt.G)</th>
            <th class="py-3 px-4 text-right">Permohonan (Pdt.P)</th>
            <th class="py-3 px-4 text-right font-bold">Total Perkara</th>
            <th class="py-3 px-4 w-44">Kontribusi (%)</th>
            <th class="py-3 px-4 w-28 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 font-sans">
          <tr
            v-for="(item, idx) in filteredItems"
            :key="item.id"
            class="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
            :class="[
              item.total === 0 ? 'opacity-60 bg-gray-50/30 dark:bg-gray-800/20' : ''
            ]"
          >
            <!-- No -->
            <td class="py-2.5 px-4 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
              {{ idx + 1 }}
            </td>

            <!-- ID Master -->
            <td class="py-2.5 px-3 text-center">
              <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {{ item.id }}
              </span>
            </td>

            <!-- Nama Jenis Perkara -->
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
              <span>{{ item.nama }}</span>
            </td>

            <!-- Gugatan -->
            <td class="py-2.5 px-4 text-right">
              <span
                v-if="item.gugatan > 0"
                class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800"
              >
                {{ formatNumber(item.gugatan) }}
              </span>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Permohonan -->
            <td class="py-2.5 px-4 text-right">
              <span
                v-if="item.permohonan > 0"
                class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800"
              >
                {{ formatNumber(item.permohonan) }}
              </span>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Total Perkara -->
            <td class="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">
              <span v-if="item.total > 0" class="text-sm">
                {{ formatNumber(item.total) }}
              </span>
              <span v-else class="text-gray-400 font-normal">0</span>
            </td>

            <!-- Kontribusi & Bar -->
            <td class="py-2.5 px-4">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{{ item.persentase }}%</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-emerald-500 h-1.5 rounded-full"
                    :style="{ width: `${item.persentase}%` }"
                  />
                </div>
              </div>
            </td>

            <!-- Tombol Aksi Detail Modal -->
            <td class="py-2.5 px-4 text-center whitespace-nowrap">
              <UButton
                v-if="item.total > 0"
                size="2xs"
                color="emerald"
                variant="soft"
                icon="i-heroicons-eye"
                @click="openDetail(item)"
              >
                Detail
              </UButton>
              <span v-else class="text-xs text-gray-300 dark:text-gray-600">-</span>
            </td>
          </tr>

          <!-- Empty State jika pencarian tidak menemukan -->
          <tr v-if="filteredItems.length === 0">
            <td colspan="8" class="py-12 text-center text-sm text-gray-500">
              Tidak ada jenis perkara yang cocok dengan kata kunci "{{ searchKeyword }}".
            </td>
          </tr>
        </tbody>

        <!-- Footer Baris Total -->
        <tfoot class="bg-gray-100/80 dark:bg-gray-800/80 font-semibold border-t-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs">
          <tr>
            <td colspan="3" class="py-3 px-4 text-center uppercase tracking-wider font-bold">
              Total Beban Perkara Pengadilan Agama
            </td>
            <td class="py-3 px-4 text-right text-blue-700 dark:text-blue-300 font-bold">
              {{ formatNumber(data?.grandGugatan) }}
            </td>
            <td class="py-3 px-4 text-right text-purple-700 dark:text-purple-300 font-bold">
              {{ formatNumber(data?.grandPermohonan) }}
            </td>
            <td class="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
              {{ formatNumber(data?.grandTotal) }}
            </td>
            <td class="py-3 px-4">
              <span class="text-xs font-bold text-gray-600 dark:text-gray-300">100.0%</span>
            </td>
            <td class="py-3 px-4 text-center text-xs text-gray-400 dark:text-gray-500">
              -
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Modal Detail Perkara (Loaded on-demand saat tombol Detail diklik) -->
    <ModalDetailJenisPerkara
      v-model="isModalOpen"
      :jenis-id="selectedDetailItem.id"
      :jenis-nama="selectedDetailItem.nama"
      :total-count="selectedDetailItem.total"
    />
  </UCard>
</template>

<script setup>
import ModalDetailJenisPerkara from './ModalDetailJenisPerkara.vue'

const {
  selectedYear,
  selectedAlurPerkara,
  selectedPihakType,
  selectedKecamatan,
  refreshSignal,
  formatNumber
} = useStatistikJenisPerkara()

const searchKeyword = ref('')
const sortBy = ref('total')

// Modal state
const isModalOpen = ref(false)
const selectedDetailItem = ref({
  id: null,
  nama: '',
  total: 0
})

function openDetail(item) {
  selectedDetailItem.value = {
    id: item.id,
    nama: item.nama,
    total: item.total
  }
  isModalOpen.value = true
}

const sortOptions = [
  { label: 'Total Terbanyak', value: 'total' },
  { label: 'Urut ID SIPP (341-371)', value: 'id' },
  { label: 'Abjad Nama', value: 'nama' }
]

const { data, pending } = useLazyFetch('/api/geografi/jenis/tabel', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    alur: selectedAlurPerkara.value,
    pihak_type: selectedPihakType.value,
    kecamatan: selectedKecamatan.value,
    sort: sortBy.value,
    _s: refreshSignal.value
  })),
  watch: [selectedYear, selectedAlurPerkara, selectedPihakType, selectedKecamatan, sortBy, refreshSignal],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const filteredItems = computed(() => {
  if (!data.value?.items) return []
  if (!searchKeyword.value) return data.value.items
  const kw = searchKeyword.value.toLowerCase().trim()
  return data.value.items.filter(item =>
    item.nama.toLowerCase().includes(kw) || String(item.id).includes(kw)
  )
})
</script>
