<template>
  <div class="space-y-6">
    <!-- 1. Header Banner & Refresh Controller -->
    <KontrolBerkasHeaderBanner />

    <!-- 2. Form Pemilih Periode Bulan & Tahun -->
    <KontrolBerkasFilterCard />

    <!-- 3. Prompt Edukatif Sebelum User Memilih Bulan & Submit Filter -->
    <KontrolBerkasPromptSelect v-if="!isFilterApplied" />

    <!-- 4. Konten Data (Hanya dimuat setelah bulan & tahun dipilih dan disubmit) -->
    <template v-else>
      <!-- Summary KPI Metric Cards (Endpoint: /api/kontrol/berkas-penetapan/summary) -->
      <KontrolBerkasSummaryCards />

      <!-- Tabel Detail Perkara & Status Upload (Endpoint: /api/kontrol/berkas-penetapan/list) -->
      <KontrolBerkasTabelDetail />
    </template>
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useKontrolBerkasPenetapan()
const { isFilterApplied } = useKontrolBerkasPenetapan()
</script>
