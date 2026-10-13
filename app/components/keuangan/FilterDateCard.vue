<template>
  <UCard :ui="{ body: { padding: 'p-4' } }">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-gray-500 font-medium">Dari:</span>
          <input
            v-model="tglAwal"
            type="date"
            class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="text-gray-500 font-medium">Sampai:</span>
          <input
            v-model="tglAkhir"
            type="date"
            class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <UButton
          size="xs"
          color="primary"
          @click="triggerRefresh"
        >
          Terapkan Filter
        </UButton>
      </div>

      <!-- Tombol Pintas Rentang Waktu -->
      <div class="flex items-center gap-1.5">
        <UButton size="2xs" color="gray" variant="ghost" @click="setPreset('hari_ini')">Hari Ini</UButton>
        <UButton size="2xs" color="gray" variant="ghost" @click="setPreset('bulan_ini')">Bulan Ini</UButton>
        <UButton size="2xs" color="gray" variant="ghost" @click="setPreset('tahun_ini')">Tahun Ini</UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const { tglAwal, tglAkhir, triggerRefresh, setPreset } = useKeuangan()
</script>
