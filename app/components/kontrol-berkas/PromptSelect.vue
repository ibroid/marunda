<template>
  <div class="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 sm:p-8 bg-white/70 dark:bg-gray-800/70 text-center max-w-lg mx-auto my-6 space-y-3 shadow-2xs">
    <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
      <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
    </div>

    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Pilih Periode Bulan &amp; Tahun
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Silakan pilih bulan tertentu atau <strong>Semua Bulan (1 Tahun Penuh)</strong> pada filter di atas, lalu klik <strong>Tampilkan</strong>.
      </p>
    </div>

    <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
      <UButton
        color="primary"
        variant="soft"
        size="xs"
        icon="i-heroicons-bolt"
        @click="auditCurrentMonth"
      >
        Bulan Ini ({{ currentMonthLabel }} {{ currentYear }})
      </UButton>

      <UButton
        color="gray"
        variant="soft"
        size="xs"
        icon="i-heroicons-calendar"
        @click="auditFullYear"
      >
        Semua Bulan (Tahun {{ currentYear }})
      </UButton>
    </div>
  </div>
</template>

<script setup>
const {
  applyFilter,
  getMonthLabel
} = useKontrolBerkasPenetapan()

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()
const currentMonthLabel = computed(() => getMonthLabel(currentMonth))

function auditCurrentMonth() {
  applyFilter(currentMonth, currentYear)
}

function auditFullYear() {
  applyFilter(0, currentYear)
}
</script>
