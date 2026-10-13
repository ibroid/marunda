<template>
  <div class="space-y-6">
    <!-- Header Banner & Refresh Controller -->
    <KontrolHeaderBanner />

    <!-- 1. Audit Kepatuhan Penetapan Awal -->
    <KontrolAuditPenetapanCards />

    <!-- 2. Audit Tunggakan Usia Perkara (Aging Cases) -->
    <KontrolAgingTunggakanCards />

    <!-- 3. Tabel Detail Perkara Sesuai Kategori Terpilih -->
    <KontrolTabelDetailPerkara />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useKontrol()
</script>
