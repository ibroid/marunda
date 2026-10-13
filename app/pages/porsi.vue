<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Controller -->
    <PorsiHeaderBanner />

    <!-- Tab Pilihan: Panitera Pengganti vs Majelis Hakim -->
    <PorsiTabSelector />

    <!-- Section Beban Kerja Panitera Pengganti (Endpoint: /api/porsi/pp) -->
    <PorsiBebanPpSection v-show="activeTab === 'pp'" />

    <!-- Section Beban Kerja Majelis Hakim (Endpoint: /api/porsi/hakim) -->
    <PorsiBebanHakimSection v-show="activeTab === 'hakim'" />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePorsi()
const { activeTab } = usePorsi()
</script>
