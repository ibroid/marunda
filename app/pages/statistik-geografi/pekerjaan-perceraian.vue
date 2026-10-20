<template>
  <div class="space-y-6">
    <!-- Header Banner & Filter Terpadu -->
    <PekerjaanPerceraianHeaderBanner />

    <!-- 5 Kartu KPI Rekapitulasi -->
    <PekerjaanPerceraianKpiCards />

    <!-- Tabel Rekapitulasi Profesi / Pekerjaan Pengaju Perceraian -->
    <PekerjaanPerceraianTabelPekerjaanPerceraian />
  </div>
</template>

<script setup>
import PekerjaanPerceraianHeaderBanner from '~/components/pekerjaan-perceraian/HeaderBanner.vue'
import PekerjaanPerceraianKpiCards from '~/components/pekerjaan-perceraian/KpiCards.vue'
import PekerjaanPerceraianTabelPekerjaanPerceraian from '~/components/pekerjaan-perceraian/TabelPekerjaanPerceraian.vue'

// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable usePekerjaanPerceraian()
useHead({
  title: 'Statistik Geografi - Pekerjaan Perceraian'
})
</script>
