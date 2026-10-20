<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="sita" />
    <KeuanganHarianTabelKategori :kategori-id="5" title="Rekap Transaksi Sita" slug="sita" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Sita - Keuangan SIPP'
})
</script>
