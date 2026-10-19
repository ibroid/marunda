<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            <UIcon name="i-heroicons-table-cells" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Tabel Rekapitulasi Tingkat Pendidikan Pengaju Perceraian ({{ selectedYear }})
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Klasifikasi total perkara perceraian berdasarkan tingkat pendidikan pengaju (Pihak 1)
            </p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Search input for tabel -->
          <UInput
            v-model="searchKeyword"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari jenjang pendidikan..."
            size="xs"
            class="w-52"
          />

          <!-- Sort Selector -->
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            size="xs"
            class="w-40"
          />
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="p-4 space-y-3">
      <div v-for="i in 8" :key="i" class="flex items-center gap-4">
        <USkeleton class="h-5 w-8" />
        <USkeleton class="h-5 w-16" />
        <USkeleton class="h-5 w-56" />
        <USkeleton class="h-5 w-24" />
        <USkeleton class="h-5 w-24" />
        <USkeleton class="h-5 w-24" />
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
            <th class="py-3 px-3 w-20 text-center">Kode</th>
            <th class="py-3 px-4">Tingkat Pendidikan Pengaju</th>
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
            class="transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
            :class="[
              item.total === 0 ? 'opacity-60 bg-gray-50/30 dark:bg-gray-800/20' : ''
            ]"
          >
            <!-- No -->
            <td class="py-2.5 px-4 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
              {{ idx + 1 }}
            </td>

            <!-- Kode -->
            <td class="py-2.5 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {{ item.kode }}
              </span>
            </td>

            <!-- Tingkat Pendidikan -->
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ item.nama }}</span>
              </div>
            </td>

            <!-- Cerai Gugat -->
            <td class="py-2.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
              <button
                type="button"
                class="hover:underline cursor-pointer disabled:cursor-default"
                :disabled="item.ceraiGugat === 0"
                @click="openDetail(item, 'Cerai Gugat')"
              >
                {{ formatNumber(item.ceraiGugat) }}
              </button>
            </td>

            <!-- Cerai Talak -->
            <td class="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
              <button
                type="button"
                class="hover:underline cursor-pointer disabled:cursor-default"
                :disabled="item.ceraiTalak === 0"
                @click="openDetail(item, 'Cerai Talak')"
              >
                {{ formatNumber(item.ceraiTalak) }}
              </button>
            </td>

            <!-- Total Perkara -->
            <td class="py-2.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
              <button
                type="button"
                class="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:cursor-default"
                :disabled="item.total === 0"
                @click="openDetail(item, 'all')"
              >
                {{ formatNumber(item.total) }}
              </button>
            </td>

            <!-- Kontribusi (%) Progress Bar -->
            <td class="py-2.5 px-4">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-gray-700 dark:text-gray-300 font-semibold">{{ item.persentase }}%</span>
                  <span class="text-[10px] text-gray-400">dari total</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(100, item.persentase)}%` }"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Tombol Aksi Detail Modal -->
            <td class="py-2.5 px-4 text-center whitespace-nowrap">
              <UButton
                v-if="item.total > 0"
                size="2xs"
                color="indigo"
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
              Tidak ada jenjang pendidikan yang cocok dengan kata kunci "{{ searchKeyword }}".
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
                class="text-blue-700 dark:text-blue-300 font-bold hover:underline cursor-pointer"
                title="Klik untuk melihat seluruh Cerai Talak"
                @click="openGrandDetail('Cerai Talak')"
              >
                {{ formatNumber(data?.grandCeraiTalak) }}
              </button>
            </td>
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                class="text-indigo-700 dark:text-indigo-400 font-extrabold text-sm hover:underline cursor-pointer"
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
    <ModalDetailPendidikan />
  </UCard>
</template>

<script setup>
import ModalDetailPendidikan from './ModalDetailPendidikan.vue'

const {
  selectedYear,
  selectedJenisCerai,
  selectedMonth,
  refreshSignal,
  formatNumber,
  openDetailModal
} = usePendidikanPerceraian()

const searchKeyword = ref('')
const sortBy = ref('total_desc')

const sortOptions = [
  { label: 'Total Terbanyak', value: 'total_desc' },
  { label: 'Total Terendah', value: 'total_asc' },
  { label: 'Nama (A - Z)', value: 'nama_asc' },
  { label: 'Cerai Gugat Terbanyak', value: 'cg_desc' },
  { label: 'Cerai Talak Terbanyak', value: 'ct_desc' },
  { label: 'Urutan Master Jenjang', value: 'id_asc' }
]

const { data, pending, refresh } = useLazyFetch('/api/pendidikan-perceraian/tabel', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis_cerai: selectedJenisCerai.value
  })),
  watch: [selectedYear, selectedMonth, selectedJenisCerai],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})

const filteredItems = computed(() => {
  if (!data.value?.items) return []
  let items = [...data.value.items]

  // Filter keyword
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase().trim()
    items = items.filter(it =>
      it.nama.toLowerCase().includes(kw) ||
      it.kode.toLowerCase().includes(kw)
    )
  }

  // Sorting
  switch (sortBy.value) {
    case 'total_desc':
      items.sort((a, b) => b.total - a.total || a.id - b.id)
      break
    case 'total_asc':
      items.sort((a, b) => a.total - b.total || a.id - b.id)
      break
    case 'nama_asc':
      items.sort((a, b) => a.nama.localeCompare(b.nama))
      break
    case 'cg_desc':
      items.sort((a, b) => b.ceraiGugat - a.ceraiGugat)
      break
    case 'ct_desc':
      items.sort((a, b) => b.ceraiTalak - a.ceraiTalak)
      break
    case 'id_asc':
      items.sort((a, b) => a.id - b.id)
      break
  }

  return items
})

const openDetail = (item, jenis) => {
  if (!item || item.total === 0) return
  openDetailModal({
    pendidikanId: item.id,
    pendidikanKode: item.kode,
    pendidikanNama: item.nama,
    jenisCerai: jenis || selectedJenisCerai.value || 'all',
    totalCount: jenis === 'Cerai Gugat' ? item.ceraiGugat : jenis === 'Cerai Talak' ? item.ceraiTalak : item.total
  })
}

const openGrandDetail = (jenis) => {
  if (!data.value?.grandTotal) return
  openDetailModal({
    pendidikanId: null,
    pendidikanNama: 'Semua Tingkat Pendidikan',
    jenisCerai: jenis,
    totalCount: jenis === 'Cerai Gugat'
      ? data.value.grandCeraiGugat
      : jenis === 'Cerai Talak'
        ? data.value.grandCeraiTalak
        : data.value.grandTotal
  })
}
</script>
