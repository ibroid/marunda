<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="panjar" />
    <KeuanganHarianNavTabs active-slug="panjar" />
    <KeuanganHarianTabelKategori :kategori-id="1" title="Transaksi Penerimaan Panjar dan Tambah Panjar Perkara" slug="panjar" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Panjar - Keuangan SIPP'
})
</script>
