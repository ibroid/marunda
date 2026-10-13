<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Switcher -->
    <KinerjaHakimHeaderBanner />

    <!-- KPI Metric Cards Grid (Endpoint: /api/kinerja/hakim/:id/summary) -->
    <KinerjaHakimKpiCards />

    <!-- Grafik Tren Bulanan & Distribusi Jenis Perkara (Endpoint: /api/kinerja/hakim/:id/grafik) -->
    <KinerjaHakimGrafikKinerja />

    <!-- Peringatan Dini & Atensi Kinerja / EWS (Endpoint: /api/kinerja/hakim/:id/atensi) -->
    <KinerjaHakimAtensiKhusus />

    <!-- Filter Tab & Tabel Rincian Perkara (Endpoint: /api/kinerja/hakim/:id/list) -->
    <KinerjaHakimTabelPerkara />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useKinerjaHakimDetail()
</script>
