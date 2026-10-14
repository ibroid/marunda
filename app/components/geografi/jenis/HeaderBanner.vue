<template>
  <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 text-white rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 flex-wrap">
        <UBadge color="white" variant="solid" size="xs" class="text-emerald-950 font-bold uppercase tracking-wider">
          Statistik Geografi
        </UBadge>
        <UBadge color="emerald" variant="subtle" size="xs" class="text-emerald-200 border border-emerald-400/30">
          Jenis Perkara (ID 341 - 371)
        </UBadge>
        <span class="text-xs text-emerald-200">Pengadilan Agama</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight">Total Perkara Berdasarkan Jenis Perkara</h2>
      <p class="text-sm text-emerald-100 max-w-2xl">
        {{ namaSatker }} — Rekapitulasi dan pemetaan beban perkara berdasarkan 30 klasifikasi jenis perkara Pengadilan Agama pada Tahun {{ selectedYear }}.
      </p>
    </div>

    <!-- Filter & Aksi -->
    <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
      <!-- Filter Kecamatan / Wilayah -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Wilayah Hukum</label>
        <USelect
          v-model="selectedKecamatan"
          :options="kecamatanOptions"
          size="sm"
          class="w-44 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
          @change="onKecamatanChange"
        />
      </div>

      <!-- Filter Pihak -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Basis Domisili</label>
        <USelect
          v-model="selectedPihakType"
          :options="pihakOptions"
          size="sm"
          class="w-44 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
        />
      </div>

      <!-- Filter Alur Perkara -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Alur Perkara</label>
        <USelect
          v-model="selectedAlurPerkara"
          :options="alurOptions"
          size="sm"
          class="w-36 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
        />
      </div>

      <!-- Tombol Refresh -->
      <div class="flex flex-col gap-1 self-end">
        <span class="text-[11px] opacity-0 select-none">Aksi</span>
        <UButton
          icon="i-heroicons-arrow-path"
          color="white"
          variant="solid"
          size="sm"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui Data
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  selectedYear,
  namaSatker,
  selectedAlurPerkara,
  selectedPihakType,
  selectedKecamatan,
  selectedKecamatanNama,
  triggerRefresh
} = useStatistikJenisPerkara()

const isRefreshing = ref(false)

const kecamatanOptions = [
  { label: 'Semua Wilayah Satker', value: '' },
  { label: 'Cilincing (Jakut)', value: 'Cilincing' },
  { label: 'Koja (Jakut)', value: 'Koja' },
  { label: 'Kelapa Gading (Jakut)', value: 'Kelapa Gading' },
  { label: 'Tanjung Priok (Jakut)', value: 'Tanjung Priok' },
  { label: 'Pademangan (Jakut)', value: 'Pademangan' },
  { label: 'Penjaringan (Jakut)', value: 'Penjaringan' },
  { label: 'Kep. Seribu Utara', value: 'Kepulauan Seribu Utara' },
  { label: 'Kep. Seribu Selatan', value: 'Kepulauan Seribu Selatan' }
]

const pihakOptions = [
  { label: 'Pihak 1 (Penggugat / Pemohon)', value: 'pihak1' },
  { label: 'Pihak 2 (Tergugat / Termohon)', value: 'pihak2' }
]

const alurOptions = [
  { label: 'Semua Alur', value: 'all' },
  { label: 'Gugatan (Pdt.G)', value: '15' },
  { label: 'Permohonan (Pdt.P)', value: '16' }
]

function onKecamatanChange() {
  const match = kecamatanOptions.find(k => k.value === selectedKecamatan.value)
  selectedKecamatanNama.value = match?.label || ''
}

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 700)
}
</script>
