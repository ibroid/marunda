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
              Tabel Rekapitulasi Profesi / Pekerjaan Pengaju Perceraian ({{ selectedYear }})
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Klasifikasi total perkara perceraian berdasarkan pekerjaan pihak pengaju (Pihak 1)
            </p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Search input for tabel -->
          <UInput
            v-model="searchKeyword"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari profesi / pekerjaan..."
            size="xs"
            class="w-56"
          />

          <!-- Sort Selector -->
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            size="xs"
            class="w-44"
          />
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="p-4 space-y-3">
      <div v-for="i in 8" :key="i" class="flex items-center gap-4">
        <USkeleton class="h-5 w-8" />
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
            <th class="py-3 px-4">Profesi / Pekerjaan Pengaju</th>
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
            class="transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
            :class="[
              item.total === 0 ? 'opacity-60 bg-gray-50/30 dark:bg-gray-800/20' : ''
            ]"
          >
            <!-- No -->
            <td class="py-2.5 px-4 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
              {{ idx + 1 }}
            </td>

            <!-- Profesi / Pekerjaan -->
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-briefcase" class="w-4 h-4 text-teal-500 shrink-0" />
                <span class="text-sm font-semibold">{{ item.nama }}</span>
              </div>
            </td>

            <!-- Cerai Gugat -->
            <td class="py-2.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
              <button
                v-if="item.ceraiGugat > 0"
                type="button"
                class="hover:underline font-semibold cursor-pointer"
                title="Lihat perkara Cerai Gugat profesi ini"
                @click="openItemDetail(item, 'Cerai Gugat')"
              >
                {{ formatNumber(item.ceraiGugat) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">0</span>
            </td>

            <!-- Cerai Talak -->
            <td class="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
              <button
                v-if="item.ceraiTalak > 0"
                type="button"
                class="hover:underline font-semibold cursor-pointer"
                title="Lihat perkara Cerai Talak profesi ini"
                @click="openItemDetail(item, 'Cerai Talak')"
              >
                {{ formatNumber(item.ceraiTalak) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">0</span>
            </td>

            <!-- Total Perkara -->
            <td class="py-2.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
              <button
                v-if="item.total > 0"
                type="button"
                class="hover:underline text-teal-600 dark:text-teal-400 cursor-pointer text-sm"
                title="Lihat seluruh rincian perkara profesi ini"
                @click="openItemDetail(item, 'all')"
              >
                {{ formatNumber(item.total) }}
              </button>
              <span v-else class="text-gray-400">0</span>
            </td>

            <!-- Kontribusi (%) & Bar -->
            <td class="py-2.5 px-4">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono font-bold text-gray-700 dark:text-gray-300">{{ item.persentase }}%</span>
                  <span class="text-[10px] text-gray-400">dari total</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                    :style="{ width: `${Math.min(item.persentase, 100)}%` }"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Aksi -->
            <td class="py-2.5 px-4 text-center">
              <UButton
                size="2xs"
                color="teal"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :disabled="item.total === 0"
                @click="openItemDetail(item, 'all')"
              >
                Rincian
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="filteredItems.length === 0">
            <td colspan="7" class="py-8 text-center text-gray-500">
              Tidak ada data profesi/pekerjaan yang sesuai dengan filter atau kata kunci.
            </td>
          </tr>
        </tbody>

        <!-- Grand Total Footer -->
        <tfoot class="bg-teal-50/60 dark:bg-teal-950/40 font-bold border-t-2 border-teal-200 dark:border-teal-800 text-gray-900 dark:text-white">
          <tr>
            <td colspan="2" class="py-3 px-4 text-left uppercase text-xs tracking-wider">
              Total Keseluruhan ({{ formatNumber(data?.totalKlasifikasi) }} Profesi)
            </td>
            <td class="py-3 px-4 text-right text-pink-600 dark:text-pink-400 font-mono">
              <button
                type="button"
                class="hover:underline cursor-pointer"
                title="Lihat seluruh perkara Cerai Gugat"
                @click="openGrandDetail('Cerai Gugat')"
              >
                {{ formatNumber(data?.grandCeraiGugat) }}
              </button>
            </td>
            <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-mono">
              <button
                type="button"
                class="hover:underline cursor-pointer"
                title="Lihat seluruh perkara Cerai Talak"
                @click="openGrandDetail('Cerai Talak')"
              >
                {{ formatNumber(data?.grandCeraiTalak) }}
              </button>
            </td>
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                class="text-teal-700 dark:text-teal-400 font-extrabold text-sm hover:underline cursor-pointer"
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
    <ModalDetailPekerjaan />
  </UCard>
</template>

<script setup>
import ModalDetailPekerjaan from './ModalDetailPekerjaan.vue'

const {
  selectedYear,
  selectedJenisCerai,
  selectedMonth,
  refreshSignal,
  formatNumber,
  openDetailModal
} = usePekerjaanPerceraian()

const searchKeyword = ref('')
const sortBy = ref('total_desc')

const sortOptions = [
  { label: 'Total Terbanyak', value: 'total_desc' },
  { label: 'Total Terendah', value: 'total_asc' },
  { label: 'Nama Pekerjaan (A - Z)', value: 'nama_asc' },
  { label: 'Cerai Gugat Terbanyak', value: 'cg_desc' },
  { label: 'Cerai Talak Terbanyak', value: 'ct_desc' }
]

const { data, pending, refresh } = useLazyFetch('/api/pekerjaan-perceraian/tabel', {
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
    items = items.filter(it => it.nama.toLowerCase().includes(kw))
  }

  // Sorting
  switch (sortBy.value) {
    case 'total_desc':
      items.sort((a, b) => b.total - a.total)
      break
    case 'total_asc':
      items.sort((a, b) => a.total - b.total)
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
    default:
      break
  }

  return items
})

const openItemDetail = (item, jenis) => {
  openDetailModal({
    pekerjaan: item.nama,
    pekerjaanNama: item.nama,
    jenisCerai: jenis,
    totalCount: jenis === 'Cerai Gugat' ? item.ceraiGugat : jenis === 'Cerai Talak' ? item.ceraiTalak : item.total
  })
}

const openGrandDetail = (jenis) => {
  const label = jenis === 'Cerai Gugat'
    ? 'Semua Pekerjaan (Cerai Gugat)'
    : jenis === 'Cerai Talak'
      ? 'Semua Pekerjaan (Cerai Talak)'
      : 'Semua Profesi / Pekerjaan Perceraian'

  const count = jenis === 'Cerai Gugat'
    ? data.value?.grandCeraiGugat
    : jenis === 'Cerai Talak'
      ? data.value?.grandCeraiTalak
      : data.value?.grandTotal

  openDetailModal({
    pekerjaan: null,
    pekerjaanNama: label,
    jenisCerai: jenis,
    totalCount: count
  })
}
</script>
