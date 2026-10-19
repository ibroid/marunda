<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Terpadu -->
    <FaktorPerceraianHeaderBanner />

    <!-- 5 Kartu KPI Rekapitulasi -->
    <FaktorPerceraianKpiCards />

    <!-- Tabel Rekapitulasi Faktor Perceraian -->
    <FaktorPerceraianTabelFaktorPerceraian />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useFaktorPerceraian()
useHead({
  title: 'Statistik Geografi - Faktor Perceraian'
})
</script>
