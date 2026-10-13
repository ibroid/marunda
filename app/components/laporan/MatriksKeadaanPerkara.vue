<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Data Tabel {{ activeLipaItem?.shortTitle }}
            </h3>
            <UBadge size="xs" color="gray" variant="solid" class="font-mono">
              {{ activeLipaItem?.code }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">
            Periode: {{ selectedMonthLabel }} {{ selectedYear }} &bull; Total {{ tableRows.length }} baris data
          </p>
        </div>

        <div class="flex items-center gap-2">
          <UInput
            v-model="localSearch"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari dalam tabel..."
            size="xs"
            class="w-52"
            :ui="{ icon: { trailing: { pointer: '' } } }"
          >
            <template #trailing>
              <UButton
                v-show="localSearch"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="localSearch = ''"
              />
            </template>
          </UInput>
        </div>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Table Columns -->
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 font-semibold">
          <tr>
            <th
              v-for="col in tableColumns"
              :key="col.key"
              class="px-3.5 py-3 whitespace-nowrap"
              :class="[
                col.align === 'center' ? 'text-center' : (col.align === 'right' ? 'text-right' : 'text-left')
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td
              v-for="col in (tableColumns.length ? tableColumns : 6)"
              :key="col.key || col"
              class="px-3.5 py-3.5"
            >
              <USkeleton class="h-3.5 w-16 mx-auto" />
            </td>
          </tr>
        </tbody>

        <!-- Empty Rows State -->
        <tbody v-else-if="filteredRows.length === 0" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td :colspan="tableColumns.length || 6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p class="font-medium">Tidak ada data untuk laporan ini pada periode {{ selectedMonthLabel }} {{ selectedYear }}</p>
              <p class="text-xs text-gray-400 mt-1">Data perkara mungkin belum diinput atau nihil untuk bulan terkait</p>
            </td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(row, rIdx) in filteredRows"
            :key="rIdx"
            class="transition-colors"
            :class="[
              row.isTotal
                ? 'bg-gray-100/80 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
            ]"
          >
            <td
              v-for="col in tableColumns"
              :key="col.key"
              class="px-3.5 py-2.5 whitespace-nowrap"
              :class="[
                col.align === 'center' ? 'text-center' : (col.align === 'right' ? 'text-right' : 'text-left'),
                row.isTotal ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              ]"
            >
              <!-- Format Badge -->
              <template v-if="col.format === 'badge'">
                <UBadge
                  size="xs"
                  :color="getBadgeColor(row[col.key])"
                  variant="subtle"
                >
                  {{ row[col.key] ?? '-' }}
                </UBadge>
              </template>

              <!-- Format Currency -->
              <template v-else-if="col.format === 'currency'">
                <span class="font-mono">
                  Rp {{ formatNumber(row[col.key]) }}
                </span>
              </template>

              <!-- Format Number -->
              <template v-else-if="col.format === 'number'">
                <span class="font-medium">
                  {{ formatNumber(row[col.key]) }}
                </span>
              </template>

              <!-- Format Date -->
              <template v-else-if="col.format === 'date'">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(row[col.key]) }}
                </span>
              </template>

              <!-- Default Plain Text -->
              <template v-else>
                <span :class="{ 'font-semibold text-gray-900 dark:text-white': col.key.includes('nomor') || col.key.includes('jenis') }">
                  {{ row[col.key] ?? '-' }}
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  selectedLipa,
  activeLipaItem,
  refreshSignal,
  sharedReportData,
  selectedMonthLabel
} = useLaporan()

const localSearch = ref('')

const { data, pending, refresh } = useLazyFetch('/api/laporan/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis: selectedLipa.value
  })),
  watch: [selectedYear, selectedMonth, selectedLipa],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const tableColumns = computed(() => {
  return data.value?.columns || []
})

const tableRows = computed(() => {
  return data.value?.rows || []
})

const filteredRows = computed(() => {
  if (!localSearch.value.trim()) return tableRows.value

  const q = localSearch.value.toLowerCase()
  return tableRows.value.filter((row) => {
    return Object.values(row).some((val) => {
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(q)
    })
  })
})

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}

function formatDate(dateVal) {
  if (!dateVal || dateVal === '0000-00-00') return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return String(dateVal)
  }
}

function getBadgeColor(val) {
  if (!val) return 'gray'
  const str = String(val).toLowerCase()
  if (str.includes('selesai') || str.includes('damai') || str.includes('sudah') || str.includes('putus')) {
    return 'emerald'
  }
  if (str.includes('proses') || str.includes('persiapan') || str.includes('sebagian')) {
    return 'blue'
  }
  if (str.includes('tidak') || str.includes('gagal') || str.includes('belum')) {
    return 'amber'
  }
  if (str.includes('%')) {
    const num = parseInt(str)
    if (num >= 80) return 'emerald'
    if (num >= 50) return 'blue'
    return 'amber'
  }
  return 'primary'
}

watch(data, (newVal) => {
  if (newVal?.rows) {
    sharedReportData.value = {
      rows: newVal.rows,
      columns: newVal.columns
    }
  }
})

watch([selectedYear, selectedMonth, selectedLipa], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
