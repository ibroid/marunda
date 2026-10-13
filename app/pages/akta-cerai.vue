<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <AktaCeraiHeaderBanner />

    <!-- 3 Kategori Kartu Monitoring (Endpoint: /api/akta-cerai/summary) -->
    <AktaCeraiKategoriCards />

    <!-- Tabel Rincian Data Perkara (Endpoint: /api/akta-cerai/detail) -->
    <AktaCeraiTabelDetailPerkara />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useAktaCerai()
</script>
