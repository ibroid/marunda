<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-500" />
        Peringatan Dini & Atensi Kinerja (EWS Hakim)
      </h3>
      <span class="text-xs text-gray-500">Klik kartu untuk menyaring tabel</span>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2">
        <div class="flex justify-between items-center">
          <USkeleton class="h-3 w-32" />
          <USkeleton class="h-5 w-8 rounded-full" />
        </div>
        <USkeleton class="h-4 w-48" />
        <USkeleton class="h-3 w-24" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Tunggakan > 90 Hari -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md"
        :class="activeTab === 'tunggakan' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'"
        @click="setTab('tunggakan')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <UIcon name="i-heroicons-clock" class="w-4 h-4" />
            Tunggakan Usia > 90 Hari
          </span>
          <UBadge :color="atensi?.tunggakan?.total > 0 ? 'red' : 'gray'" variant="subtle" size="xs">
            {{ atensi?.tunggakan?.total || 0 }} Perkara
          </UBadge>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
          Perkara aktif belum diputus yang telah melewati 3 bulan masa pemeriksaan persidangan.
        </p>
        <div class="mt-3 flex items-center justify-between text-[11px]">
          <span class="text-rose-600 dark:text-rose-400 font-medium">Batas Waktu SEMA</span>
          <span class="text-gray-400 flex items-center gap-1">
            Lihat daftar
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </span>
        </div>
      </div>

      <!-- 2. Putus Belum Minutasi -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md"
        :class="activeTab === 'belum_minutasi' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'"
        @click="setTab('belum_minutasi')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4" />
            Putus Belum Minutasi
          </span>
          <UBadge :color="atensi?.belumMinutasi?.total > 0 ? 'amber' : 'gray'" variant="subtle" size="xs">
            {{ atensi?.belumMinutasi?.total || 0 }} Perkara
          </UBadge>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
          Perkara telah putus namun belum selesai minutasi berkas oleh Majelis & Panitera Pengganti.
        </p>
        <div class="mt-3 flex items-center justify-between text-[11px]">
          <span class="text-amber-600 dark:text-amber-400 font-medium">One Day Minutasi</span>
          <span class="text-gray-400 flex items-center gap-1">
            Lihat daftar
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </span>
        </div>
      </div>

      <!-- 3. Putus Belum e-Doc Putusan -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md"
        :class="activeTab === 'belum_edoc' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
        @click="setTab('belum_edoc')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
            Putus Belum Upload e-Doc
          </span>
          <UBadge :color="atensi?.belumEdoc?.total > 0 ? 'blue' : 'gray'" variant="subtle" size="xs">
            {{ atensi?.belumEdoc?.total || 0 }} Perkara
          </UBadge>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
          Perkara putus yang belum melengkapi salinan dokumen elektronik (e-Doc) di SIPP.
        </p>
        <div class="mt-3 flex items-center justify-between text-[11px]">
          <span class="text-blue-600 dark:text-blue-400 font-medium">Kepatuhan e-Court & SIPP</span>
          <span class="text-gray-400 flex items-center gap-1">
            Lihat daftar
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  hakimId,
  selectedYear,
  roleFilter,
  activeTab,
  setTab,
  refreshSignal
} = useKinerjaHakimDetail()

const { data, pending, refresh } = useLazyFetch(
  () => `/api/kinerja/hakim/${hakimId.value}/atensi`,
  {
    server: false,
    query: computed(() => ({
      year: selectedYear.value,
      role: roleFilter.value
    })),
    watch: [hakimId, selectedYear, roleFilter],
    default: () => null
  }
)

const isLoading = computed(() => pending.value || !data.value)
const atensi = computed(() => data.value || null)

watch(refreshSignal, () => {
  refresh()
})
</script>
