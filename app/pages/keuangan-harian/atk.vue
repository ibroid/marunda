<template>
  <div class="space-y-6">
    <KeuanganHarianHeaderBanner current-slug="atk" />
    <KeuanganHarianNavTabs active-slug="atk" />
    <KeuanganHarianTabelKategori :kategori-id="12" title="Transaksi ATK / Biaya Proses / Pemberkasan" slug="atk" />
  </div>
</template>

<script setup>
useHead({
  title: 'Transaksi ATK - Keuangan SIPP'
})
</script>
