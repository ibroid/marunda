<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <LaporanLipa4HeaderBanner
      :nama-satker="namaSatker"
      :is-exporting="isExporting"
      @export="handleExportExcel"
    />

    <!-- Ringkasan KPI Cards LIPA 4 (Pemuatan Paralel Sesuai Standar Arsitektur) -->
    <LaporanLipa4KpiCards @loaded="onKpiLoaded" />

    <!-- Tabel Detail Perkara PK 10 Kolom Sesuai Format Resmi LIPA 4 -->
    <LaporanLipa4TableLipa4
      :nama-satker="namaSatker"
      :pejabat="pejabat"
    />
  </div>
</template>

<script setup>
useHead({
  title: '(LIPA 4) Laporan PK - SIPP Monev'
})

const {
  selectedYear,
  selectedMonth,
  getNamaBulan
} = useLipa4()

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

// Fungsi Ekspor Excel Resmi LIPA 4 Sesuai Format Asli Badilag
const handleExportExcel = async () => {
  try {
    isExporting.value = true

    const queryParams = new URLSearchParams({
      year: String(selectedYear.value),
      month: String(selectedMonth.value)
    })

    const url = `/api/laporan/lipa4/export?${queryParams.toString()}`

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
    a.download = `LIPA_4_${bulanStr}_${selectedYear.value}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)

    toast.add({
      title: 'Berhasil Ekspor Excel',
      description: `File LIPA 4 bulan ${bulanStr} ${selectedYear.value} berhasil diunduh.`,
      color: 'emerald',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err) {
    console.error('Gagal ekspor excel LIPA 4:', err)
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
