<template>
  <div class="space-y-6">
    <!-- 1. Header Banner & Action Buttons -->
    <KontrolBelumMinutasiHeaderBanner />

    <!-- 2. Ringkasan KPI Metric Cards (Endpoint: /api/kontrol/belum-minutasi/summary) -->
    <KontrolBelumMinutasiSummaryCards />

    <!-- 3. Tabel Daftar Perkara Belum Minutasi & Pagination (Endpoint: /api/kontrol/belum-minutasi/list) -->
    <KontrolBelumMinutasiTabelBelumMinutasi />
  </div>
</template>

<script setup>
useHead({
  title: 'Kontrol Perkara Belum Minutasi - Monitoring SIPP'
})
</script>
