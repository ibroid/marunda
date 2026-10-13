<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Buku {{ currentTabLabel }} (Total: {{ data?.total || 0 }} Perkara)
        </h3>
        <span class="text-xs text-gray-400">Menampilkan hingga 100 perkara</span>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="px-4 py-2.5 w-12 text-center">No</th>
            <th class="px-4 py-2.5">Nomor Perkara</th>
            <th class="px-4 py-2.5">Tanggal Daftar</th>
            <th class="px-4 py-2.5">Jenis Perkara</th>
            <th class="px-4 py-2.5">Para Pihak</th>
            <th class="px-4 py-2.5">Tanggal Putusan</th>
            <th class="px-4 py-2.5">Tanggal Minutasi</th>
            <th class="px-4 py-2.5">Status Akhir</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-28" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-24" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-36" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-4 py-3"><USkeleton class="h-4 w-16 rounded-full" /></td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.data || []"
            :key="item.perkara_id || idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <td class="px-4 py-2 text-center text-gray-400">{{ idx + 1 }}</td>
            <td class="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ item.nomor_perkara }}</td>
            <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDate(item.tanggal_pendaftaran) }}</td>
            <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ item.jenis_perkara_nama }}</td>
            <td class="px-4 py-2 text-gray-600 dark:text-gray-300 max-w-xs truncate">{{ item.para_pihak || '-' }}</td>
            <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDate(item.tanggal_putusan) }}</td>
            <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDate(item.tanggal_minutasi) }}</td>
            <td class="px-4 py-2">
              <UBadge
                :color="item.tanggal_putusan ? 'green' : 'amber'"
                variant="subtle"
                size="xs"
              >
                {{ item.tanggal_putusan ? 'Putus' : (item.proses_terakhir_text || 'Berjalan') }}
              </UBadge>
            </td>
          </tr>
          <tr v-if="!data?.data?.length">
            <td colspan="8" class="px-4 py-6 text-center text-gray-400">
              Tidak ada data perkara untuk register ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  activeJenis,
  searchQuery,
  refreshSignal,
  sharedData,
  currentTabLabel,
  formatDate
} = useRegister()

const { data, pending, refresh } = useLazyFetch('/api/register/list', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    jenis: activeJenis.value,
    search: searchQuery.value
  })),
  watch: [selectedYear, activeJenis, searchQuery],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.data) {
    sharedData.value = newVal.data
  }
})

watch([selectedYear, activeJenis, searchQuery], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
