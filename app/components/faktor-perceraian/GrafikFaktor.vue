<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Chart 1: Komparasi Faktor Perceraian Teratas (2 Kolom) -->
    <UCard class="lg:col-span-2">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Faktor Penyebab Perceraian Terbanyak ({{ selectedYear }})
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Klik pada batang faktor untuk melihat daftar rincian perkaranya
              </p>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-3 text-xs font-medium">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-xs bg-pink-500 inline-block shadow-xs"></span>
              <span>Cerai Gugat</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-xs bg-indigo-500 inline-block shadow-xs"></span>
              <span>Cerai Talak</span>
            </span>
          </div>
        </div>
      </template>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="p-4 space-y-4">
        <div v-for="i in 6" :key="i" class="space-y-1.5">
          <div class="flex justify-between">
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-4 w-16" />
          </div>
          <USkeleton class="h-4 w-full rounded" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!data?.topFaktor || data.topFaktor.length === 0" class="py-12 text-center text-sm text-gray-400">
        Belum ada data akta cerai pada filter terpilih.
      </div>

      <!-- Horizontal Stacked Bar List -->
      <div v-else class="space-y-4 p-2">
        <div
          v-for="item in data.topFaktor"
          :key="item.id"
          class="group p-2.5 rounded-lg transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
          @click="openFaktorDetail(item)"
        >
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {{ item.nama }}
              </span>
              <UBadge color="gray" variant="subtle" size="2xs">
                {{ item.persentase }}%
              </UBadge>
            </div>
            <div class="flex items-center gap-2 font-mono font-bold text-gray-700 dark:text-gray-300">
              <span class="text-pink-600 dark:text-pink-400 text-[11px]">CG: {{ formatNumber(item.ceraiGugat) }}</span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-indigo-600 dark:text-indigo-400 text-[11px]">CT: {{ formatNumber(item.ceraiTalak) }}</span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="text-rose-600 dark:text-rose-400 text-xs">Total {{ formatNumber(item.total) }}</span>
            </div>
          </div>

          <!-- Stacked Progress Bar -->
          <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden flex shadow-inner">
            <!-- Cerai Gugat segment -->
            <div
              class="bg-pink-500 hover:bg-pink-600 transition-all h-full"
              :style="{ width: getSegmentWidth(item.ceraiGugat, maxTotal) }"
              :title="`Cerai Gugat: ${item.ceraiGugat} kasus`"
            />
            <!-- Cerai Talak segment -->
            <div
              class="bg-indigo-500 hover:bg-indigo-600 transition-all h-full"
              :style="{ width: getSegmentWidth(item.ceraiTalak, maxTotal) }"
              :title="`Cerai Talak: ${item.ceraiTalak} kasus`"
            />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Chart 2: Tren Bulanan Perceraian (1 Kolom) -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Tren Bulanan ({{ selectedYear }})
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Penerbitan akta cerai per bulan
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="h-64 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-gray-200 dark:border-gray-700">
        <div v-for="i in 12" :key="i" class="flex-1 flex flex-col items-center justify-end h-full gap-2">
          <USkeleton class="w-full h-32 rounded-t" />
          <USkeleton class="w-4 h-3" />
        </div>
      </div>

      <!-- CSS Bar Chart Tren Bulanan -->
      <div v-else class="h-64 flex items-end gap-1.5 pt-6 pb-2 px-1 border-b border-gray-200 dark:border-gray-700">
        <div
          v-for="(item, idx) in data?.trenBulanan || []"
          :key="item.label"
          class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
          @click="filterOrOpenMonth(item.bulanNumber, item.label, item.total)"
        >
          <!-- Tooltip Popup saat hover -->
          <div class="hidden group-hover:block absolute -top-12 bg-gray-900 text-white text-[11px] py-1 px-2 rounded shadow-md z-20 whitespace-nowrap">
            {{ item.label }}: Total {{ item.total }} (CG: {{ item.ceraiGugat }} | CT: {{ item.ceraiTalak }})
          </div>

          <!-- Total Count di atas batang jika > 0 -->
          <span
            v-if="item.total > 0"
            class="text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 group-hover:text-rose-600 transition-colors"
          >
            {{ item.total }}
          </span>

          <!-- Bar Stacked Container -->
          <div class="w-full flex flex-col justify-end items-center h-full">
            <div
              class="w-full rounded-t transition-all group-hover:opacity-90 flex flex-col justify-end overflow-hidden"
              :style="{ height: getMonthlyHeight(item.total) }"
            >
              <!-- Gugat -->
              <div
                class="w-full bg-pink-500"
                :style="{ height: item.total > 0 ? `${(item.ceraiGugat / item.total) * 100}%` : '0%' }"
              />
              <!-- Talak -->
              <div
                class="w-full bg-indigo-500"
                :style="{ height: item.total > 0 ? `${(item.ceraiTalak / item.total) * 100}%` : '0%' }"
              />
            </div>
          </div>

          <span class="text-[10px] text-gray-400 mt-2 font-medium">{{ item.label }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedJenisCerai,
  selectedMonth,
  refreshSignal,
  formatNumber,
  openDetailModal
} = useFaktorPerceraian()

const { data, pending, refresh } = useLazyFetch('/api/faktor-perceraian/grafik', {
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

// Hitung maksimum total untuk scaling bar chart
const maxTotal = computed(() => {
  if (!data.value?.topFaktor || data.value.topFaktor.length === 0) return 1
  return Math.max(...data.value.topFaktor.map(i => i.total || 0), 1)
})

const maxMonthly = computed(() => {
  if (!data.value?.trenBulanan || data.value.trenBulanan.length === 0) return 1
  return Math.max(...data.value.trenBulanan.map(i => i.total || 0), 1)
})

function getSegmentWidth(val, max) {
  if (!val || !max) return '0%'
  return `${Math.min(100, Math.round((val / max) * 100))}%`
}

function getMonthlyHeight(val) {
  if (!val || !maxMonthly.value) return '4px'
  const pct = Math.max(8, Math.round((val / maxMonthly.value) * 100))
  return `${pct}%`
}

function openFaktorDetail(item) {
  openDetailModal({
    faktorId: item.id > 0 ? item.id : null,
    faktorNama: item.nama,
    jenisCerai: selectedJenisCerai.value,
    totalCount: item.total
  })
}

function filterOrOpenMonth(bulanNum, bulanLabel, total) {
  if (total > 0) {
    selectedMonth.value = String(bulanNum)
    openDetailModal({
      faktorId: null,
      faktorNama: `Perceraian Bulan ${bulanLabel} ${selectedYear.value}`,
      jenisCerai: selectedJenisCerai.value,
      totalCount: total
    })
  }
}
</script>
