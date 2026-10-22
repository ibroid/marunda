<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-4">
    <!-- Judul Header Dokumen LIPA 2 -->
    <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="space-y-1 text-center md:text-left">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
          Laporan Perkara Yang Dimohonkan Banding
        </h1>
        <p class="text-sm sm:text-base font-semibold text-primary-600 dark:text-primary-400 uppercase">
          Pada {{ namaSatker }}
        </p>
        <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase">
          Bulan {{ getNamaBulan(selectedMonth) }} {{ selectedYear }}
        </p>
      </div>

      <!-- Badge Pojok Kanan Atas LIPA 2 -->
      <div class="flex items-center justify-center md:justify-end gap-2 shrink-0">
        <div class="px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-sm font-bold tracking-wide shadow-sm flex items-center gap-1.5">
          <UIcon name="i-heroicons-scale" class="w-4 h-4" />
          <span>LIPA 2</span>
        </div>
      </div>
    </div>

    <!-- Filter & Toolbar Aksi -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
      <!-- Grup Filter: Bulan, Tahun, Status -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Pilihan Bulan -->
        <div class="w-36">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">Bulan</label>
          <USelect
            v-model="selectedMonth"
            :options="monthOptions"
            size="sm"
            icon="i-heroicons-calendar"
          />
        </div>

        <!-- Pilihan Tahun -->
        <div class="w-28">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">Tahun</label>
          <USelect
            v-model="selectedYear"
            :options="yearOptions"
            size="sm"
          />
        </div>

        <!-- Pilihan Status Banding -->
        <div class="w-64">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">Filter Status Banding</label>
          <USelect
            v-model="statusFilter"
            :options="statusOptions"
            size="sm"
            icon="i-heroicons-funnel"
          />
        </div>
      </div>

      <!-- Tombol Aksi: Refresh, Ekspor Excel, Cetak -->
      <div class="flex items-end justify-end gap-2">
        <UButton
          color="gray"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui
        </UButton>

        <UButton
          color="emerald"
          variant="solid"
          size="sm"
          icon="i-heroicons-arrow-down-tray"
          :loading="isExporting"
          @click="emitExport"
        >
          Ekspor Excel
        </UButton>

        <UButton
          color="gray"
          variant="solid"
          size="sm"
          icon="i-heroicons-printer"
          @click="emitPrint"
        >
          Cetak
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  namaSatker: {
    type: String,
    default: 'PENGADILAN AGAMA JAKARTA UTARA'
  },
  isExporting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['export', 'print'])

const {
  selectedYear,
  selectedMonth,
  statusFilter,
  triggerRefresh,
  monthOptions,
  statusOptions,
  getNamaBulan
} = useLipa2()

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: `${currentYear}`, value: currentYear },
  { label: `${currentYear - 1}`, value: currentYear - 1 },
  { label: `${currentYear - 2}`, value: currentYear - 2 },
  { label: `${currentYear - 3}`, value: currentYear - 3 }
]

const isRefreshing = ref(false)

const handleRefresh = async () => {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

const emitExport = () => {
  emit('export')
}

const emitPrint = () => {
  window.print()
}
</script>
