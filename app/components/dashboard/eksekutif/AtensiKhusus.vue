<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500 w-4 h-4" />
        Kotak Atensi &amp; Peringatan Dini Kepatuhan (Hari Ini)
      </h3>
      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {{ tanggalHariIni }}
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Skeleton Cards -->
      <template v-if="isLoading">
        <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2">
          <div class="flex items-center justify-between">
            <USkeleton class="h-3.5 w-24" />
            <USkeleton class="h-5 w-8 rounded-full" />
          </div>
          <USkeleton class="h-6 w-28" />
          <USkeleton class="h-3 w-40" />
        </div>
      </template>

      <!-- Real Cards (Clickable to open Detail Modal) -->
      <template v-else>
        <!-- 1. Putus Hari Ini -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 transition-all group"
          title="Klik untuk melihat rincian perkara putus hari ini"
          @click="openModalAtensi('putus_hari_ini', 'Putus Hari Ini', data?.atensi?.putusHariIni?.total)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1">
              <span>Putus Hari Ini</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </span>
            <UBadge color="amber" variant="subtle" size="xs">
              {{ data?.atensi?.putusHariIni?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.putusHariIni?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Total perkara diputus hari ini</p>
        </div>

        <!-- 2. Putus Hari Ini Belum Minutasi -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-red-500 cursor-pointer hover:shadow-md hover:border-red-400 dark:hover:border-red-500 transition-all group"
          title="Klik untuk melihat rincian perkara putus hari ini yang belum minutasi"
          @click="openModalAtensi('putus_belum_minutasi', 'Putus Hari Ini Belum Minutasi', data?.atensi?.putusBelumMinutasi?.total)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-1">
              <span>Belum Minutasi</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </span>
            <UBadge color="red" variant="subtle" size="xs">
              {{ data?.atensi?.putusBelumMinutasi?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.putusBelumMinutasi?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Putus hari ini belum diminutasi</p>
        </div>

        <!-- 3. Putus Hari Ini Belum e-Doc Putusan -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500 transition-all group"
          title="Klik untuk melihat rincian perkara putus hari ini yang belum upload e-doc"
          @click="openModalAtensi('belum_edoc_putusan', 'Putus Hari Ini Belum Upload e-Doc', data?.atensi?.belumEdocPutusan?.total)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1">
              <span>Belum Upload e-Doc</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </span>
            <UBadge color="purple" variant="subtle" size="xs">
              {{ data?.atensi?.belumEdocPutusan?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.belumEdocPutusan?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Putus hari ini belum upload file amar</p>
        </div>

        <!-- 4. Putus Hari Ini Belum Biaya Redaksi/Meterai -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500 cursor-pointer hover:shadow-md hover:border-rose-400 dark:hover:border-rose-500 transition-all group"
          title="Klik untuk melihat rincian perkara putus hari ini yang belum biaya redaksi/meterai"
          @click="openModalAtensi('belum_biaya_redaksi_materai', 'Putus Hari Ini Belum Biaya Redaksi & Meterai', data?.atensi?.belumBiayaRedaksiMaterai?.total)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors flex items-center gap-1">
              <span>Belum Biaya Putus</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-500 transition-colors" />
            </span>
            <UBadge color="rose" variant="subtle" size="xs">
              {{ data?.atensi?.belumBiayaRedaksiMaterai?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.belumBiayaRedaksiMaterai?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Putus hari ini belum biaya redaksi / meterai</p>
        </div>

        <!-- 5. Redaksi dan Materai Hari Ini Tanpa Putusan -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md hover:border-orange-400 dark:hover:border-orange-500 transition-all group"
          title="Klik untuk melihat rincian perkara dengan transaksi biaya redaksi/meterai hari ini namun belum putus"
          @click="openModalAtensi('redaksi_materai_tanpa_putusan', 'Redaksi & Materai Hari Ini Tanpa Putusan', data?.atensi?.redaksiMateraiTanpaPutusan?.total)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors flex items-center gap-1">
              <span>Redaksi/Materai Tanpa Putusan</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </span>
            <UBadge color="orange" variant="subtle" size="xs">
              {{ data?.atensi?.redaksiMateraiTanpaPutusan?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.redaksiMateraiTanpaPutusan?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Biaya redaksi/meterai hari ini belum putus</p>
        </div>
      </template>
    </div>

    <!-- Modal Detail Atensi Eksekutif -->
    <DashboardEksekutifModalDetailAtensi />
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal, openModalAtensi } = useDashboardEksekutif()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/eksekutif/atensi', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const tanggalHariIni = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
