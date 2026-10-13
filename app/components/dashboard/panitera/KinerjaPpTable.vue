<template>
  <UCard class="lg:col-span-2">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-emerald-500" />
            Kepatuhan Upload BAS per Panitera Pengganti (PP)
          </h3>
          <p class="text-[11px] text-gray-400 mt-0.5">Klik nama Panitera Pengganti untuk membuka daftar perkara &amp; status BAS</p>
        </div>
        <span v-if="!isLoading" class="text-xs text-gray-500">{{ data?.kinerjaPP?.length || 0 }} Panitera Pengganti</span>
        <USkeleton v-else class="h-4 w-28" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nama Panitera Pengganti</th>
            <th class="py-2.5 px-2 text-center font-semibold text-gray-600 dark:text-gray-300">Total Sidang</th>
            <th class="py-2.5 px-2 text-center font-semibold text-green-600 dark:text-green-400">BAS Ada</th>
            <th class="py-2.5 px-2 text-center font-semibold text-red-600 dark:text-red-400">BAS Kosong</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Kepatuhan (%)</th>
          </tr>
        </thead>
        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-36" />
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
          </tr>
        </tbody>
        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="pp in data?.kinerjaPP" :key="pp.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">
              <NuxtLink
                :to="`/dashboard/panitera/bas/${pp.id}?year=${selectedYear}`"
                class="group inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                title="Klik untuk melihat daftar perkara dan status BAS"
              >
                <span>{{ pp.nama }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </NuxtLink>
            </td>
            <td class="py-2.5 px-2 text-center font-bold">{{ pp.totalSidang }}</td>
            <td class="py-2.5 px-2 text-center font-bold text-green-600 dark:text-green-400">{{ pp.basAda }}</td>
            <td class="py-2.5 px-2 text-center font-bold">
              <NuxtLink
                :to="`/dashboard/panitera/bas/${pp.id}?year=${selectedYear}`"
                :class="pp.basKosong > 0 ? 'text-red-600 hover:underline dark:text-red-400 cursor-pointer font-bold' : 'text-gray-400'"
                :title="pp.basKosong > 0 ? 'Klik untuk melihat perkara dengan BAS kosong' : 'Semua BAS lengkap'"
              >
                {{ pp.basKosong }}
              </NuxtLink>
            </td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="pp.kepatuhan >= 90 ? 'bg-green-500' : pp.kepatuhan >= 75 ? 'bg-amber-500' : 'bg-red-500'"
                    :style="{ width: `${Math.min(pp.kepatuhan, 100)}%` }"
                  ></div>
                </div>
                <span class="text-[11px] font-semibold w-10 text-right">{{ pp.kepatuhan }}%</span>
              </div>
            </td>
          </tr>
          <tr v-if="!data?.kinerjaPP?.length">
            <td colspan="5" class="py-6 text-center text-gray-400 text-xs">
              Tidak ada data Panitera Pengganti untuk tahun {{ selectedYear }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardPanitera()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/pp', {
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
