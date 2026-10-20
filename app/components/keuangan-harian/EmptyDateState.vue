<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-12 border border-dashed border-gray-300 dark:border-gray-700 text-center shadow-sm">
    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
      <UIcon name="i-heroicons-calendar" class="w-8 h-8 animate-pulse" />
    </div>
    <h3 class="text-base font-bold text-gray-900 dark:text-white mb-1">
      Silakan Pilih Tanggal Transaksi
    </h3>
    <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-5">
      Data transaksi keuangan harian hanya akan ditampilkan setelah Anda memilih tanggal transaksi melalui kotak input di atas.
    </p>
    <div class="flex items-center justify-center gap-2">
      <UButton
        size="sm"
        color="emerald"
        variant="solid"
        icon="i-heroicons-calendar-days"
        @click="setPresetToday"
      >
        Pilih Hari Ini
      </UButton>
      <UButton
        size="sm"
        color="gray"
        variant="outline"
        @click="setPresetYesterday"
      >
        Pilih Kemarin
      </UButton>
    </div>
  </div>
</template>

<script setup>
const { setPresetToday, setPresetYesterday } = useKeuanganHarian()
</script>
