<template>
  <div class="space-y-6">
    <!-- 1. Header Banner & Action Buttons -->
    <KontrolNonKabulHeaderBanner />

    <!-- 2. Ringkasan KPI Metric Cards (Endpoint: /api/kontrol/non-kabul/summary) -->
    <KontrolNonKabulSummaryCards />

    <!-- 3. Tabel Rincian Perkara Non-Kabul & Pagination (Endpoint: /api/kontrol/non-kabul/list) -->
    <KontrolNonKabulTabelNonKabul />
  </div>
</template>

<script setup>
useHead({
  title: 'Kontrol Perkara Non Kabul (Non Kabu) - Monitoring SIPP'
})
</script>
