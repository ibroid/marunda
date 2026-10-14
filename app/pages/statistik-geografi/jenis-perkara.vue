<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Terpadu -->
    <GeografiJenisHeaderBanner />

    <!-- 5 Kartu KPI Rekapitulasi Jenis Perkara -->
    <GeografiJenisKpiCards />

    <!-- Tabel Rekapitulasi 30 Jenis Perkara Pengadilan Agama (ID 341 - 371) -->
    <GeografiJenisTabelJenisPerkara />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useStatistikJenisPerkara()
useHead({
  title: 'Statistik Geografi - Jenis Perkara'
})
</script>
