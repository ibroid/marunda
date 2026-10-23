<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <LaporanLipa6HeaderBanner
      :nama-satker="namaSatker"
      :is-exporting="isExporting"
      @export="handleExportExcel"
    />

    <!-- Ringkasan KPI Cards LIPA 6 (Pemuatan Paralel Sesuai Standar Arsitektur) -->
    <LaporanLipa6KpiCards @loaded="onKpiLoaded" />

    <!-- Tabel Rekapitulasi Kegiatan Hakim 16 Kolom Sesuai Format Resmi LIPA 6 & Screenshot -->
    <LaporanLipa6TableLipa6
      :nama-satker="namaSatker"
      :pejabat="pejabat"
    />
  </div>
</template>

<script setup>
useHead({
  title: '(LIPA 6) Laporan Penanganan Hakim - SIPP Monev'
})

const {
  selectedYear,
  selectedMonth,
  selectedRole,
  getNamaBulan
} = useLipa6()

const namaSatker = ref('PENGADILAN AGAMA JAKARTA UTARA')
const pejabat = ref({
  ketuaNama: 'Dr. Khoiriyah Roihan, S.Ag., M.H.',
  ketuaNip: '197409261999032001',
  paniteraNama: 'H. Dede Supriadi, S.H., M.H.',
  paniteraNip: '197305041998031002',
  kotaSatker: 'Jakarta Utara'
})
const isExporting = ref(false)
const toast = useToast()

const onKpiLoaded = (payload) => {
  if (payload?.namaSatker) {
    namaSatker.value = payload.namaSatker
  }
  if (payload?.pejabat) {
    pejabat.value = payload.pejabat
  }
}

// Fungsi Ekspor Excel Resmi LIPA 6 Sesuai Format Asli Badilag
const handleExportExcel = async () => {
  try {
    isExporting.value = true

    const queryParams = new URLSearchParams({
      year: String(selectedYear.value),
      month: String(selectedMonth.value),
      role: selectedRole.value
    })

    const url = `/api/laporan/lipa6/export?${queryParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      let errMsg = response.statusText
      try {
        const errJson = await response.json()
        if (errJson?.message) errMsg = errJson.message
      } catch {}
      throw new Error(errMsg || `Gagal mengunduh file Excel (${response.status})`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl

    const bulanStr = getNamaBulan(selectedMonth.value)
    a.download = `LIPA_6_${bulanStr}_${selectedYear.value}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)

    toast.add({
      title: 'Berhasil Ekspor Excel',
      description: `File LIPA 6 bulan ${bulanStr} ${selectedYear.value} berhasil diunduh.`,
      color: 'emerald',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err) {
    console.error('Gagal ekspor excel LIPA 6:', err)
    toast.add({
      title: 'Gagal Ekspor Excel',
      description: err?.message || 'Terjadi kesalahan saat memproses ekspor Excel.',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    isExporting.value = false
  }
}
</script>
