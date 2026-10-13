<template>
  <UCard class="lg:col-span-2">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-scale" class="w-4 h-4 text-indigo-500" />
          Beban Kerja &amp; Produktivitas Majelis Hakim (Tahun {{ selectedYear }})
        </h3>
        <span v-if="!isLoading" class="text-xs text-gray-500">{{ data?.bebanHakim?.length || 0 }} Hakim</span>
        <USkeleton v-else class="h-4 w-16" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nama Hakim / Ketua Majelis</th>
            <th class="py-2.5 px-2 text-center font-semibold text-gray-600 dark:text-gray-300">Total</th>
            <th class="py-2.5 px-2 text-center font-semibold text-green-600 dark:text-green-400">Putus</th>
            <th class="py-2.5 px-2 text-center font-semibold text-orange-600 dark:text-orange-400">Sisa</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Rasio Putus</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-16">Detail</th>
          </tr>
        </thead>
        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-36 mb-1" />
              <USkeleton class="h-3 w-28" />
            </td>
            <td class="py-2.5 px-2 text-center">
              <USkeleton class="h-4 w-8 mx-auto" />
            </td>
            <td class="py-2.5 px-2 text-center">
              <USkeleton class="h-4 w-8 mx-auto" />
            </td>
            <td class="py-2.5 px-2 text-center">
              <USkeleton class="h-4 w-8 mx-auto" />
            </td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <USkeleton class="h-1.5 flex-1 rounded-full" />
                <USkeleton class="h-3 w-8" />
              </div>
            </td>
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-5 w-6 mx-auto rounded" />
            </td>
          </tr>
        </tbody>
        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="h in data?.bebanHakim" :key="h.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">
              {{ h.nama }}
              <div class="text-[10px] text-gray-400">
                CG: {{ h.cg }} | CT: {{ h.ct }} | Lainnya: {{ h.lainnya }}
              </div>
            </td>
            <td class="py-2.5 px-2 text-center font-bold">{{ h.total }}</td>
            <td class="py-2.5 px-2 text-center font-bold text-green-600 dark:text-green-400">{{ h.putus }}</td>
            <td class="py-2.5 px-2 text-center font-bold text-orange-600 dark:text-orange-400">{{ h.sisa }}</td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="h.rasio >= 90 ? 'bg-green-500' : h.rasio >= 75 ? 'bg-amber-500' : 'bg-red-500'"
                    :style="{ width: `${Math.min(h.rasio, 100)}%` }"
                  ></div>
                </div>
                <span class="text-[11px] font-semibold w-10 text-right">{{ h.rasio }}%</span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-center">
              <UButton
                :to="`/kinerja/hakim/${h.id}?year=${selectedYear}`"
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-right"
                title="Lihat Detail Kinerja Hakim"
              />
            </td>
          </tr>
          <tr v-if="!data?.bebanHakim?.length">
            <td colspan="6" class="py-6 text-center text-gray-400 text-xs">
              Tidak ada data majelis hakim untuk tahun {{ selectedYear }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/hakim', {
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
