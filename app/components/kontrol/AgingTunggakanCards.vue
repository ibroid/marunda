<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
      <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-500" />
      Monitoring Usia Perkara Belum Putus (Tunggakan)
    </h3>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2">
        <div class="flex justify-between items-center">
          <USkeleton class="h-3.5 w-20" />
          <USkeleton class="h-5 w-8 rounded-full" />
        </div>
        <USkeleton class="h-6 w-24" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- 1. > 4 Bulan -->
      <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-blue-500">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">&gt; 4 Bulan</span>
          <UBadge color="blue" size="xs">{{ data?.counts?.tunggakan4Bulan || 0 }}</UBadge>
        </div>
        <p class="text-xl font-bold mt-1">{{ data?.counts?.tunggakan4Bulan || 0 }} Perkara</p>
      </div>

      <!-- 2. > 5 Bulan (Peringatan) -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50/30 transition"
        :class="{ 'ring-2 ring-amber-500': activeKategori === 'tunggakan_5bulan' }"
        @click="selectKategori('tunggakan_5bulan')"
      >
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">&gt; 5 Bulan (Peringatan)</span>
          <UBadge color="amber" size="xs">{{ data?.counts?.tunggakan5Bulan || 0 }}</UBadge>
        </div>
        <p class="text-xl font-bold mt-1">{{ data?.counts?.tunggakan5Bulan || 0 }} Perkara</p>
      </div>

      <!-- 3. > 6 Bulan -->
      <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-rose-500">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">&gt; 6 Bulan</span>
          <UBadge color="rose" size="xs">{{ data?.counts?.tunggakan6Bulan || 0 }}</UBadge>
        </div>
        <p class="text-xl font-bold mt-1">{{ data?.counts?.tunggakan6Bulan || 0 }} Perkara</p>
      </div>

      <!-- 4. > 12 Bulan (Kritis) -->
      <div class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-red-600">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">&gt; 12 Bulan (Kritis)</span>
          <UBadge color="red" size="xs">{{ data?.counts?.tunggakan12Bulan || 0 }}</UBadge>
        </div>
        <p class="text-xl font-bold mt-1">{{ data?.counts?.tunggakan12Bulan || 0 }} Perkara</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { activeKategori, refreshSignal, selectKategori } = useKontrol()

const { data, pending, refresh } = useLazyFetch('/api/kontrol/aging', {
  server: false,
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(refreshSignal, () => {
  refresh()
})
</script>
