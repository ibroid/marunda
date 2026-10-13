<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <DashboardPaniteraBasHeaderBanner />

    <!-- KPI Metric Cards Grid (Endpoint: /api/dashboard/panitera/bas/:id/summary) -->
    <DashboardPaniteraBasKpiCards />

    <!-- Filter & Tabel Perkara BAS (Endpoint: /api/dashboard/panitera/bas/:id/list) -->
    <DashboardPaniteraBasTabelPerkaraBas />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePaniteraBas()
</script>
