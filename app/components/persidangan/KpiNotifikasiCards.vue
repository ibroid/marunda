<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div
        v-for="i in 5"
        :key="i"
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs space-y-2 border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-3 w-28" />
          <USkeleton class="h-6 w-6 rounded-lg" />
        </div>
        <USkeleton class="h-7 w-14" />
        <USkeleton class="h-3 w-32" />
      </div>
    </div>

    <!-- 5 Interactive KPI Cards (Sesuai Menu Monev) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <!-- 1. Penundaan Sidang Belum di Isi -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-amber-400 dark:hover:border-amber-500"
        :class="[
          activeTab === 'penundaan'
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setActiveTab('penundaan')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Penundaan Belum di-Isi</span>
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
            :class="[
              (summaryData?.penundaan?.total || 0) > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            ]"
          >
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2 mt-1.5">
          <p
            class="text-2xl font-bold"
            :class="[
              (summaryData?.penundaan?.total || 0) > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-white'
            ]"
          >
            {{ summaryData?.penundaan?.total || 0 }}
          </p>
          <span class="text-xs text-gray-400">perkara</span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span>&gt;24 jam: <strong class="text-rose-500">{{ summaryData?.penundaan?.lebih_24_jam || 0 }}</strong></span>
          <span>&le;24 jam: <strong class="text-amber-500">{{ summaryData?.penundaan?.dalam_24_jam || 0 }}</strong></span>
        </div>
      </div>

      <!-- 2. Ruang Sidang Belum di Isi (Sidang Kantor) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-rose-400 dark:hover:border-rose-500"
        :class="[
          activeTab === 'ruang_sidang'
            ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setActiveTab('ruang_sidang')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Ruang Sidang Kosong</span>
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
            :class="[
              (summaryData?.ruang_sidang?.total || 0) > 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            ]"
          >
            <UIcon name="i-heroicons-building-office" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2 mt-1.5">
          <p
            class="text-2xl font-bold"
            :class="[
              (summaryData?.ruang_sidang?.total || 0) > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-900 dark:text-white'
            ]"
          >
            {{ summaryData?.ruang_sidang?.total || 0 }}
          </p>
          <span class="text-xs text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-gray-400 mt-1 truncate">
          Sidang di kantor tanpa ruangan
        </p>
      </div>

      <!-- 3. Perkara Ditegur / Ditentukan Kemudian (Mediasi) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-purple-400 dark:hover:border-purple-500"
        :class="[
          activeTab === 'ditegur'
            ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/30 dark:bg-purple-950/20'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setActiveTab('ditegur')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Ditegur / Ditentukan Kmdn</span>
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
            :class="[
              (summaryData?.ditegur?.total || 0) > 0
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            ]"
          >
            <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2 mt-1.5">
          <p
            class="text-2xl font-bold"
            :class="[
              (summaryData?.ditegur?.total || 0) > 0
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-900 dark:text-white'
            ]"
          >
            {{ summaryData?.ditegur?.total || 0 }}
          </p>
          <span class="text-xs text-gray-400">perkara</span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span>&gt;30 hr: <strong class="text-rose-500">{{ summaryData?.ditegur?.lebih_30_hari || 0 }}</strong></span>
          <span>&le;30 hr: <strong class="text-purple-500">{{ summaryData?.ditegur?.dalam_30_hari || 0 }}</strong></span>
        </div>
      </div>

      <!-- 4. Jadwal Sidang (Hari Ini / Terjadwal) -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-primary-400 dark:hover:border-primary-500"
        :class="[
          activeTab === 'jadwal'
            ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30 dark:bg-primary-950/20'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setActiveTab('jadwal')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Jadwal Sidang Hari Ini</span>
          <div class="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2 mt-1.5">
          <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ summaryData?.jadwal?.hari_ini || 0 }}
          </p>
          <span class="text-xs text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-gray-400 mt-1 truncate">
          Besok: <strong>{{ summaryData?.jadwal?.besok || 0 }}</strong> perkara terjadwal
        </p>
      </div>

      <!-- 5. Jadwal Sidang Keliling Tidak Ditentukan -->
      <div
        class="border rounded-xl p-3.5 bg-white dark:bg-gray-800 shadow-2xs cursor-pointer transition hover:border-cyan-400 dark:hover:border-cyan-500"
        :class="[
          activeTab === 'sidang_keliling'
            ? 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/20'
            : 'border-gray-200 dark:border-gray-700'
        ]"
        @click="setActiveTab('sidang_keliling')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 font-medium">Sidkel Belum Ditentukan</span>
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
            :class="[
              (summaryData?.sidang_keliling?.total || 0) > 0
                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            ]"
          >
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-baseline gap-2 mt-1.5">
          <p
            class="text-2xl font-bold"
            :class="[
              (summaryData?.sidang_keliling?.total || 0) > 0
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-gray-900 dark:text-white'
            ]"
          >
            {{ summaryData?.sidang_keliling?.total || 0 }}
          </p>
          <span class="text-xs text-gray-400">perkara</span>
        </div>
        <p class="text-[11px] text-gray-400 mt-1 truncate">
          Sidang keliling tanpa lokasi/ruang
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { activeTab, setActiveTab, refreshSignal } = usePersidangan()

const { data, pending, refresh } = useLazyFetch('/api/persidangan/summary', {
  server: false,
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)
const summaryData = computed(() => data.value?.data || null)

watch(refreshSignal, () => {
  refresh()
})
</script>
