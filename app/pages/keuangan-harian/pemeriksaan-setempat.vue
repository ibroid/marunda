<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="pemeriksaan-setempat" />
    <KeuanganHarianTabelKategori :kategori-id="7" title="Rekap Transaksi Pemeriksaan Setempat (PS)" slug="pemeriksaan-setempat" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi Pemeriksaan Setempat - Keuangan SIPP'
})
</script>
