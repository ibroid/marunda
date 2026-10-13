<template>
  <div class="space-y-3">
    <!-- Section Header Info -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
        <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-primary-500" />
        <span>Ringkasan Putusan Non-Kabul ({{ yearLabel }})</span>
      </div>
      <div v-if="!isLoading && data?.summary" class="flex items-center gap-2 text-xs text-gray-500">
        <span>Belum BHT: <strong class="text-amber-600 dark:text-amber-400">{{ data.summary.belum_bht || 0 }}</strong></span>
        <span>•</span>
        <span>Belum Minutasi: <strong class="text-rose-600 dark:text-rose-400">{{ data.summary.belum_minutasi || 0 }}</strong></span>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div
        v-for="i in 6"
        :key="i"
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs space-y-2 border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-3 w-16" />
          <USkeleton class="h-6 w-6 rounded-lg" />
        </div>
        <USkeleton class="h-7 w-12" />
        <USkeleton class="h-3 w-20" />
      </div>
    </div>

    <!-- Real Content: KPI Cards -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- 1. Total Non-Kabul -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-indigo-400 dark:hover:border-indigo-500"
        :class="[
          activeStatus === 'all'
            ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setStatus('all')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Total Non-Kabul</span>
          <div class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
          {{ (data?.summary?.total || 0).toLocaleString('id-ID') }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Semua putusan non-kabul
        </p>
      </div>

      <!-- 2. Dicabut -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-blue-400 dark:hover:border-blue-500"
        :class="[
          activeStatus === 'dicabut'
            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/25 dark:bg-blue-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setStatus('dicabut')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Dicabut</span>
          <div class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-arrow-uturn-left" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {{ (data?.summary?.dicabut || 0).toLocaleString('id-ID') }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Pencabutan gugatan/permohonan
        </p>
      </div>

      <!-- 3. Tidak Dapat Diterima (N.O.) -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-amber-400 dark:hover:border-amber-500"
        :class="[
          activeStatus === 'tidak_diterima'
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/25 dark:bg-amber-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setStatus('tidak_diterima')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Tidak Diterima (NO)</span>
          <div class="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
          {{ (data?.summary?.tidak_diterima || 0).toLocaleString('id-ID') }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Putusan N.O. (Cacat formil)
        </p>
      </div>

      <!-- 4. Ditolak -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-rose-400 dark:hover:border-rose-500"
        :class="[
          activeStatus === 'ditolak'
            ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/25 dark:bg-rose-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setStatus('ditolak')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Ditolak</span>
          <div class="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          {{ (data?.summary?.ditolak || 0).toLocaleString('id-ID') }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Gugatan/permohonan ditolak
        </p>
      </div>

      <!-- 5. Gugur / Dicoret -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-purple-400 dark:hover:border-purple-500"
        :class="[
          activeStatus === 'gugur'
            ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/25 dark:bg-purple-950/25'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setStatus('gugur')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Gugur / Dicoret</span>
          <div class="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UIcon name="i-heroicons-archive-box-x-mark" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
          {{ ((data?.summary?.gugur || 0) + (data?.summary?.dicoret || 0)).toLocaleString('id-ID') }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5 truncate">
          Gugur: {{ data?.summary?.gugur || 0 }} | Coret: {{ data?.summary?.dicoret || 0 }}
        </p>
      </div>

      <!-- 6. ⚠️ Audit Anomali Terbit Akta Cerai -->
      <div
        class="border rounded-xl p-3 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition"
        :class="[
          activeStatus === 'anomali_ac'
            ? 'ring-2 ring-red-600 border-red-600 bg-red-50/40 dark:bg-red-950/40'
            : ((data?.summary?.anomali_terbit_ac || 0) > 0
                ? 'border-red-300 dark:border-red-800 bg-red-50/20 dark:bg-red-950/20 hover:border-red-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400')
        ]"
        @click="setStatus('anomali_ac')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold" :class="(data?.summary?.anomali_terbit_ac || 0) > 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-500'">
            ⚠️ Anomali: Terbit AC
          </span>
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center"
            :class="(data?.summary?.anomali_terbit_ac || 0) > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'"
          >
            <UIcon name="i-heroicons-shield-exclamation" class="w-3.5 h-3.5" />
          </div>
        </div>
        <p class="text-xl font-bold mt-1" :class="(data?.summary?.anomali_terbit_ac || 0) > 0 ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-gray-900 dark:text-white'">
          {{ data?.summary?.anomali_terbit_ac || 0 }}
        </p>
        <p class="text-[11px] mt-0.5 truncate" :class="(data?.summary?.anomali_terbit_ac || 0) > 0 ? 'text-red-600 font-medium' : 'text-gray-400'">
          {{ (data?.summary?.anomali_terbit_ac || 0) > 0 ? 'Perlu tindakan audit!' : 'Tidak ditemukan anomali' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { filterYear, activeStatus, setStatus, refreshSignal } = useKontrolNonKabul()

const yearLabel = computed(() => {
  return filterYear.value === 'all' ? 'Semua Tahun' : `Tahun ${filterYear.value}`
})

const { data, pending, refresh } = useLazyFetch('/api/kontrol/non-kabul/summary', {
  server: false,
  query: computed(() => ({
    year: filterYear.value
  })),
  watch: [filterYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(filterYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
