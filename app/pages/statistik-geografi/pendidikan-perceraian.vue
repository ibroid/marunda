<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Terpadu -->
    <PendidikanPerceraianHeaderBanner />

    <!-- 5 Kartu KPI Rekapitulasi -->
    <PendidikanPerceraianKpiCards />

    <!-- Tabel Rekapitulasi Tingkat Pendidikan Pengaju Perceraian -->
    <PendidikanPerceraianTabelPendidikanPerceraian />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePendidikanPerceraian()
useHead({
  title: 'Statistik Geografi - Pendidikan Perceraian'
})
</script>
