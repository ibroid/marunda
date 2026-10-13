<template>
  <div class="space-y-6">
    <!-- Header Banner Satker & Refresh Controller -->
    <DashboardEksekutifHeaderBanner />

    <!-- KPI Metric Cards Grid (6 Kartu, fetching mandiri) -->
    <DashboardEksekutifKpiCards />

    <!-- Early Warning / Kotak Atensi Kepatuhan Harian -->
    <DashboardEksekutifAtensiKhusus />

    <!-- Section: Grafik Komparasi Bulanan & 10 Perkara Terbaru -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Grafik Tren Komparasi Bulanan -->
      <DashboardEksekutifGrafikBulanan />

      <!-- 10 Perkara Terakhir Didaftar -->
      <DashboardEksekutifTabelPerkaraTerbaru />
    </div>
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useDashboardEksekutif()
</script>
