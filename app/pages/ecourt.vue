<template>
  <div class="space-y-6">
    <!-- Header Banner & Refresh Controller -->
    <EcourtHeaderBanner />

    <!-- 4 Kartu Adopsi e-Court (Tahun, Bulan, Minggu, Hari) -->
    <EcourtAdopsiCards />

    <!-- Komparasi Volume e-Court vs Konvensional -->
    <EcourtKomparasiVolume />

    <!-- Grafik & Rincian Bulanan e-Court vs Konvensional -->
    <EcourtGrafikBulanan />

    <!-- Statistik Tematik Perkara (Perceraian, Dispensasi, Prodeo, Akta Cerai) -->
    <EcourtStatistikTematik />

    <!-- Modal Detail Perkara Bulanan -->
    <EcourtModalDetailBulan />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useEcourt()
</script>
