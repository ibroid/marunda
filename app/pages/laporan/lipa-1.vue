<template>
  <div class="space-y-6">
    <!-- Header Banner & Action Buttons -->
    <LaporanLipa1HeaderBanner
      :nama-satker="namaSatker"
      :is-exporting="isExporting"
      @export="handleExportExcel"
    />

    <!-- Tabel Rekapitulasi Sesuai Format Resmi Gambar 2 -->
    <LaporanLipa1RekapitulasiTable @loaded="onRekapLoaded" />

    <!-- Tabel Detail Keadaan Perkara 14 Kolom Sesuai Gambar 1 & 2 -->
    <LaporanLipa1TableLipa1 />
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  selectedAlur,
  formatTanggal,
  getNamaBulan
} = useLipa1()

const namaSatker = ref('PENGADILAN AGAMA JAKARTA UTARA')
const currentRekap = ref(null)
const isExporting = ref(false)
const toast = useToast()

const onRekapLoaded = (payload) => {
  if (payload?.namaSatker) {
    namaSatker.value = payload.namaSatker
  }
  if (payload?.rekap) {
    currentRekap.value = payload.rekap
  }
}

// Fungsi Ekspor Excel Resmi LIPA 1 Sesuai Format Asli
const handleExportExcel = async () => {
  try {
    isExporting.value = true

    const queryParams = new URLSearchParams({
      year: String(selectedYear.value),
      month: String(selectedMonth.value),
      alur: selectedAlur.value
    })

    const url = `/api/laporan/lipa1/export?${queryParams.toString()}`

    // Trigger download menggunakan blob anchor agar file terunduh langsung dan rapi
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
    a.download = `LIPA_1_${bulanStr}_${selectedYear.value}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)

    toast.add({
      title: 'Berhasil Ekspor Excel',
      description: `File LIPA 1 bulan ${bulanStr} ${selectedYear.value} berhasil diunduh.`,
      color: 'emerald',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err) {
    console.error('Gagal ekspor excel LIPA 1:', err)
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
