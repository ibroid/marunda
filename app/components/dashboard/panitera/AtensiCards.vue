<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <UIcon name="i-heroicons-clipboard-document-list" class="text-emerald-500 w-4 h-4" />
      Atensi Layanan &amp; Kepatuhan Administrasi Kepaniteraan
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Skeleton Cards -->
      <template v-if="isLoading">
        <div v-for="i in 5" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-3.5 w-36" />
            <USkeleton class="h-5 w-14 rounded-full" />
          </div>
          <USkeleton class="h-6 w-28" />
          <USkeleton class="h-3 w-48" />
        </div>
      </template>

      <!-- Real Cards -->
      <template v-else>
        <!-- 1. Kepatuhan BAS -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4" :class="(data?.summary?.basKosong || 0) > 0 ? 'border-l-amber-500' : 'border-l-green-500'">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Kepatuhan Berita Acara (BAS)</span>
            <UBadge :color="(data?.summary?.basKosong || 0) > 0 ? 'amber' : 'green'" variant="subtle" size="xs">
              {{ data?.summary?.basKosong || 0 }} Belum
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.summary?.rasioKepatuhanBas || 0 }}% Terpenuhi
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Kepatuhan Panitera Pengganti mengunggah file BAS hasil persidangan
          </p>
        </div>

        <!-- 2. Tunggakan Minutasi (Clickable) -->
        <div
          class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 cursor-pointer hover:shadow-md hover:border-red-400 dark:hover:border-red-500 transition-all group"
          :class="(data?.summary?.belumMinutasi || 0) > 0 ? 'border-l-red-500' : 'border-l-green-500'"
          title="Klik untuk melihat daftar perkara yang belum diminutasi"
          @click="openModalMinutasi(data?.summary?.belumMinutasi)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-1">
              <span>Belum Minutasi</span>
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </span>
            <UBadge :color="(data?.summary?.belumMinutasi || 0) > 0 ? 'red' : 'green'" variant="subtle" size="xs">
              {{ data?.summary?.belumMinutasi || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.summary?.belumMinutasi || 0 }} Belum Minutasi
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Perkara putus yang belum diminutasi oleh Panitera Pengganti &amp; Majelis
          </p>
        </div>

        <!-- 3. Tunggakan PBT Jurusita -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4" :class="(data?.summary?.totalBelumPbt || 0) > 0 ? 'border-l-orange-500' : 'border-l-green-500'">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Tunggakan PBT (JSP)</span>
            <UBadge :color="(data?.summary?.totalBelumPbt || 0) > 0 ? 'orange' : 'green'" variant="subtle" size="xs">
              {{ data?.summary?.totalBelumPbt || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.summary?.totalBelumPbt || 0 }} Belum PBT
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Putusan verstek belum BHT yang belum ada data pemberitahuan putusan ke Tergugat
          </p>
        </div>

        <!-- 4. Penerbitan Akta Cerai -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Tunggakan Akta Cerai</span>
            <UBadge color="rose" variant="subtle" size="xs">
              {{ data?.summary?.cgBelumAc || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.summary?.cgBelumAc || 0 }} Akta Belum Terbit
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Perkara Cerai Gugat berkekuatan hukum tetap (BHT) yang belum terbit akta cerai
          </p>
        </div>

        <!-- 5. Pelaksanaan Ikrar Talak -->
        <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-indigo-500">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Tunggakan Ikrar Talak</span>
            <UBadge color="indigo" variant="subtle" size="xs">
              {{ data?.summary?.ctBelumIkrar || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
            {{ data?.summary?.ctBelumIkrar || 0 }} Belum Ikrar
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Perkara Cerai Talak berkekuatan hukum tetap (BHT) yang belum ada data ikrar
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, namaSatker, refreshSignal, openModalMinutasi } = useDashboardPanitera()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/summary', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.namaSatker) {
    namaSatker.value = newVal.namaSatker
  }
})

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
