<template>
  <div class="space-y-6">
    <!-- Header Banner Minutasi & Action Buttons -->
    <DashboardPaniteraMinutasiHeaderBanner />

    <!-- Tabel Minutasi & Pagination (Endpoint: /api/dashboard/panitera/minutasi/list) -->
    <DashboardPaniteraMinutasiTabelMinutasi />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePaniteraMinutasi()
</script>
