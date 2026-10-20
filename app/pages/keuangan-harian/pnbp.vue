<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="pnbp" />
    <KeuanganHarianNavTabs active-slug="pnbp" />
    <KeuanganHarianTabelKategori :kategori-id="11" title="Rekap Transaksi Pengeluaran PNBP" slug="pnbp" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi PNBP - Keuangan SIPP'
})
</script>
