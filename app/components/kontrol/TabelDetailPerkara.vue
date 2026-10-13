<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white capitalize">
          Daftar Detail: {{ formatKategori(activeKategori) }}
        </h3>
        <span class="text-xs text-gray-400">{{ data?.detail?.length || 0 }} perkara ditampilkan</span>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="px-4 py-2.5">No</th>
            <th class="px-4 py-2.5">Nomor Perkara</th>
            <th class="px-4 py-2.5">Tanggal Daftar</th>
            <th class="px-4 py-2.5">Jenis Perkara</th>
            <th class="px-4 py-2.5">Para Pihak / Status</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><USkeleton class="h-3 w-4" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3.5 w-36" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-28" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-44" /></td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.detail || []"
            :key="item.perkara_id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <td class="px-4 py-2 text-gray-400">{{ idx + 1 }}</td>
            <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ item.nomor_perkara }}</td>
            <td class="px-4 py-2 text-gray-500">{{ formatDate(item.tanggal_pendaftaran) }}</td>
            <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ item.jenis_perkara_nama }}</td>
            <td class="px-4 py-2 text-gray-500">
              <span v-if="item.usia_hari" class="text-rose-600 font-semibold">{{ item.usia_hari }} hari — </span>
              {{ item.para_pihak || item.proses_terakhir_text || '-' }}
            </td>
          </tr>
          <tr v-if="!data?.detail?.length">
            <td colspan="5" class="px-4 py-6 text-center text-gray-400">
              Tidak ada data perkara untuk kategori ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const { selectedYear, activeKategori, refreshSignal, formatKategori, formatDate } = useKontrol()

const { data, pending, refresh } = useLazyFetch('/api/kontrol/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    kategori: activeKategori.value
  })),
  watch: [selectedYear, activeKategori],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([selectedYear, activeKategori], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
