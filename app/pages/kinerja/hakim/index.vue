<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <UIcon name="i-heroicons-scale" class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">Pilih Hakim untuk Melihat Detail Kinerja</h1>
          <p class="text-xs text-gray-500">Pilih aparatur majelis hakim yang ingin dievaluasi kinerjanya</p>
        </div>
      </div>
      <UButton
        to="/dashboard/ketua"
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        size="sm"
      >
        Kembali ke Dashboard
      </UButton>
    </div>

    <!-- Daftar Pilihan Hakim (Modular Component-Driven) -->
    <KinerjaHakimDaftarHakimCards />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh komponen mandiri KinerjaHakimDaftarHakimCards
</script>
