<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <DashboardPaniteraJspHeaderBanner />

    <!-- KPI Metric Cards Grid (Endpoint: /api/dashboard/panitera/jsp/:id/summary) -->
    <DashboardPaniteraJspKpiCards />

    <!-- Filter Tab & Tabel Perkara Jurusita (Endpoint: /api/dashboard/panitera/jsp/:id/list) -->
    <DashboardPaniteraJspTabelPerkaraJsp />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useJurusitaDetail()
</script>
