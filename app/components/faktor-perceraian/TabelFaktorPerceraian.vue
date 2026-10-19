<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
            <UIcon name="i-heroicons-table-cells" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Tabel Rekapitulasi Faktor Perceraian ({{ selectedYear }})
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Klasifikasi faktor penyebab perceraian berdasarkan akta cerai yang diterbitkan
            </p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Search input for tabel -->
          <UInput
            v-model="searchKeyword"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari faktor penyebab..."
            size="xs"
            class="w-52"
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
      <div v-for="i in 8" :key="i" class="flex items-center gap-4">
        <USkeleton class="h-5 w-8" />
        <USkeleton class="h-5 w-12" />
        <USkeleton class="h-5 w-56" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 w-20" />
        <USkeleton class="h-5 flex-1" />
        <USkeleton class="h-5 w-20" />
      </div>
    </div>

    <!-- Table Content -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-3 px-4 w-12 text-center">No</th>
            <th class="py-3 px-3 w-16 text-center">ID</th>
            <th class="py-3 px-4">Faktor Penyebab Perceraian</th>
            <th class="py-3 px-4 text-right">Cerai Gugat (CG)</th>
            <th class="py-3 px-4 text-right">Cerai Talak (CT)</th>
            <th class="py-3 px-4 text-right font-bold">Total Perkara</th>
            <th class="py-3 px-4 w-44">Kontribusi (%)</th>
            <th class="py-3 px-4 w-28 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 font-sans">
          <tr
            v-for="(item, idx) in filteredItems"
            :key="item.id"
            class="transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
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

            <!-- Nama Faktor -->
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
              <span>{{ item.nama }}</span>
            </td>

            <!-- Cerai Gugat (Clickable) -->
            <td class="py-2.5 px-4 text-right">
              <button
                v-if="item.ceraiGugat > 0"
                type="button"
                class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900 transition-colors cursor-pointer"
                title="Klik untuk rincian Cerai Gugat"
                @click="openDetail(item, 'Cerai Gugat')"
              >
                {{ formatNumber(item.ceraiGugat) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Cerai Talak (Clickable) -->
            <td class="py-2.5 px-4 text-right">
              <button
                v-if="item.ceraiTalak > 0"
                type="button"
                class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                title="Klik untuk rincian Cerai Talak"
                @click="openDetail(item, 'Cerai Talak')"
              >
                {{ formatNumber(item.ceraiTalak) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Total Perkara (Clickable) -->
            <td class="py-2.5 px-4 text-right font-bold">
              <button
                v-if="item.total > 0"
                type="button"
                class="text-sm text-gray-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 hover:underline transition-colors cursor-pointer"
                title="Klik untuk rincian seluruh perkara faktor ini"
                @click="openDetail(item, 'all')"
              >
                {{ formatNumber(item.total) }}
              </button>
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
                    class="bg-rose-500 h-1.5 rounded-full"
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
                color="rose"
                variant="soft"
                icon="i-heroicons-eye"
                @click="openDetail(item, 'all')"
              >
                Detail
              </UButton>
              <span v-else class="text-xs text-gray-300 dark:text-gray-600">-</span>
            </td>
          </tr>

          <!-- Empty State jika pencarian tidak menemukan -->
          <tr v-if="filteredItems.length === 0">
            <td colspan="8" class="py-12 text-center text-sm text-gray-500">
              Tidak ada faktor perceraian yang cocok dengan kata kunci "{{ searchKeyword }}".
            </td>
          </tr>
        </tbody>

        <!-- Footer Baris Total -->
        <tfoot class="bg-gray-100/80 dark:bg-gray-800/80 font-semibold border-t-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs">
          <tr>
            <td colspan="3" class="py-3 px-4 text-center uppercase tracking-wider font-bold">
              Total Beban Perceraian Terdata
            </td>
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                class="text-pink-700 dark:text-pink-300 font-bold hover:underline cursor-pointer"
                title="Klik untuk melihat seluruh Cerai Gugat"
                @click="openGrandDetail('Cerai Gugat')"
              >
                {{ formatNumber(data?.grandCeraiGugat) }}
              </button>
            </td>
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                class="text-indigo-700 dark:text-indigo-300 font-bold hover:underline cursor-pointer"
                title="Klik untuk melihat seluruh Cerai Talak"
                @click="openGrandDetail('Cerai Talak')"
              >
                {{ formatNumber(data?.grandCeraiTalak) }}
              </button>
            </td>
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                class="text-rose-700 dark:text-rose-400 font-extrabold text-sm hover:underline cursor-pointer"
                title="Klik untuk melihat seluruh rincian perkara"
                @click="openGrandDetail('all')"
              >
                {{ formatNumber(data?.grandTotal) }}
              </button>
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

    <!-- Modal Detail Perkara (Hanya fetch data saat interaksi user) -->
    <ModalDetailFaktor />
  </UCard>
</template>

<script setup>
import ModalDetailFaktor from './ModalDetailFaktor.vue'

const {
  selectedYear,
  selectedJenisCerai,
  selectedMonth,
  refreshSignal,
  formatNumber,
  openDetailModal
} = useFaktorPerceraian()

const searchKeyword = ref('')
const sortBy = ref('total')

const sortOptions = [
  { label: 'Total Terbanyak', value: 'total' },
  { label: 'Urut ID SIPP (1-26)', value: 'id' },
  { label: 'Abjad Nama', value: 'nama' }
]

const { data, pending } = useLazyFetch('/api/faktor-perceraian/tabel', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis_cerai: selectedJenisCerai.value
  })),
  watch: [selectedYear, selectedMonth, selectedJenisCerai, refreshSignal],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const filteredItems = computed(() => {
  const items = data.value?.items || []
  let filtered = items

  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.trim().toLowerCase()
    filtered = filtered.filter(item =>
      (item.nama && item.nama.toLowerCase().includes(q)) ||
      String(item.id).includes(q)
    )
  }

  // Sort
  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'total') return b.total - a.total
    if (sortBy.value === 'id') return a.id - b.id
    if (sortBy.value === 'nama') return a.nama.localeCompare(b.nama)
    return 0
  })
})

function openDetail(item, jenisCerai = 'all') {
  openDetailModal({
    faktorId: item.id,
    faktorNama: item.nama,
    jenisCerai,
    totalCount: jenisCerai === 'Cerai Gugat'
      ? item.ceraiGugat
      : jenisCerai === 'Cerai Talak'
        ? item.ceraiTalak
        : item.total
  })
}

function openGrandDetail(jenisCerai = 'all') {
  openDetailModal({
    faktorId: null,
    faktorNama: 'Semua Faktor Perceraian',
    jenisCerai,
    totalCount: jenisCerai === 'Cerai Gugat'
      ? data.value?.grandCeraiGugat
      : jenisCerai === 'Cerai Talak'
        ? data.value?.grandCeraiTalak
        : data.value?.grandTotal
  })
}
</script>
