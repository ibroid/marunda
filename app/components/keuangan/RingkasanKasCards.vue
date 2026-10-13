<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border-l-4 border-l-gray-300 dark:border-l-gray-700 space-y-2">
        <USkeleton class="h-3.5 w-32" />
        <USkeleton class="h-7 w-28" />
        <USkeleton class="h-3 w-40" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-emerald-500">
        <p class="text-xs text-gray-500">Total Penerimaan (Debit)</p>
        <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {{ formatRupiah(data?.summary?.totalPenerimaan || 0) }}
        </p>
        <p class="text-[11px] text-gray-400 mt-1">Uang masuk panjar perkara</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-rose-500">
        <p class="text-xs text-gray-500">Total Pengeluaran (Kredit)</p>
        <p class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          {{ formatRupiah(data?.summary?.totalPengeluaran || 0) }}
        </p>
        <p class="text-[11px] text-gray-400 mt-1">Biaya proses, panggilan, PNBP</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-primary-500">
        <p class="text-xs text-gray-500">Saldo Mutasi Bersih</p>
        <p class="text-xl font-bold text-primary-600 dark:text-primary-400 mt-1">
          {{ formatRupiah(data?.summary?.saldoMutasi || 0) }}
        </p>
        <p class="text-[11px] text-gray-400 mt-1">Selisih debit dikurangi kredit</p>
      </UCard>

      <UCard :ui="{ body: { padding: 'p-4' } }" class="border-l-4 border-l-blue-500">
        <p class="text-xs text-gray-500">Jumlah Transaksi</p>
        <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {{ data?.summary?.totalTransaksi || 0 }} Transaksi
        </p>
        <p class="text-[11px] text-gray-400 mt-1">Tercatat di sistem SIPP</p>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { tglAwal, tglAkhir, refreshSignal, formatRupiah } = useKeuangan()

const { data, pending, refresh } = useLazyFetch('/api/keuangan/ringkasan', {
  server: false,
  query: computed(() => ({
    tglAwal: tglAwal.value,
    tglAkhir: tglAkhir.value
  })),
  watch: [tglAwal, tglAkhir],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([tglAwal, tglAkhir], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
