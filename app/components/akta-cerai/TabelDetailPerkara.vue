<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Rincian Daftar Perkara: {{ formatKategori(activeKategori) }}
        </h3>
        <span class="text-xs text-gray-400">
          {{ data?.detail?.length || 0 }} perkara ditampilkan
        </span>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="px-4 py-2.5 w-12 text-center">No</th>
            <th class="px-4 py-2.5">Nomor Perkara</th>
            <th class="px-4 py-2.5">Para Pihak</th>
            <th class="px-4 py-2.5">Tanggal BHT</th>
            <th v-if="activeKategori === 'ct_belum_ikrar'" class="px-4 py-2.5">Status Sidang Ikrar</th>
            <th v-else class="px-4 py-2.5">Status / Nomor Akta Cerai</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-32" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-40" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20" /></td>
            <td class="px-4 py-3"><USkeleton class="h-4 w-28 rounded-full" /></td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.detail || []"
            :key="item.perkara_id || idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <td class="px-4 py-2 text-center text-gray-400">{{ idx + 1 }}</td>
            <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ item.nomor_perkara }}</td>
            <td class="px-4 py-2 text-gray-600 dark:text-gray-300">{{ item.para_pihak || '-' }}</td>
            <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDate(item.tanggal_bht) }}</td>

            <!-- Status Kolom Khusus CT -->
            <td v-if="activeKategori === 'ct_belum_ikrar'" class="px-4 py-2">
              <UBadge color="amber" variant="subtle" size="xs">
                {{ item.tgl_sidang_ikrar ? 'Jadwal: ' + formatDate(item.tgl_sidang_ikrar) : 'Belum Ada Jadwal Sidang Ikrar' }}
              </UBadge>
            </td>

            <!-- Status Kolom Khusus CG / Belum Diambil -->
            <td v-else class="px-4 py-2">
              <span v-if="item.nomor_akta_cerai" class="font-medium text-gray-800 dark:text-gray-200">
                {{ item.nomor_akta_cerai }}
                <span class="text-xs text-gray-400"> (Tgl: {{ formatDate(item.tgl_akta_cerai) }})</span>
              </span>
              <UBadge v-else color="rose" variant="subtle" size="xs">
                Belum Terbit Akta Cerai
              </UBadge>
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
const { selectedYear, activeKategori, refreshSignal, formatKategori, formatDate } = useAktaCerai()

const { data, pending, refresh } = useLazyFetch('/api/akta-cerai/detail', {
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
