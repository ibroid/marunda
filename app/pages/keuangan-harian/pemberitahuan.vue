<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="pemberitahuan" />
    <KeuanganHarianNavTabs active-slug="pemberitahuan" />
    <KeuanganHarianTabelKategori :kategori-id="6" title="Rekap Transaksi Pemberitahuan" slug="pemberitahuan" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Pemberitahuan - Keuangan SIPP'
})
</script>
