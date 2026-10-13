<template>
  <UCard class="lg:col-span-1">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-teal-500" />
          Beban Tugas &amp; Kinerja Jurusita (JSP)
        </h3>
        <span v-if="!isLoading" class="text-xs text-gray-500">{{ data?.kinerjaJSP?.length || 0 }} Personil</span>
        <USkeleton v-else class="h-4 w-20" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nama Jurusita</th>
            <th class="py-2.5 px-2 text-center font-semibold text-gray-600 dark:text-gray-300">Total Tugas</th>
            <th class="py-2.5 px-2 text-center font-semibold text-orange-600 dark:text-orange-400">Belum PBT</th>
          </tr>
        </thead>
        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-32" />
            </td>
            <td class="py-2.5 px-2 text-center">
              <USkeleton class="h-4 w-8 mx-auto" />
            </td>
            <td class="py-2.5 px-2 text-center">
              <USkeleton class="h-4 w-8 mx-auto" />
            </td>
          </tr>
        </tbody>
        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="jsp in data?.kinerjaJSP" :key="jsp.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200">
              <NuxtLink
                :to="`/dashboard/panitera/jsp/${jsp.id}?year=${selectedYear}&tab=pbt`"
                class="group inline-flex items-center gap-1.5 font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 hover:underline"
                title="Klik untuk membuka detail tugas & tunggakan PBT jurusita"
              >
                <span>{{ jsp.nama }}</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 transition-colors" />
              </NuxtLink>
            </td>
            <td class="py-2.5 px-2 text-center font-bold text-teal-600 dark:text-teal-400">
              <NuxtLink
                :to="`/dashboard/panitera/jsp/${jsp.id}?year=${selectedYear}&tab=tugas`"
                class="hover:underline"
                :title="`Lihat ${jsp.totalTugas} perkara tugas penetapan`"
              >
                {{ jsp.totalTugas }}
              </NuxtLink>
            </td>
            <td class="py-2.5 px-2 text-center font-bold">
              <NuxtLink
                v-if="jsp.belumPbt > 0"
                :to="`/dashboard/panitera/jsp/${jsp.id}?year=${selectedYear}&tab=pbt`"
                class="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline"
                :title="`Klik untuk melihat ${jsp.belumPbt} perkara belum PBT`"
              >
                <span>{{ jsp.belumPbt }}</span>
              </NuxtLink>
              <span v-else class="text-gray-400">0</span>
            </td>
          </tr>
          <tr v-if="!data?.kinerjaJSP?.length">
            <td colspan="3" class="py-6 text-center text-gray-400 text-xs">
              Tidak ada data Jurusita untuk tahun {{ selectedYear }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, refreshSignal } = useDashboardPanitera()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/jsp', {
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
