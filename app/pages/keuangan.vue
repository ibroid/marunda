<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <KeuanganHeaderBanner />

    <!-- Filter Rentang Tanggal Transaksi -->
    <KeuanganFilterDateCard />

    <!-- Ringkasan Mutasi Kas Cards (Endpoint: /api/keuangan/ringkasan) -->
    <KeuanganRingkasanKasCards />

    <!-- Tabel Buku Kas Transaksi SIPP (Endpoint: /api/keuangan/transaksi) -->
    <KeuanganTabelBukuKas />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useKeuangan()
</script>
