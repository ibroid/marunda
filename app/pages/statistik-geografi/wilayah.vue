<template>
  <div class="space-y-6">
    <!-- Header Banner & Refresh Controller -->
    <GeografiHeaderBanner />

    <!-- 5 Kartu KPI Penerimaan Perkara Se-Jakarta Utara -->
    <GeografiKpiCards />

    <!-- Visualisasi Grafik Komparasi Kecamatan & Tren Bulanan -->
    <GeografiGrafikWilayah />

    <!-- Tabel Sebaran Data Per Kecamatan -->
    <GeografiTabelWilayah />

    <!-- Tabel Detail & Rincian Perkara (dengan pencarian & pagination) -->
    <GeografiTabelDetailPerkara />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useStatistikGeografi()
useHead({
  title: 'Statistik Geografi - Data Per Wilayah'
})
</script>
