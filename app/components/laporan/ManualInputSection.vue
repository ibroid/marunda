<template>
  <div class="space-y-6">
    <!-- Header Sub-Tabs Input Manual -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          Pengelolaan & Input Laporan Manual DIPA
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">
          Pengisian realisasi DIPA 04, Master Pagu Satker, dan Pertanggungjawaban Uang Iwadl &bull; Tahun Anggaran {{ selectedYear }}
        </p>
      </div>

      <!-- Tab Switcher -->
      <div class="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
        <button
          v-for="tab in manualTabs"
          :key="tab.id"
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
          :class="[
            activeManualTab === tab.id
              ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
          @click="activeManualTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 1. TAB: MASTER PAGU DIPA -->
    <div v-if="activeManualTab === 'pagu'" class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                Master Pagu Anggaran DIPA Satker (Tahun {{ selectedYear }})
              </h4>
              <p class="text-xs text-gray-500">
                Pagu awal dan pagu revisi menjadi dasar perhitungan persentase serapan pada LIPA 14, 15, 16, dan 27.
              </p>
            </div>
            <UButton
              color="primary"
              size="sm"
              icon="i-heroicons-check"
              :loading="isSavingPagu"
              @click="savePagu"
            >
              Simpan Perubahan Pagu
            </UButton>
          </div>
        </template>

        <div v-if="isLoadingPagu" class="space-y-4 py-4 animate-pulse">
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-10 w-full" />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Sidang Keliling -->
          <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-primary-700 dark:text-primary-400">1. Sidang di Luar Gedung (LIPA 14)</span>
              <UBadge size="xs" color="blue" variant="subtle">04.1049.994</UBadge>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Awal (Rp)</label>
                <UInput v-model.number="paguForm.pagu_sidkel" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Revisi (Rp)</label>
                <UInput v-model.number="paguForm.pagu_sidkel_revisi" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Target Kegiatan</label>
                <UInput v-model.number="paguForm.target_sidkel" type="number" size="sm" class="mt-1" />
              </div>
            </div>
          </div>

          <!-- Pembebasan Biaya Perkara (Prodeo) -->
          <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-emerald-700 dark:text-emerald-400">2. Prodeo / Bebas Biaya (LIPA 15)</span>
              <UBadge size="xs" color="emerald" variant="subtle">04.1049.995</UBadge>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Awal (Rp)</label>
                <UInput v-model.number="paguForm.pagu_prodeo" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Revisi (Rp)</label>
                <UInput v-model.number="paguForm.pagu_prodeo_revisi" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Target Perkara</label>
                <UInput v-model.number="paguForm.target_prodeo" type="number" size="sm" class="mt-1" />
              </div>
            </div>
          </div>

          <!-- Pos Bantuan Hukum (Posbakum) -->
          <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-amber-700 dark:text-amber-400">3. Pos Bantuan Hukum (LIPA 16)</span>
              <UBadge size="xs" color="amber" variant="subtle">04.1049.996</UBadge>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Awal (Rp)</label>
                <UInput v-model.number="paguForm.pagu_posbakum" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Revisi (Rp)</label>
                <UInput v-model.number="paguForm.pagu_posbakum_revisi" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Target Jam Layanan</label>
                <UInput v-model.number="paguForm.target_posbakum" type="number" size="sm" class="mt-1" />
              </div>
            </div>
          </div>

          <!-- Pelayanan Terpadu -->
          <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/40">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-purple-700 dark:text-purple-400">4. Pelayanan Terpadu (LIPA 27)</span>
              <UBadge size="xs" color="purple" variant="subtle">04.1049.997</UBadge>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Awal (Rp)</label>
                <UInput v-model.number="paguForm.pagu_pelayanan_terpadu" type="number" size="sm" class="mt-1" />
              </div>
              <div>
                <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">Pagu Revisi (Rp)</label>
                <UInput v-model.number="paguForm.pagu_pelayanan_terpadu_revisi" type="number" size="sm" class="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 2. TAB: UANG IWADL (LIPA 11) -->
    <div v-else-if="activeManualTab === 'iwadl'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form Input Transaksi Iwadl -->
        <UCard class="lg:col-span-1">
          <template #header>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              Pencatatan Uang Iwadl
            </h4>
            <p class="text-xs text-gray-500">Penerimaan & penyetoran uang Iwadl ke BAZNAS</p>
          </template>

          <form class="space-y-3" @submit.prevent="saveIwadl">
            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Nomor Perkara *</label>
              <UInput
                v-model="iwadlForm.nomor_perkara"
                placeholder="misal: 0123/Pdt.G/2026/PA.Pml"
                size="sm"
                class="mt-1"
                required
              />
            </div>

            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Tanggal Diterima *</label>
              <UInput
                v-model="iwadlForm.diterima_tgl"
                type="date"
                size="sm"
                class="mt-1"
                required
              />
            </div>

            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Jumlah Diterima (Rp) *</label>
              <UInput
                v-model.number="iwadlForm.diterima"
                type="number"
                size="sm"
                class="mt-1"
                required
              />
            </div>

            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Tanggal Disetor ke BAZNAS</label>
              <UInput
                v-model="iwadlForm.disetor_tgl"
                type="date"
                size="sm"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Rekening BKM / Bukti Setor</label>
              <UInput
                v-model="iwadlForm.rekening_bkm"
                placeholder="Nomor rekening / No BKM"
                size="sm"
                class="mt-1"
              />
            </div>

            <div class="pt-2">
              <UButton
                type="submit"
                color="primary"
                block
                size="sm"
                icon="i-heroicons-arrow-down-tray"
                :loading="isSavingIwadl"
              >
                Simpan Transaksi Iwadl
              </UButton>
            </div>
          </form>
        </UCard>

        <!-- Tabel Riwayat Transaksi Iwadl -->
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Daftar Transaksi Uang Iwadl (Tahun {{ selectedYear }})
                </h4>
                <p class="text-xs text-gray-500">
                  Total Diterima: Rp {{ formatNumber(iwadlSummary?.totalDiterima) }} &bull; Disetor: Rp {{ formatNumber(iwadlSummary?.totalDisetor) }}
                </p>
              </div>
              <UBadge size="xs" color="primary" variant="subtle">
                Saldo: Rp {{ formatNumber(iwadlSummary?.sisaKasIwadl) }}
              </UBadge>
            </div>
          </template>

          <div class="overflow-x-auto max-h-96">
            <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold sticky top-0">
                <tr>
                  <th class="px-3 py-2.5">No Perkara</th>
                  <th class="px-3 py-2.5 text-center">Tgl Terima</th>
                  <th class="px-3 py-2.5 text-right">Jumlah (Rp)</th>
                  <th class="px-3 py-2.5 text-center">Tgl Setor</th>
                  <th class="px-3 py-2.5 text-center">Status</th>
                  <th class="px-3 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(row, idx) in iwadlRows" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">{{ row.nomor_perkara }}</td>
                  <td class="px-3 py-2 text-center">{{ formatDate(row.diterima_tgl) }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ formatNumber(row.diterima) }}</td>
                  <td class="px-3 py-2 text-center">{{ formatDate(row.disetor_tgl) }}</td>
                  <td class="px-3 py-2 text-center">
                    <UBadge size="xs" :color="row.status_setor === 'Sudah Disetor' ? 'emerald' : 'amber'" variant="subtle">
                      {{ row.status_setor }}
                    </UBadge>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <UButton
                      color="red"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      size="xs"
                      @click="deleteIwadl(row.nomor_perkara)"
                    />
                  </td>
                </tr>
                <tr v-if="iwadlRows.length === 0">
                  <td colspan="6" class="px-3 py-8 text-center text-gray-400">
                    Belum ada data transaksi Iwadl untuk tahun {{ selectedYear }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>

    <!-- 3. TAB: BULANAN DIPA (SIDKEL / PRODEO / POSBAKUM / YANDU) -->
    <div v-else class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                Realisasi Bulanan {{ getDipaTitle(activeManualTab) }} (Tahun {{ selectedYear }})
              </h4>
              <p class="text-xs text-gray-500">
                Pagu: Rp {{ formatNumber(dipaData?.pagu?.efektif) }} &bull; Total Realisasi: Rp {{ formatNumber(dipaData?.pagu?.totalRealisasi) }} ({{ dipaData?.pagu?.persentaseRealisasi }}%)
              </p>
            </div>
            <UBadge size="xs" color="emerald" variant="solid">
              Sisa Pagu: Rp {{ formatNumber(dipaData?.pagu?.sisaPagu) }}
            </UBadge>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
              <tr>
                <th class="px-3 py-2.5 text-center w-12">Bln</th>
                <th class="px-3 py-2.5">Bulan</th>
                <th class="px-3 py-2.5 text-right">Realisasi s/d Lalu (Rp)</th>
                <th class="px-3 py-2.5 text-right font-bold text-primary-600">Realisasi Bulan Ini (Rp)</th>
                <th class="px-3 py-2.5 text-right">Total Kumulatif (Rp)</th>
                <th class="px-3 py-2.5 text-center">Kegiatan</th>
                <th class="px-3 py-2.5 text-center">Perkara</th>
                <th class="px-3 py-2.5">Keterangan</th>
                <th class="px-3 py-2.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="m in (dipaData?.months || [])"
                :key="m.bulan"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td class="px-3 py-2.5 text-center font-mono">{{ m.bulan }}</td>
                <td class="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{{ m.nama_bulan }}</td>
                <td class="px-3 py-2.5 text-right font-mono">{{ formatNumber(m.bulan_lalu) }}</td>
                <td class="px-3 py-2.5 text-right font-mono font-bold text-primary-600">{{ formatNumber(m.bulan_ini) }}</td>
                <td class="px-3 py-2.5 text-right font-mono">{{ formatNumber(m.total_serapan) }}</td>
                <td class="px-3 py-2.5 text-center">{{ m.kegiatan }}</td>
                <td class="px-3 py-2.5 text-center">{{ m.perkara }}</td>
                <td class="px-3 py-2.5 text-gray-500">{{ m.keterangan || '-' }}</td>
                <td class="px-3 py-2.5 text-center">
                  <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-pencil"
                    @click="openEditMonth(m)"
                  >
                    Edit
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- MODAL EDIT REALISASI BULANAN DIPA -->
    <UModal v-model="isModalEditOpen">
      <div class="p-6 space-y-4">
        <h4 class="text-base font-bold text-gray-900 dark:text-white">
          Input Realisasi {{ editMonthForm.nama_bulan }} {{ selectedYear }}
        </h4>

        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Realisasi Bulan Ini (Rp)</label>
            <UInput v-model.number="editMonthForm.bulan_ini" type="number" size="sm" class="mt-1" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Jumlah Kegiatan</label>
              <UInput v-model.number="editMonthForm.kegiatan" type="number" size="sm" class="mt-1" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Jumlah Perkara</label>
              <UInput v-model.number="editMonthForm.perkara" type="number" size="sm" class="mt-1" />
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Keterangan / Lokasi Kegiatan</label>
            <UInput v-model="editMonthForm.keterangan" placeholder="Keterangan pelaksanaan..." size="sm" class="mt-1" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t">
          <UButton color="gray" variant="ghost" size="sm" @click="isModalEditOpen = false">
            Batal
          </UButton>
          <UButton color="primary" size="sm" :loading="isSavingMonth" @click="saveMonthRealisasi">
            Simpan Realisasi
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup>
const { selectedYear, activeManualTab, triggerRefresh } = useLaporan()

const manualTabs = [
  { id: 'pagu', label: 'Master Pagu DIPA' },
  { id: 'iwadl', label: 'Uang Iwadl (LIPA 11)' },
  { id: 'sidkel', label: 'Sidang Keliling (LIPA 14)' },
  { id: 'prodeo', label: 'Prodeo DIPA (LIPA 15)' },
  { id: 'posbakum', label: 'Posbakum (LIPA 16)' },
  { id: 'yandu', label: 'Pelayanan Terpadu (LIPA 27)' }
]

// State Pagu
const isSavingPagu = ref(false)
const paguForm = reactive({
  pagu_sidkel: 0,
  pagu_sidkel_revisi: 0,
  target_sidkel: 0,
  pagu_prodeo: 0,
  pagu_prodeo_revisi: 0,
  target_prodeo: 0,
  pagu_posbakum: 0,
  pagu_posbakum_revisi: 0,
  target_posbakum: 0,
  pagu_pelayanan_terpadu: 0,
  pagu_pelayanan_terpadu_revisi: 0
})

const { data: paguData, pending: isLoadingPagu, refresh: refreshPagu } = useLazyFetch('/api/laporan/manual/pagu', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

watch(paguData, (val) => {
  if (val?.data) {
    Object.assign(paguForm, val.data)
  }
}, { immediate: true })

async function savePagu() {
  isSavingPagu.value = true
  try {
    const res = await $fetch('/api/laporan/manual/pagu', {
      method: 'POST',
      body: {
        tahun: selectedYear.value,
        ...paguForm
      }
    })
    if (res.success) {
      alert(res.message)
      refreshPagu()
      triggerRefresh()
    }
  } catch (err) {
    alert('Gagal menyimpan pagu: ' + err.message)
  } finally {
    isSavingPagu.value = false
  }
}

// State Uang Iwadl
const isSavingIwadl = ref(false)
const iwadlForm = reactive({
  nomor_perkara: '',
  diterima_tgl: new Date().toISOString().slice(0, 10),
  diterima: 10000,
  disetor_tgl: '',
  rekening_bkm: ''
})

const { data: iwadlData, refresh: refreshIwadl } = useLazyFetch('/api/laporan/manual/iwadl', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const iwadlRows = computed(() => iwadlData.value?.rows || [])
const iwadlSummary = computed(() => iwadlData.value?.summary || {})

async function saveIwadl() {
  isSavingIwadl.value = true
  try {
    const res = await $fetch('/api/laporan/manual/iwadl', {
      method: 'POST',
      body: { ...iwadlForm }
    })
    if (res.success) {
      alert(res.message)
      iwadlForm.nomor_perkara = ''
      iwadlForm.disetor_tgl = ''
      iwadlForm.rekening_bkm = ''
      refreshIwadl()
      triggerRefresh()
    }
  } catch (err) {
    alert('Gagal menyimpan Iwadl: ' + err.message)
  } finally {
    isSavingIwadl.value = false
  }
}

async function deleteIwadl(nomorPerkara) {
  if (!confirm(`Hapus data Iwadl perkara ${nomorPerkara}?`)) return
  try {
    const res = await $fetch('/api/laporan/manual/iwadl', {
      method: 'POST',
      body: { action: 'delete', nomor_perkara: nomorPerkara }
    })
    if (res.success) {
      refreshIwadl()
      triggerRefresh()
    }
  } catch (err) {
    alert('Gagal menghapus Iwadl: ' + err.message)
  }
}

// State Realisasi Bulanan DIPA
const isModalEditOpen = ref(false)
const isSavingMonth = ref(false)
const editMonthForm = reactive({
  bulan: 1,
  nama_bulan: '',
  bulan_ini: 0,
  kegiatan: 0,
  perkara: 0,
  keterangan: ''
})

const { data: dipaData, refresh: refreshDipa } = useLazyFetch('/api/laporan/manual/dipa-bulanan', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    jenis: activeManualTab.value
  })),
  watch: [selectedYear, activeManualTab],
  default: () => null
})

function getDipaTitle(jenis) {
  switch (jenis) {
    case 'sidkel': return 'Sidang di Luar Gedung (LIPA 14)'
    case 'prodeo': return 'Prodeo DIPA (LIPA 15)'
    case 'posbakum': return 'Pos Bantuan Hukum (LIPA 16)'
    case 'yandu': return 'Pelayanan Terpadu (LIPA 27)'
    default: return 'Kegiatan DIPA'
  }
}

function openEditMonth(m) {
  editMonthForm.bulan = m.bulan
  editMonthForm.nama_bulan = m.nama_bulan
  editMonthForm.bulan_ini = m.bulan_ini
  editMonthForm.kegiatan = m.kegiatan
  editMonthForm.perkara = m.perkara
  editMonthForm.keterangan = m.keterangan
  isModalEditOpen.value = true
}

async function saveMonthRealisasi() {
  isSavingMonth.value = true
  try {
    const res = await $fetch('/api/laporan/manual/dipa-bulanan', {
      method: 'POST',
      body: {
        tahun: selectedYear.value,
        jenis: activeManualTab.value,
        ...editMonthForm
      }
    })
    if (res.success) {
      isModalEditOpen.value = false
      refreshDipa()
      triggerRefresh()
    }
  } catch (err) {
    alert('Gagal menyimpan realisasi: ' + err.message)
  } finally {
    isSavingMonth.value = false
  }
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}

function formatDate(dateVal) {
  if (!dateVal || dateVal === '0000-00-00') return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return String(dateVal)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(dateVal)
  }
}
</script>
