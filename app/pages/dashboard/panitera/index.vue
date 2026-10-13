<template>
  <div class="space-y-6">
    <!-- Header Banner Panitera -->
    <DashboardPaniteraHeaderBanner />

    <!-- Kotak Atensi & Peringatan Dini Panitera (5 Kartu) -->
    <DashboardPaniteraAtensiCards />

    <!-- Section Kinerja Panitera Pengganti (PP) & Jurusita (JSP) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tabel Kinerja BAS per Panitera Pengganti -->
      <DashboardPaniteraKinerjaPpTable />
      <!-- Beban Tugas Jurusita / Jurusita Pengganti -->
      <DashboardPaniteraKinerjaJspTable />
    </div>

    <!-- Section: Detail Perkara Pasca Putus (Akta Cerai & Ikrar Talak) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Cerai Gugat Sudah BHT Belum Akta Cerai -->
      <DashboardPaniteraCeraiGugatCard />
      <!-- Cerai Talak Sudah BHT Belum Ikrar Talak -->
      <DashboardPaniteraCeraiTalakCard />
    </div>

    <!-- Modal Daftar Perkara Belum Minutasi -->
    <DashboardPaniteraModalMinutasi />
  </div>
</template>

<script setup>
// State dan reaktivitas dihandle secara modular dan terdistribusi
// oleh masing-masing komponen melalui composable useDashboardPanitera()
</script>
