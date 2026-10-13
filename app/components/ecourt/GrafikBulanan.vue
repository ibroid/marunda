<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-primary-500" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Perkara Masuk Bulanan: e-Court vs Konvensional ({{ selectedYear }})
            </h3>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Perbandingan tren volume perkara masuk secara elektronik (e-Court) dan konvensional per bulan
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Legend -->
          <div class="flex items-center gap-3 text-xs font-medium">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-primary-500 inline-block"></span>
              <span class="text-gray-700 dark:text-gray-300">
                e-Court:
                <strong class="text-primary-600 dark:text-primary-400">
                  {{ data?.ringkasan?.totalEcourt || 0 }}
                </strong>
                <span class="text-gray-400 font-normal">({{ data?.ringkasan?.persenEcourtTotal || 0 }}%)</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span>
              <span class="text-gray-700 dark:text-gray-300">
                Konvensional:
                <strong class="text-amber-600 dark:text-amber-400">
                  {{ data?.ringkasan?.totalKonvensional || 0 }}
                </strong>
                <span class="text-gray-400 font-normal">({{ data?.ringkasan?.persenKonvensionalTotal || 0 }}%)</span>
              </span>
            </div>
          </div>

          <!-- View Mode Toggle -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1"
              :class="activeView === 'grafik' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="activeView = 'grafik'"
            >
              <UIcon name="i-heroicons-chart-bar" class="w-3.5 h-3.5" />
              Grafik
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1"
              :class="activeView === 'tabel' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="activeView = 'tabel'"
            >
              <UIcon name="i-heroicons-table-cells" class="w-3.5 h-3.5" />
              Tabel
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div v-if="activeView === 'grafik'" class="h-64 flex items-end justify-between gap-2 p-2 border-b border-gray-100 dark:border-gray-800">
        <div v-for="i in 12" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
          <USkeleton class="w-full rounded-t" :style="{ height: `${20 + ((i * 11) % 65)}%` }" />
          <USkeleton class="h-3 w-6" />
        </div>
      </div>
      <div v-else class="space-y-2 py-2">
        <USkeleton class="h-8 w-full" />
        <USkeleton v-for="i in 6" :key="i" class="h-6 w-full" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <!-- Mode 1: Grafik Batang Komparasi -->
      <div v-if="activeView === 'grafik'" class="space-y-4">
        <div class="h-64 sm:h-72 flex items-end justify-between gap-1.5 sm:gap-2 px-1 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div
            v-for="b in data?.bulanan || []"
            :key="b.bulanNum"
            class="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
            title="Klik untuk melihat rincian perkara bulan ini"
            @click="openModalDetail(b.bulanNum, b.bulanNama)"
          >
            <!-- Tooltip Popover on Hover -->
            <div class="hidden group-hover:flex flex-col items-center absolute -top-20 z-30 bg-gray-900/95 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap border border-gray-700">
              <span class="font-bold text-gray-200 border-b border-gray-700 pb-0.5 mb-1 w-full text-center">
                {{ b.bulanNama }} (Total: {{ b.total }})
              </span>
              <div class="flex items-center gap-2 text-[10px]">
                <span class="flex items-center gap-1 text-primary-300">
                  <span class="w-2 h-2 rounded-full bg-primary-400 inline-block"></span>
                  e-Court: <b>{{ b.ecourt }}</b> ({{ b.persenEcourt }}%)
                </span>
                <span class="text-gray-400">|</span>
                <span class="flex items-center gap-1 text-amber-300">
                  <span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  Konvensional: <b>{{ b.konvensional }}</b> ({{ b.persenKonvensional }}%)
                </span>
              </div>
              <span class="text-[9px] text-gray-400 mt-1 italic">
                Klik untuk melihat rincian perkara
              </span>
            </div>

            <!-- Dual Bars (e-Court vs Konvensional) -->
            <div class="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
              <!-- Bar e-Court -->
              <div class="w-1/2 max-w-[16px] flex flex-col items-center justify-end h-full">
                <div
                  class="w-full bg-primary-500 dark:bg-primary-400 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                  :style="{ height: getBarHeight(b.ecourt) }"
                ></div>
              </div>
              <!-- Bar Konvensional -->
              <div class="w-1/2 max-w-[16px] flex flex-col items-center justify-end h-full">
                <div
                  class="w-full bg-amber-500 dark:bg-amber-400 rounded-t transition-all duration-300 group-hover:bg-amber-600"
                  :style="{ height: getBarHeight(b.konvensional) }"
                ></div>
              </div>
            </div>

            <!-- Month Label -->
            <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
              {{ b.bulanLabel }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>Arahkan kursor atau klik batang untuk membuka rincian perkara bulan tersebut.</span>
          <span class="hidden sm:inline">Total Terdaftar: <strong class="text-gray-900 dark:text-white">{{ data?.ringkasan?.totalSemua || 0 }} Perkara</strong></span>
        </div>
      </div>

      <!-- Mode 2: Tabel Rincian Data Bulanan -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 uppercase border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-2.5 px-3">Bulan</th>
              <th class="py-2.5 px-3 text-right">e-Court</th>
              <th class="py-2.5 px-3 text-right">Konvensional</th>
              <th class="py-2.5 px-3 text-right">Total Masuk</th>
              <th class="py-2.5 px-3 text-center">Rasio e-Court</th>
              <th class="py-2.5 px-3 min-w-[140px]">Komposisi (e-Court vs Konvensional)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="b in data?.bulanan || []"
              :key="b.bulanNum"
              class="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition"
            >
              <!-- Nama Bulan (Clickable Button to Open Modal) -->
              <td class="py-2.5 px-3 font-medium">
                <button
                  type="button"
                  class="text-left font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline flex items-center gap-1.5 group/btn cursor-pointer"
                  title="Klik untuk melihat rincian perkara bulan ini"
                  @click="openModalDetail(b.bulanNum, b.bulanNama)"
                >
                  <span>{{ b.bulanNama }}</span>
                  <UIcon
                    name="i-heroicons-arrow-top-right-on-square"
                    class="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 transition"
                  />
                </button>
              </td>
              <td class="py-2.5 px-3 text-right font-semibold text-primary-600 dark:text-primary-400">
                {{ b.ecourt }}
              </td>
              <td class="py-2.5 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                {{ b.konvensional }}
              </td>
              <td class="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white">
                {{ b.total }}
              </td>
              <td class="py-2.5 px-3 text-center">
                <UBadge
                  :color="b.persenEcourt >= 80 ? 'primary' : (b.persenEcourt >= 50 ? 'blue' : 'amber')"
                  size="xs"
                  variant="subtle"
                >
                  {{ b.persenEcourt }}%
                </UBadge>
              </td>
              <td class="py-2.5 px-3">
                <div v-if="b.total > 0" class="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div
                    class="bg-primary-500 h-full transition-all"
                    :style="{ width: `${b.persenEcourt}%` }"
                    :title="`e-Court: ${b.ecourt} (${b.persenEcourt}%)`"
                  />
                  <div
                    class="bg-amber-500 h-full transition-all"
                    :style="{ width: `${b.persenKonvensional}%` }"
                    :title="`Konvensional: ${b.konvensional} (${b.persenKonvensional}%)`"
                  />
                </div>
                <span v-else class="text-gray-400 text-[11px]">-</span>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 dark:bg-gray-800/80 font-bold border-t-2 border-gray-200 dark:border-gray-700">
            <tr>
              <td class="py-3 px-3 text-gray-900 dark:text-white">
                Total Akumulasi Tahun {{ selectedYear }}
              </td>
              <td class="py-3 px-3 text-right text-primary-600 dark:text-primary-400 text-sm">
                {{ data?.ringkasan?.totalEcourt || 0 }}
              </td>
              <td class="py-3 px-3 text-right text-amber-600 dark:text-amber-400 text-sm">
                {{ data?.ringkasan?.totalKonvensional || 0 }}
              </td>
              <td class="py-3 px-3 text-right text-gray-900 dark:text-white text-sm">
                {{ data?.ringkasan?.totalSemua || 0 }}
              </td>
              <td class="py-3 px-3 text-center">
                <UBadge color="primary" size="xs">
                  {{ data?.ringkasan?.persenEcourtTotal || 0 }}%
                </UBadge>
              </td>
              <td class="py-3 px-3">
                <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div
                    class="bg-primary-500 h-full transition-all"
                    :style="{ width: `${data?.ringkasan?.persenEcourtTotal || 0}%` }"
                  />
                  <div
                    class="bg-amber-500 h-full transition-all"
                    :style="{ width: `${data?.ringkasan?.persenKonvensionalTotal || 0}%` }"
                  />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal, openModalDetail } = useEcourt()
const activeView = ref('grafik')

const { data, pending, refresh } = useLazyFetch('/api/ecourt/grafik', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const maxMonthlyVal = computed(() => {
  let max = 10
  const bulanan = data.value?.bulanan || []
  for (const b of bulanan) {
    if (b.ecourt > max) max = b.ecourt
    if (b.konvensional > max) max = b.konvensional
  }
  return max
})

function getBarHeight(val) {
  if (!val || val <= 0) return '2px'
  const max = maxMonthlyVal.value || 10
  const pct = Math.min(100, Math.round((val / max) * 100))
  return `${Math.max(4, pct)}%`
}

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
