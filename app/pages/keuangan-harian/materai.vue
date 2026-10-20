<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="materai" />
    <KeuanganHarianTabelKategori :kategori-id="8" title="Rekap Transaksi Materai" slug="materai" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Materai - Keuangan SIPP'
})
</script>
