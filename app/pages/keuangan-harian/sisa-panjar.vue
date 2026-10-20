<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="sisa-panjar" />
    <KeuanganHarianNavTabs active-slug="sisa-panjar" />
    <KeuanganHarianTabelKategori :kategori-id="2" title="Rekap Transaksi Pengembalian Sisa Panjar" slug="sisa-panjar" />
  </div>
</template>

<script setup>
useHead({
  title: 'Pengembalian Sisa Panjar - Keuangan SIPP'
})
</script>
