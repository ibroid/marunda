<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <RegisterHeaderBanner />

    <!-- Filter Bar: Tab Register & Kolom Cari (Endpoint: /api/register/summary) -->
    <RegisterTabsCard />

    <!-- Tabel Buku Register Digital (Endpoint: /api/register/list) -->
    <RegisterTabelRegisterDigital />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useRegister()
</script>
