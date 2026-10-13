<template>
  <div class="space-y-6">
    <!-- 1. Header Banner & Refresh Controller (Tahun & Action) -->
    <KinerjaHeaderBanner />

    <!-- 2. Ringkasan Data Dasar Perkara (Parallel Endpoint /api/kinerja/summary) -->
    <KinerjaSummaryCards />

    <!-- 3. Skor Akhir & Total Persentase Banner (Parallel Endpoint /api/kinerja/skor) -->
    <KinerjaSkorBanner />

    <!-- 4. 6 Indikator Penilaian Kinerja Grid (Parallel Endpoint /api/kinerja/indikator) -->
    <KinerjaIndikatorCards />

    <!-- 5. Grafik Tren Bulanan Perkara (Parallel Endpoint /api/kinerja/grafik) -->
    <KinerjaGrafikTren />

    <!-- 6. Peringatan Dini Kepatuhan & Potensi Pinalti (Parallel Endpoint /api/kinerja/atensi) -->
    <KinerjaAtensiKhusus />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useKinerja()
useHead({
  title: 'Raport & Penilaian Kinerja SIPP - Monev SIPP'
})
</script>
