<template>
  <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 text-white rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2">
        <UBadge color="white" variant="solid" size="xs" class="text-emerald-950 font-bold uppercase tracking-wider">
          Statistik Geografi
        </UBadge>
        <span class="text-xs text-emerald-200">Kota Administrasi Jakarta Utara</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight">Penerimaan Perkara Per Wilayah</h2>
      <p class="text-sm text-emerald-100 max-w-2xl">
        {{ namaSatker }} — Pemetaan persebaran penerimaan perkara berdasarkan domisili kecamatan pihak di wilayah hukum Jakarta Utara pada Tahun {{ selectedYear }}.
      </p>
    </div>

    <!-- Filter & Aksi -->
    <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
      <!-- Filter Pihak -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Basis Domisili</label>
        <USelect
          v-model="selectedPihakType"
          :options="pihakOptions"
          size="sm"
          class="w-48 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
        />
      </div>

      <!-- Filter Alur Perkara -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Alur Perkara</label>
        <USelect
          v-model="selectedAlurPerkara"
          :options="alurOptions"
          size="sm"
          class="w-40 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
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
  selectedPihakType,
  selectedAlurPerkara,
  triggerRefresh
} = useStatistikGeografi()

const isRefreshing = ref(false)

const pihakOptions = [
  { label: 'Pihak 1 (Penggugat / Pemohon)', value: 'pihak1' },
  { label: 'Pihak 2 (Tergugat / Termohon)', value: 'pihak2' }
]

const alurOptions = [
  { label: 'Semua Alur', value: 'all' },
  { label: 'Gugatan (Pdt.G)', value: '15' },
  { label: 'Permohonan (Pdt.P)', value: '16' }
]

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 700)
}
</script>
