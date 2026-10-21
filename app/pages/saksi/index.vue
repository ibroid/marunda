<template>
  <div class="space-y-6">
    <!-- Header Banner & Summary Statistik Saksi SIPP -->
    <SaksiHeaderBanner />

    <!-- Form Pencarian & Filter Kriteria Saksi -->
    <SaksiFilterCard />

    <!-- Tabel Daftar Saksi Persidangan -->
    <SaksiTabelSaksi />

    <!-- Modal Detail Saksi & Transkrip Keterangan Persidangan -->
    <SaksiModalDetailSaksi />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useSaksi()
// sesuai standar arsitektur Monev SIPP.
</script>
