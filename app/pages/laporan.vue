<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <LaporanHeaderBanner />

    <!-- SubNav Menu: Katalog LIPA, Input Manual DIPA, Monitoring Pelaporan -->
    <LaporanSubNavMenu />

    <!-- 1. TAB: KATALOG LAPORAN LIPA & RK -->
    <template v-if="activeMainTab === 'katalog'">
      <!-- QuickPicker Bar: Searchable Selector for all 28+ LIPA & RK reports -->
      <LaporanQuickPicker />

      <!-- 4 Ringkasan Angka Utama Dinamis (Endpoint: /api/laporan/ringkasan) -->
      <LaporanRingkasanKpiCards />

      <!-- Tabel Matriks Universal (Endpoint: /api/laporan/detail) -->
      <LaporanMatriksKeadaanPerkara />
    </template>

    <!-- 2. TAB: INPUT MANUAL DIPA -->
    <template v-else-if="activeMainTab === 'input_manual'">
      <LaporanManualInputSection />
    </template>

    <!-- 3. TAB: MONITORING PELAPORAN -->
    <template v-else-if="activeMainTab === 'monitoring'">
      <LaporanMonitoringSection />
    </template>
  </div>
</template>

<script setup>
const { activeMainTab } = useLaporan()
</script>
