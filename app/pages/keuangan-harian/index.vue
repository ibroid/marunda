<template>
  <div class="p-4 text-center text-xs text-gray-500">
    Mengalihkan ke Rekap Transaksi Harian...
  </div>
</template>

<script setup>
// Redirect otomatis ke menu pertama: Rekap Transaksi Harian
await navigateTo('/keuangan-harian/rekap', { replace: true })
</script>
