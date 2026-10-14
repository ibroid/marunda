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
              Data Penerimaan Perkara Per Kecamatan (Jakarta Utara)
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Rincian beban penerimaan perkara di 6 kecamatan wilayah Jakarta Utara (klik angka untuk rincian)
            </p>
          </div>
        </div>

        <div v-if="selectedKecamatan" class="flex items-center gap-2">
          <UBadge color="emerald" variant="subtle" size="sm" class="flex items-center gap-1">
            <span>
              Filter: {{ selectedKecamatanNama || selectedKecamatan }}
              <template v-if="selectedAlurPerkara === '15'"> • Gugatan</template>
              <template v-else-if="selectedAlurPerkara === '16'"> • Permohonan</template>
            </span>
            <button
              type="button"
              class="ml-1 hover:text-emerald-950 dark:hover:text-white font-bold"
              @click="resetFilter"
            >
              ✕
            </button>
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="p-4 space-y-3">
      <div v-for="i in 6" :key="i" class="flex items-center gap-4">
        <USkeleton class="h-5 w-8" />
        <USkeleton class="h-5 w-24" />
        <USkeleton class="h-5 w-32" />
        <USkeleton class="h-5 flex-1" />
        <USkeleton class="h-5 w-16" />
      </div>
    </div>

    <!-- Real Content Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-3 px-4 w-12 text-center">No</th>
            <th class="py-3 px-4 w-28">Kode</th>
            <th class="py-3 px-4">Nama Kecamatan</th>
            <th class="py-3 px-4 text-right">Gugatan (Biru)</th>
            <th class="py-3 px-4 text-right">Permohonan (Ungu)</th>
            <th class="py-3 px-4 text-right">Total Perkara</th>
            <th class="py-3 px-4 w-48">Kontribusi Wilayah</th>
            <th class="py-3 px-4">Perkara Dominan</th>
            <th class="py-3 px-4 text-center w-28">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
          <template v-for="(item, idx) in data?.items || []" :key="item.kode">
            <tr
              class="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
              :class="[
                selectedKecamatan === item.kode || selectedKecamatan === item.nama
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-500/30 font-semibold'
                  : ''
              ]"
            >
              <td class="py-3.5 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {{ idx + 1 }}
              </td>
              <td class="py-3.5 px-4">
                <UBadge color="gray" variant="subtle" size="xs">
                  {{ item.kode }}
                </UBadge>
              </td>
              <td class="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                <button
                  type="button"
                  class="flex items-center gap-1.5 hover:text-emerald-600 transition-colors text-left"
                  title="Lihat semua perkara kecamatan ini"
                  @click="pilihKecamatan(item, 'all')"
                >
                  <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{{ item.nama }}</span>
                </button>
              </td>
              <td class="py-3.5 px-4 text-right">
                <button
                  type="button"
                  class="text-blue-600 dark:text-blue-400 font-semibold hover:underline hover:bg-blue-50 dark:hover:bg-blue-950/50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  :class="[
                    (selectedKecamatan === item.kode || selectedKecamatan === item.nama) && selectedAlurPerkara === '15'
                      ? 'ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-950/70 font-bold'
                      : ''
                  ]"
                  title="Klik untuk melihat perkara Gugatan"
                  @click="pilihKecamatan(item, '15')"
                >
                  {{ formatNumber(item.gugatan) }}
                </button>
              </td>
              <td class="py-3.5 px-4 text-right">
                <button
                  type="button"
                  class="text-purple-600 dark:text-purple-400 font-semibold hover:underline hover:bg-purple-50 dark:hover:bg-purple-950/50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  :class="[
                    (selectedKecamatan === item.kode || selectedKecamatan === item.nama) && selectedAlurPerkara === '16'
                      ? 'ring-1 ring-purple-500 bg-purple-50 dark:bg-purple-950/70 font-bold'
                      : ''
                  ]"
                  title="Klik untuk melihat perkara Permohonan"
                  @click="pilihKecamatan(item, '16')"
                >
                  {{ formatNumber(item.permohonan) }}
                </button>
              </td>
              <td class="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                <button
                  type="button"
                  class="hover:underline hover:text-emerald-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  title="Klik untuk melihat seluruh perkara kecamatan ini"
                  @click="pilihKecamatan(item, 'all')"
                >
                  {{ formatNumber(item.total) }}
                </button>
              </td>
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400 font-medium">{{ item.persentase }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      :style="{ width: `${item.persentase}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="jp in item.topJenisPerkara || []"
                    :key="jp.nama"
                    color="gray"
                    variant="subtle"
                    size="2xs"
                  >
                    {{ jp.nama }}: {{ jp.total }}
                  </UBadge>
                </div>
              </td>
              <td class="py-3.5 px-4 text-center">
                <UButton
                  size="2xs"
                  :color="selectedKecamatan === item.kode || selectedKecamatan === item.nama ? 'emerald' : 'gray'"
                  :variant="selectedKecamatan === item.kode || selectedKecamatan === item.nama ? 'solid' : 'outline'"
                  icon="i-heroicons-magnifying-glass"
                  @click="toggleKecamatan(item)"
                >
                  {{ selectedKecamatan === item.kode || selectedKecamatan === item.nama ? 'Aktif' : 'Lihat' }}
                </UButton>
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot class="bg-gray-50 dark:bg-gray-800/80 font-bold border-t border-gray-200 dark:border-gray-700">
          <tr>
            <td colspan="3" class="py-3 px-4 text-right text-gray-900 dark:text-white">
              Total Seluruh Jakarta Utara:
            </td>
            <td class="py-3 px-4 text-right text-blue-700 dark:text-blue-300">
              {{ formatNumber(totalGugatanSemua) }}
            </td>
            <td class="py-3 px-4 text-right text-purple-700 dark:text-purple-300">
              {{ formatNumber(totalPermohonanSemua) }}
            </td>
            <td class="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300">
              {{ formatNumber(data?.totalSemuaJakut) }}
            </td>
            <td class="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
              100.0%
            </td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
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
  setKecamatanFilter,
  setKecamatanDanAlur,
  resetFilter,
  formatNumber
} = useStatistikGeografi()

const { data, pending, refresh } = useLazyFetch('/api/geografi/wilayah', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    pihak_type: selectedPihakType.value,
    alur: selectedAlurPerkara.value
  })),
  watch: [selectedYear, selectedPihakType, selectedAlurPerkara],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const totalGugatanSemua = computed(() => {
  return (data.value?.items || []).reduce((acc, curr) => acc + (curr.gugatan || 0), 0)
})

const totalPermohonanSemua = computed(() => {
  return (data.value?.items || []).reduce((acc, curr) => acc + (curr.permohonan || 0), 0)
})

function pilihKecamatan(item, alur = 'all') {
  setKecamatanDanAlur(item.kode, item.nama, alur)
  scrollToDetail()
}

function toggleKecamatan(item) {
  setKecamatanFilter(item.kode, item.nama)
  if (selectedKecamatan.value) {
    scrollToDetail()
  }
}

function scrollToDetail() {
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
