<template>
  <div class="space-y-6">
    <!-- Header Banner & Summary Statistik Pihak SIPP -->
    <PrincipalHeaderBanner />

    <!-- Form Pencarian & Filter Kriteria -->
    <PrincipalFilterCard />

    <!-- Tabel Hasil Pencarian Principal -->
    <PrincipalTabelPrincipal />

    <!-- Modal Detail Pihak & Riwayat Perkara -->
    <PrincipalModalDetailPrincipal />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara terdistribusi per-komponen
// melalui composable usePrincipal() sesuai standar arsitektur Monev SIPP
</script>
