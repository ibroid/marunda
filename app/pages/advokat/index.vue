<template>
  <div class="space-y-6">
    <!-- Header Banner & Summary Statistik Advokat -->
    <AdvokatHeaderBanner />

    <!-- Form Pencarian & Filter Status Advokat -->
    <AdvokatFilterCard />

    <!-- Tabel Daftar Advokat & Kuasa Hukum -->
    <AdvokatTabelAdvokat />

    <!-- Modal Detail Advokat & Daftar Perkara Kuasa -->
    <AdvokatModalDetailAdvokat />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useAdvokat()
</script>
