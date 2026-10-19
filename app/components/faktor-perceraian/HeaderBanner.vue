<template>
  <div class="bg-gradient-to-r from-rose-900 via-pink-900 to-indigo-900 text-white rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2 flex-wrap">
        <UBadge color="white" variant="solid" size="xs" class="text-rose-950 font-bold uppercase tracking-wider">
          Statistik Geografi
        </UBadge>
        <UBadge color="rose" variant="subtle" size="xs" class="text-rose-200 border border-rose-400/30">
          Faktor Perceraian
        </UBadge>
        <span class="text-xs text-rose-200">Pengadilan Agama</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight">Statistik Faktor Perceraian</h2>
      <p class="text-sm text-rose-100 max-w-2xl">
        {{ namaSatker }} — Analisis dan pemetaan faktor penyebab perceraian berdasarkan data akta cerai yang telah diterbitkan pada Tahun {{ selectedYear }}.
      </p>
    </div>

    <!-- Filter & Aksi -->
    <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
      <!-- Filter Jenis Cerai -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-rose-200 uppercase tracking-wider">Jenis Perceraian</label>
        <USelect
          v-model="selectedJenisCerai"
          :options="jenisCeraiOptions"
          size="sm"
          class="w-40 bg-white/10 dark:bg-gray-800/80 text-white border-rose-500/30"
        />
      </div>

      <!-- Filter Bulan -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-medium text-rose-200 uppercase tracking-wider">Periode Bulan</label>
        <USelect
          v-model="selectedMonth"
          :options="monthOptions"
          size="sm"
          class="w-36 bg-white/10 dark:bg-gray-800/80 text-white border-rose-500/30"
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
  selectedJenisCerai,
  selectedMonth,
  triggerRefresh
} = useFaktorPerceraian()

const isRefreshing = ref(false)

const jenisCeraiOptions = [
  { label: 'Semua Jenis Cerai', value: 'all' },
  { label: 'Cerai Gugat (CG)', value: 'Cerai Gugat' },
  { label: 'Cerai Talak (CT)', value: 'Cerai Talak' }
]

const monthOptions = [
  { label: 'Sepanjang Tahun', value: 'all' },
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

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}
</script>
