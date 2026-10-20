<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Terpadu -->
    <PendidikanDispensasiHeaderBanner />

    <!-- 5 Kartu KPI Rekapitulasi -->
    <PendidikanDispensasiKpiCards />

    <!-- Tabel Rekapitulasi Tingkat Pendidikan Anak Dispensasi Nikah -->
    <PendidikanDispensasiTabelPendidikanDispensasi />

    <!-- Modal Detail Perkara / Anak Berdasarkan Tingkat Pendidikan -->
    <PendidikanDispensasiModalDetailPendidikanDispensasi />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePendidikanDispensasi()
useHead({
  title: 'Statistik Geografi - Pendidikan Dispensasi Nikah'
})
</script>
