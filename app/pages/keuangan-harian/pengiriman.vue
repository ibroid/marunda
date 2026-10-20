<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="pengiriman" />
    <KeuanganHarianTabelKategori :kategori-id="3" title="Rekap Transaksi Pengiriman" slug="pengiriman" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Pengiriman - Keuangan SIPP'
})
</script>
