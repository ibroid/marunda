<template>
  <div class="space-y-6">
    <!-- Header Banner Ketua -->
    <DashboardKetuaHeaderBanner />

    <!-- KPI Metric Cards Grid (6 Kartu, data summary & aging terdistribusi) -->
    <DashboardKetuaKpiCards />

    <!-- Kotak Atensi & Peringatan Dini Ketua -->
    <DashboardKetuaAtensiKhusus />

    <!-- Section: Aging Perkara & Beban Majelis Hakim -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Monitoring Usia Perkara (Aging Cases) -->
      <DashboardKetuaAgingCases />
      <!-- Beban Kerja Majelis Hakim -->
      <DashboardKetuaBebanHakim />
    </div>

    <!-- Section: Mediasi & Upaya Hukum -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Efektivitas Mediasi -->
      <DashboardKetuaMediasiCard />
      <!-- Upaya Hukum (Banding, Kasasi, PK) -->
      <DashboardKetuaUpayaHukumCard />
    </div>

    <!-- Tabel Detail Perkara Tunggakan (> 90 Hari) -->
    <DashboardKetuaTabelTunggakan />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useDashboardKetua()
</script>
