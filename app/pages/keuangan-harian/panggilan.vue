<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="panggilan" />
    <KeuanganHarianNavTabs active-slug="panggilan" />
    <KeuanganHarianTabelKategori :kategori-id="4" title="Rekap Transaksi Panggilan" slug="panggilan" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Panggilan - Keuangan SIPP'
})
</script>
