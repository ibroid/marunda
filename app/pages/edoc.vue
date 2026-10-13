<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <EdocHeaderBanner />

    <!-- Ringkasan Kepatuhan Cards (Endpoint: /api/edoc/summary) -->
    <EdocRingkasanKepatuhanCards />

    <!-- Tabel Rincian Detail e-Doc (Endpoint: /api/edoc/detail) -->
    <EdocTabelDetailEdoc />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useEdoc()
</script>
