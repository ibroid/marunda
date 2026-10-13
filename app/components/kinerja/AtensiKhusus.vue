<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500 w-4 h-4" />
      Peringatan Dini Kepatuhan &amp; Potensi Pinalti Raport SIPP
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Skeleton Cards -->
      <template v-if="isLoading">
        <div
          v-for="i in 4"
          :key="i"
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2"
        >
          <div class="flex items-center justify-between">
            <USkeleton class="h-3.5 w-24" />
            <USkeleton class="h-5 w-8 rounded-full" />
          </div>
          <USkeleton class="h-6 w-28" />
          <USkeleton class="h-3 w-40" />
        </div>
      </template>

      <!-- Real Cards -->
      <template v-else>
        <!-- 1. Putus Belum Minutasi -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow"
          @click="setActiveTab('putus_belum_minutasi')"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Putus Belum Minutasi</span>
            <UBadge color="amber" variant="subtle" size="xs">
              {{ data?.atensi?.putusBelumMinutasi?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.putusBelumMinutasi?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Tunggakan penyelesaian berkas</p>
        </div>

        <!-- 2. Belum Upload Dirput MA -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-md transition-shadow"
          @click="setActiveTab('belum_dirput')"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Belum Publikasi Dirput</span>
            <UBadge color="indigo" variant="subtle" size="xs">
              {{ data?.atensi?.belumUploadDirput?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.belumUploadDirput?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Upload putusan ke direktori MA</p>
        </div>

        <!-- 3. Tunggakan > 5 Bulan Belum Putus -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500 cursor-pointer hover:shadow-md transition-shadow"
          @click="setActiveTab('tunggakan_5bulan')"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Usia &gt; 5 Bulan</span>
            <UBadge color="rose" variant="subtle" size="xs">
              {{ data?.atensi?.tunggakan5Bulan?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.tunggakan5Bulan?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Pinalti skor rasio waktu putus</p>
        </div>

        <!-- 4. Minutasi Lambat > 14 Hari -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-purple-500"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Minutasi &gt; 14 Hari</span>
            <UBadge color="purple" variant="subtle" size="xs">
              {{ data?.atensi?.minutasiLambat?.total || 0 }}
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.atensi?.minutasiLambat?.total || 0 }} Perkara
          </p>
          <p class="text-xs text-gray-500 mt-1">Pinalti skor rasio waktu minutasi</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, refreshSignal, setActiveTab } = useKinerja()

const { data, pending, refresh } = useLazyFetch('/api/kinerja/atensi', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
