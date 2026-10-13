<template>
  <div class="space-y-6">
    <!-- Quick Sub-Navigation Menu Persidangan -->
    <PersidanganSubNavMenu />

    <!-- Header Banner & Action Buttons -->
    <PersidanganHeaderBanner />

    <!-- 5 KPI & Notifikasi Cards (Sesuai Menu Monev) -->
    <PersidanganKpiNotifikasiCards />

    <!-- Tabel Dinamis Sesuai Tab Terpilih -->
    <Transition name="fade" mode="out-in">
      <div :key="activeTab">
        <!-- 1. Penundaan Sidang Belum di-Isi -->
        <PersidanganTabelPenundaanBelumDiisi v-if="activeTab === 'penundaan'" />

        <!-- 2. Ruang Sidang Belum di-Isi (Khusus Sidang di Kantor) -->
        <PersidanganTabelRuangSidangKosong v-else-if="activeTab === 'ruang_sidang'" />

        <!-- 3. Perkara Ditegur / Ditentukan Kemudian (Mediasi) -->
        <PersidanganTabelDitegurDitentukanKmdn v-else-if="activeTab === 'ditegur'" />

        <!-- 4. Jadwal Sidang Pengadilan -->
        <PersidanganTabelJadwalSidang v-else-if="activeTab === 'jadwal'" />

        <!-- 5. Jadwal Sidang Keliling Tidak Ditentukan -->
        <PersidanganTabelSidangKelilingBelumDitentukan v-else-if="activeTab === 'sidang_keliling'" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
useHead({
  title: 'Monitoring Persidangan SIPP - Monev Sidang'
})

const route = useRoute()
const { activeTab, setActiveTab } = usePersidangan()

// Tangkap query param jika user mengakses via direct link /persidangan?tab=...
onMounted(() => {
  if (route.query.tab && typeof route.query.tab === 'string') {
    const validTabs = ['penundaan', 'ruang_sidang', 'ditegur', 'jadwal', 'sidang_keliling']
    if (validTabs.includes(route.query.tab)) {
      setActiveTab(route.query.tab)
    }
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string') {
    const validTabs = ['penundaan', 'ruang_sidang', 'ditegur', 'jadwal', 'sidang_keliling']
    if (validTabs.includes(newTab)) {
      setActiveTab(newTab)
    }
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
