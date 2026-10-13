<template>
  <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-primary-950 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="w-full md:w-auto">
      <div class="flex items-center gap-2">
        <UBadge color="white" variant="solid" size="xs" class="text-emerald-950 font-bold uppercase tracking-wider">
          Audit Kepatuhan Berkas
        </UBadge>
        <span class="text-xs text-emerald-200">Kontrol &amp; Pengawasan Administrasi Perkara</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight mt-1">Kontrol Berkas Penetapan</h2>
      <p class="text-sm text-emerald-100/90 mt-0.5">
        Audit kepatuhan pengunggahan file/dokumen SK Penetapan Majelis Hakim (PMH), Panitera Pengganti (PPP), dan Jurusita (PJS)
      </p>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <UBadge
        v-if="isFilterApplied"
        color="emerald"
        variant="subtle"
        size="md"
        class="text-xs font-semibold"
      >
        <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5 mr-1" />
        {{ formatMonthYear(selectedMonth, selectedYear) }}
      </UBadge>

      <UButton
        v-if="isFilterApplied"
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
</template>

<script setup>
const {
  selectedMonth,
  selectedYear,
  isFilterApplied,
  triggerRefresh,
  formatMonthYear
} = useKontrolBerkasPenetapan()

const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
