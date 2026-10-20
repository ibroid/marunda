<template>
  <div class="bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-emerald-900/50">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 flex-wrap">
        <UBadge color="white" variant="solid" size="xs" class="text-teal-950 font-bold uppercase tracking-wider">
          Statistik Geografi
        </UBadge>
        <UBadge color="emerald" variant="subtle" size="xs" class="text-emerald-200 border border-emerald-400/30">
          Pendidikan Dispensasi
        </UBadge>
        <span class="text-xs text-emerald-200">Pengadilan Agama</span>
      </div>
      <div class="flex items-center gap-2.5">
        <UIcon name="i-heroicons-academic-cap" class="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 class="text-2xl font-bold tracking-tight">Statistik Pendidikan Dispensasi Nikah</h2>
      </div>
      <p class="text-sm text-emerald-100 max-w-2xl">
        {{ namaSatker }} — Data perkara Dispensasi Nikah / Kawin berdasarkan tingkat pendidikan anak yang diajukan pada Tahun {{ selectedYear }}.
      </p>
    </div>

    <!-- Filter & Aksi -->
    <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
      <!-- Filter Kategori Anak / Mempelai -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Kategori Subjek</label>
        <USelect
          v-model="selectedKategori"
          :options="kategoriOptions"
          size="sm"
          class="w-48 bg-white/10 dark:bg-gray-800/80 text-white border-emerald-500/30"
        />
      </div>

      <!-- Filter Bulan -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Periode Bulan</label>
        <USelect
          v-model="selectedMonth"
          :options="monthOptions"
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
  selectedKategori,
  selectedMonth,
  triggerRefresh
} = usePendidikanDispensasi()

const isRefreshing = ref(false)

const kategoriOptions = [
  { label: 'Semua Calon Mempelai', value: 'all' },
  { label: 'Anak Dimohonkan (< 19 Thn)', value: 'anak' },
  { label: 'Calon Suami (Laki-laki)', value: 'pria' },
  { label: 'Calon Istri (Perempuan)', value: 'wanita' }
]

const monthOptions = [
  { label: 'Semua Bulan (Tahunan)', value: 'all' },
  { label: 'Januari', value: '1' },
  { label: 'Februari', value: '2' },
  { label: 'Maret', value: '3' },
  { label: 'April', value: '4' },
  { label: 'Mei', value: '5' },
  { label: 'Juni', value: '6' },
  { label: 'Juli', value: '7' },
  { label: 'Agustus', value: '8' },
  { label: 'September', value: '9' },
  { label: 'Oktober', value: '10' },
  { label: 'November', value: '11' },
  { label: 'Desember', value: '12' }
]

const handleRefresh = async () => {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}
</script>
