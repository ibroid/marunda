<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-table-cells" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Tabel Rekapitulasi Tingkat Pendidikan Anak Dispensasi Nikah ({{ selectedYear }})
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Klasifikasi total perkara dan calon mempelai berdasarkan tingkat pendidikan anak yang diajukan
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
            class="w-44"
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
            <th class="py-3 px-4">Tingkat Pendidikan Anak</th>
            <th class="py-3 px-4 text-right">Calon Suami (L)</th>
            <th class="py-3 px-4 text-right">Calon Istri (P)</th>
            <th class="py-3 px-4 text-right font-semibold">Total Anak</th>
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
              item.totalAnak === 0 && item.totalPerkara === 0 ? 'opacity-60 bg-gray-50/30 dark:bg-gray-800/20' : ''
            ]"
          >
            <!-- No -->
            <td class="py-2.5 px-4 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
              {{ idx + 1 }}
            </td>

            <!-- Kode -->
            <td class="py-2.5 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                {{ item.kode }}
              </span>
            </td>

            <!-- Tingkat Pendidikan -->
            <td class="py-2.5 px-4 font-medium text-gray-900 dark:text-white">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ item.nama }}</span>
              </div>
            </td>

            <!-- Calon Suami -->
            <td class="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
              <button
                v-if="item.calonSuami > 0"
                class="hover:underline font-semibold cursor-pointer"
                title="Lihat perkara calon suami (laki-laki)"
                @click="openModal(item, 'pria')"
              >
                {{ formatNumber(item.calonSuami) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Calon Istri -->
            <td class="py-2.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
              <button
                v-if="item.calonIstri > 0"
                class="hover:underline font-semibold cursor-pointer"
                title="Lihat perkara calon istri (perempuan)"
                @click="openModal(item, 'wanita')"
              >
                {{ formatNumber(item.calonIstri) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">-</span>
            </td>

            <!-- Total Anak -->
            <td class="py-2.5 px-4 text-right font-mono font-semibold text-teal-600 dark:text-teal-400">
              <button
                v-if="item.totalAnak > 0"
                class="hover:underline cursor-pointer"
                title="Lihat seluruh calon mempelai"
                @click="openModal(item, 'all')"
              >
                {{ formatNumber(item.totalAnak) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">0</span>
            </td>

            <!-- Total Perkara -->
            <td class="py-2.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
              <button
                v-if="item.totalPerkara > 0"
                class="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                title="Lihat rincian perkara"
                @click="openModal(item, 'all')"
              >
                {{ formatNumber(item.totalPerkara) }}
              </button>
              <span v-else class="text-gray-300 dark:text-gray-600">0</span>
            </td>

            <!-- Persentase & Progress -->
            <td class="py-2.5 px-4">
              <div class="flex items-center gap-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                    :style="{ width: `${Math.min(item.persentase || 0, 100)}%` }"
                  ></div>
                </div>
                <span class="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                  {{ item.persentase }}%
                </span>
              </div>
            </td>

            <!-- Aksi -->
            <td class="py-2.5 px-4 text-center">
              <UButton
                size="2xs"
                color="emerald"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :disabled="item.totalAnak === 0 && item.totalPerkara === 0"
                @click="openModal(item, 'all')"
              >
                Rincian
              </UButton>
            </td>
          </tr>
        </tbody>

        <!-- Table Footer / Grand Total -->
        <tfoot class="bg-gray-50 dark:bg-gray-800/80 font-semibold text-gray-900 dark:text-white border-t-2 border-gray-300 dark:border-gray-600">
          <tr>
            <td colspan="3" class="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider">
              Total Keseluruhan:
            </td>
            <td class="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ formatNumber(data?.grandTotal?.calonSuami) }}
            </td>
            <td class="py-3 px-4 text-right font-mono font-bold text-pink-600 dark:text-pink-400">
              {{ formatNumber(data?.grandTotal?.calonIstri) }}
            </td>
            <td class="py-3 px-4 text-right font-mono font-bold text-teal-600 dark:text-teal-400">
              {{ formatNumber(data?.grandTotal?.totalAnak) }}
            </td>
            <td class="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {{ formatNumber(data?.grandTotal?.totalPerkara) }}
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <div class="w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                </div>
                <span class="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                  100%
                </span>
              </div>
            </td>
            <td class="py-3 px-4 text-center">
              <UButton
                size="2xs"
                color="gray"
                variant="ghost"
                @click="openAllPerkara"
              >
                Lihat Semua
              </UButton>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  selectedKategori,
  refreshSignal,
  formatNumber,
  openDetailModal
} = usePendidikanDispensasi()

const searchKeyword = ref('')
const sortBy = ref('totalAnakDesc')

const sortOptions = [
  { label: 'Total Anak Terbanyak', value: 'totalAnakDesc' },
  { label: 'Total Perkara Terbanyak', value: 'totalPerkaraDesc' },
  { label: 'Calon Suami Terbanyak', value: 'calonSuamiDesc' },
  { label: 'Calon Istri Terbanyak', value: 'calonIstriDesc' },
  { label: 'Urutan Jenjang Pendidikan', value: 'idAsc' }
]

const { data, pending, refresh } = useLazyFetch('/api/pendidikan-dispensasi/tabel', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    kategori: selectedKategori.value,
    _t: refreshSignal.value
  })),
  watch: [refreshSignal, selectedYear, selectedMonth, selectedKategori],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const filteredItems = computed(() => {
  if (!data.value?.list) return []
  let items = [...data.value.list]

  // Filter keyword
  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase().trim()
    items = items.filter(i =>
      i.nama.toLowerCase().includes(q) ||
      i.kode.toLowerCase().includes(q)
    )
  }

  // Sorting
  items.sort((a, b) => {
    if (sortBy.value === 'totalAnakDesc') {
      return (b.totalAnak || 0) - (a.totalAnak || 0) || (b.totalPerkara || 0) - (a.totalPerkara || 0)
    }
    if (sortBy.value === 'totalPerkaraDesc') {
      return (b.totalPerkara || 0) - (a.totalPerkara || 0) || (b.totalAnak || 0) - (a.totalAnak || 0)
    }
    if (sortBy.value === 'calonSuamiDesc') {
      return (b.calonSuami || 0) - (a.calonSuami || 0)
    }
    if (sortBy.value === 'calonIstriDesc') {
      return (b.calonIstri || 0) - (a.calonIstri || 0)
    }
    return (a.id || 0) - (b.id || 0)
  })

  return items
})

const openModal = (item, overrideKategori = null) => {
  openDetailModal({
    pendidikanId: item.id,
    pendidikanKode: item.kode,
    pendidikanNama: item.nama,
    kategori: overrideKategori || selectedKategori.value,
    totalCount: item.totalAnak || item.totalPerkara || 0
  })
}

const openAllPerkara = () => {
  openDetailModal({
    pendidikanId: null,
    pendidikanKode: '',
    pendidikanNama: 'Semua Tingkat Pendidikan',
    kategori: selectedKategori.value,
    totalCount: data.value?.grandTotal?.totalAnak || 0
  })
}
</script>
