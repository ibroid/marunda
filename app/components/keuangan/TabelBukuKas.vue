<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Rincian Buku Kas Bantu Transaksi
        </h3>
        <span class="text-xs text-gray-400">Menampilkan hingga 100 entri transaksi terakhir</span>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
          <tr>
            <th class="px-4 py-2.5 w-12 text-center">No</th>
            <th class="px-4 py-2.5">Tanggal</th>
            <th class="px-4 py-2.5">Nomor Perkara</th>
            <th class="px-4 py-2.5">Kode</th>
            <th class="px-4 py-2.5">Uraian Transaksi</th>
            <th class="px-4 py-2.5 text-right">Penerimaan (Rp)</th>
            <th class="px-4 py-2.5 text-right">Pengeluaran (Rp)</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><USkeleton class="h-3 w-4" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-16" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-28" /></td>
            <td class="px-4 py-3"><USkeleton class="h-4 w-10 rounded-full" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-48" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20 ml-auto" /></td>
            <td class="px-4 py-3"><USkeleton class="h-3 w-20 ml-auto" /></td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.transaksi || []"
            :key="item.id || idx"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <td class="px-4 py-2 text-center text-gray-400">{{ idx + 1 }}</td>
            <td class="px-4 py-2 text-gray-500 whitespace-nowrap">{{ formatDate(item.tanggal) }}</td>
            <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ item.nomorPerkara }}</td>
            <td class="px-4 py-2">
              <UBadge color="gray" variant="subtle" size="xs">{{ item.kode }}</UBadge>
            </td>
            <td class="px-4 py-2 text-gray-700 dark:text-gray-300">{{ item.uraian }}</td>
            <td class="px-4 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
              {{ item.penerimaan > 0 ? formatRupiah(item.penerimaan) : '-' }}
            </td>
            <td class="px-4 py-2 text-right font-medium text-rose-600 dark:text-rose-400">
              {{ item.pengeluaran > 0 ? formatRupiah(item.pengeluaran) : '-' }}
            </td>
          </tr>
          <tr v-if="!data?.transaksi?.length">
            <td colspan="7" class="px-4 py-6 text-center text-gray-400">
              Tidak ada transaksi tercatat pada rentang tanggal ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const { tglAwal, tglAkhir, refreshSignal, sharedTransaksi, formatRupiah, formatDate } = useKeuangan()

const { data, pending, refresh } = useLazyFetch('/api/keuangan/transaksi', {
  server: false,
  query: computed(() => ({
    tglAwal: tglAwal.value,
    tglAkhir: tglAkhir.value
  })),
  watch: [tglAwal, tglAkhir],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(data, (newVal) => {
  if (newVal?.transaksi) {
    sharedTransaksi.value = newVal.transaksi
  }
})

watch([tglAwal, tglAkhir], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
