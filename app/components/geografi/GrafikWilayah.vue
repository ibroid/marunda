<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Grafik Komparasi Perkara Antar Kecamatan ({{ selectedYear }})
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Klik pada batang <b>Gugatan (Biru)</b> atau <b>Permohonan (Ungu)</b> untuk memfilter data perkara di tabel
            </p>
          </div>
        </div>

        <!-- Legend Warna & Status Filter Aktif -->
        <div class="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span class="flex items-center gap-1.5 cursor-pointer hover:opacity-80" @click="setAlur('15')">
            <span class="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-xs"></span>
            <span>Gugatan (Pdt.G)</span>
          </span>
          <span class="flex items-center gap-1.5 cursor-pointer hover:opacity-80" @click="setAlur('16')">
            <span class="w-3 h-3 rounded-xs bg-purple-600 inline-block shadow-xs"></span>
            <span>Permohonan (Pdt.P)</span>
          </span>

          <!-- Badge Status Terpilih -->
          <UBadge
            v-if="selectedKecamatan"
            color="emerald"
            variant="subtle"
            size="xs"
            class="flex items-center gap-1 ml-1"
          >
            <span>
              Aktif: {{ selectedKecamatanNama || selectedKecamatan }}
              <template v-if="selectedAlurPerkara === '15'"> • Gugatan</template>
              <template v-else-if="selectedAlurPerkara === '16'"> • Permohonan</template>
              <template v-else> • Semua</template>
            </span>
            <button
              type="button"
              class="ml-0.5 hover:text-red-500 font-bold"
              title="Reset Pilihan"
              @click.stop="resetPilihan"
            >
              ✕
            </button>
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-gray-200 dark:border-gray-700">
      <div v-for="i in 6" :key="i" class="flex-1 flex flex-col items-center justify-end h-full gap-2">
        <USkeleton class="w-full h-40 rounded-t" />
        <USkeleton class="w-12 h-3" />
      </div>
    </div>

    <!-- Grafik Komparasi Kecamatan Interaktif -->
    <div v-else class="space-y-4">
      <div class="h-64 flex items-end gap-3 sm:gap-6 pt-8 pb-2 px-2 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div
          v-for="(kecNama, idx) in data?.komparasi?.labels || []"
          :key="kecNama"
          class="flex-1 flex flex-col items-center h-full justify-end relative"
        >
          <!-- Total Value di atas batang (klik untuk tampilkan semua alur kecamatan ini) -->
          <button
            type="button"
            class="text-xs font-bold mb-1 transition-all px-1.5 py-0.5 rounded-sm"
            :class="[
              selectedKecamatan === kecNama && selectedAlurPerkara === 'all'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500 scale-105'
                : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
            :title="`Klik untuk melihat seluruh perkara (${data?.komparasi?.total[idx]}) di Kecamatan ${kecNama}`"
            @click="handleSectionClick(kecNama, 'all')"
          >
            {{ data?.komparasi?.total[idx] }}
          </button>

          <!-- Bars Container (Stacked Bar: Permohonan di atas, Gugatan di bawah) -->
          <div class="w-full max-w-[54px] flex flex-col justify-end items-center h-full">
            <div
              class="w-full rounded-t-md overflow-hidden flex flex-col justify-end shadow-xs transition-all duration-300"
              :class="[
                selectedKecamatan === kecNama
                  ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md'
                  : ''
              ]"
              :style="{ height: getBarHeight(data?.komparasi?.total[idx]) }"
            >
              <!-- 1. Bagian Permohonan (Pdt.P) - Warna Ungu (Purple) -->
              <button
                v-if="data?.komparasi?.permohonan[idx] > 0"
                type="button"
                class="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition-all cursor-pointer relative group/permohonan flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                :class="[
                  isSelected(kecNama, '16')
                    ? 'ring-2 ring-white ring-inset brightness-125 z-10'
                    : 'hover:brightness-110'
                ]"
                :style="{
                  height: getPortionHeight(data?.komparasi?.permohonan[idx], data?.komparasi?.total[idx]),
                  minHeight: '16px'
                }"
                :title="`Klik untuk melihat ${data?.komparasi?.permohonan[idx]} perkara PERMOHONAN di ${kecNama}`"
                @click.stop="handleSectionClick(kecNama, '16')"
              >
                <!-- Tooltip Popup Permohonan -->
                <div class="hidden group-hover/permohonan:block absolute -top-12 bg-gray-900 text-white text-[11px] py-1 px-2.5 rounded shadow-lg z-30 whitespace-nowrap pointer-events-none">
                  <span class="text-purple-300 font-bold">Permohonan: {{ data?.komparasi?.permohonan[idx] }}</span> (Klik untuk lihat)
                </div>

                <span v-if="getPortionPct(data?.komparasi?.permohonan[idx], data?.komparasi?.total[idx]) >= 18" class="truncate px-0.5 pointer-events-none">
                  {{ data?.komparasi?.permohonan[idx] }}
                </span>
              </button>

              <!-- 2. Bagian Gugatan (Pdt.G) - Warna Biru (Blue) -->
              <button
                v-if="data?.komparasi?.gugatan[idx] > 0"
                type="button"
                class="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all cursor-pointer relative group/gugatan flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                :class="[
                  isSelected(kecNama, '15')
                    ? 'ring-2 ring-white ring-inset brightness-125 z-10'
                    : 'hover:brightness-110'
                ]"
                :style="{
                  height: getPortionHeight(data?.komparasi?.gugatan[idx], data?.komparasi?.total[idx]),
                  minHeight: '16px'
                }"
                :title="`Klik untuk melihat ${data?.komparasi?.gugatan[idx]} perkara GUGATAN di ${kecNama}`"
                @click.stop="handleSectionClick(kecNama, '15')"
              >
                <!-- Tooltip Popup Gugatan -->
                <div class="hidden group-hover/gugatan:block absolute -top-12 bg-gray-900 text-white text-[11px] py-1 px-2.5 rounded shadow-lg z-30 whitespace-nowrap pointer-events-none">
                  <span class="text-blue-300 font-bold">Gugatan: {{ data?.komparasi?.gugatan[idx] }}</span> (Klik untuk lihat)
                </div>

                <span v-if="getPortionPct(data?.komparasi?.gugatan[idx], data?.komparasi?.total[idx]) >= 18" class="truncate px-0.5 pointer-events-none">
                  {{ data?.komparasi?.gugatan[idx] }}
                </span>
              </button>
            </div>
          </div>

          <!-- Label Nama Kecamatan (klik untuk tampilkan semua alur kecamatan ini) -->
          <button
            type="button"
            class="text-[11px] font-medium mt-2.5 truncate max-w-[85px] sm:max-w-none text-center transition-colors cursor-pointer px-1 py-0.5 rounded-sm"
            :class="[
              selectedKecamatan === kecNama
                ? 'text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-4'
                : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
            ]"
            :title="`Klik untuk melihat semua perkara di ${kecNama}`"
            @click="handleSectionClick(kecNama, 'all')"
          >
            {{ kecNama }}
          </button>
        </div>
      </div>

      <!-- Keterangan Panduan Interaksi -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2 gap-2">
        <span class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4 text-emerald-500 shrink-0" />
          <span><b>Petunjuk:</b> Klik batang <span class="text-blue-600 dark:text-blue-400 font-semibold">Gugatan (Biru)</span> atau <span class="text-purple-600 dark:text-purple-400 font-semibold">Permohonan (Ungu)</span> pada kecamatan untuk langsung menampilkan perkaranya di tabel bawah.</span>
        </span>
        <div class="flex items-center gap-3 shrink-0">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-xs bg-blue-600"></span> Gugatan (Pdt.G)</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-xs bg-purple-600"></span> Permohonan (Pdt.P)</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  selectedPihakType,
  selectedAlurPerkara,
  selectedKecamatan,
  selectedKecamatanNama,
  refreshSignal,
  setKecamatanDanAlur,
  resetFilter
} = useStatistikGeografi()

const { data, pending, refresh } = useLazyFetch('/api/geografi/grafik', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    pihak_type: selectedPihakType.value
  })),
  watch: [selectedYear, selectedPihakType],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

// Kalkulasi tinggi batang komparasi
const maxTotal = computed(() => {
  const totals = data.value?.komparasi?.total || []
  if (!totals.length) return 100
  return Math.max(...totals, 1)
})

function getBarHeight(val) {
  if (!val || !maxTotal.value) return '6px'
  const pct = Math.min(100, Math.max(6, Math.round((val / maxTotal.value) * 100)))
  return `${pct}%`
}

function getPortionHeight(part, total) {
  if (!part || !total) return '0%'
  const pct = Math.round((part / total) * 100)
  return `${pct}%`
}

function getPortionPct(part, total) {
  if (!part || !total) return 0
  return Math.round((part / total) * 100)
}

function isSelected(kecNama, alur) {
  return selectedKecamatan.value === kecNama && selectedAlurPerkara.value === alur
}

function setAlur(alur) {
  selectedAlurPerkara.value = alur
}

function resetPilihan() {
  resetFilter()
}

function handleSectionClick(kecNama, alur = 'all') {
  setKecamatanDanAlur(kecNama, kecNama, alur)
  nextTick(() => {
    const el = document.getElementById('tabel-detail-perkara')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

watch(refreshSignal, () => {
  refresh()
})
</script>
