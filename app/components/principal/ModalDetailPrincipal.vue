<template>
  <UModal
    v-model="isDetailModalOpen"
    :ui="{ width: 'sm:max-w-4xl' }"
  >
    <UCard :ui="{ divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/70 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold text-lg shrink-0">
              <UIcon name="i-heroicons-user" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-gray-900 dark:text-white">
                  {{ detailData?.pihak?.nama || 'Detail Pihak' }}
                </h3>
                <UBadge
                  v-if="detailData?.pihak?.jenis_pihak_nama"
                  color="primary"
                  variant="subtle"
                  size="xs"
                >
                  {{ detailData?.pihak?.jenis_pihak_nama }}
                </UBadge>
                <UBadge
                  v-if="detailData?.pihak?.jenis_kelamin"
                  :color="detailData?.pihak?.jenis_kelamin === 'L' ? 'blue' : 'pink'"
                  variant="subtle"
                  size="xs"
                >
                  {{ detailData?.pihak?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ID Pihak SIPP: #{{ detailData?.pihak?.id || selectedPihakId }}
              </p>
            </div>
          </div>

          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            class="-my-1"
            @click="closeDetail"
          />
        </div>
      </template>

      <!-- Modal Body (Loading State) -->
      <div v-if="isLoading" class="p-4 space-y-4 animate-pulse">
        <div class="grid grid-cols-2 gap-4">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-48" />
          <USkeleton class="h-4 w-28" />
          <USkeleton class="h-4 w-40" />
        </div>
        <USkeleton class="h-32 w-full rounded-lg" />
      </div>

      <!-- Modal Body (Loaded State) -->
      <div v-else-if="detailData?.pihak" class="space-y-5">
        <!-- Tab Navigasi Modal -->
        <UTabs :items="tabItems" class="w-full">
          <!-- Tab 1: Identitas & Pribadi -->
          <template #identitas>
            <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div>
                <span class="text-gray-400 block mb-0.5">Nama Lengkap</span>
                <span class="font-semibold text-gray-900 dark:text-white text-sm">
                  {{ detailData.pihak.nama }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Jenis & Nomor Identitas</span>
                <span class="font-mono font-medium text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.nomor_indentitas || '-' }}
                  <span v-if="detailData.pihak.jenis_indentitas_nama" class="text-gray-400 font-sans text-[11px]">
                    ({{ detailData.pihak.jenis_indentitas_nama }})
                  </span>
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Tempat & Tanggal Lahir</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.tempat_lahir || '-' }},
                  {{ formatDate(detailData.pihak.tanggal_lahir) }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Jenis Kelamin / Gol. Darah</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.jenis_kelamin === 'L' ? 'Laki-laki' : (detailData.pihak.jenis_kelamin === 'P' ? 'Perempuan' : '-') }}
                  {{ detailData.pihak.golongan_darah ? `(Gol. ${detailData.pihak.golongan_darah})` : '' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Agama</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.agama_nama || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Status Pernikahan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.status_kawin_text || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Pekerjaan</span>
                <span class="font-medium text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.pekerjaan || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Pendidikan Terakhir</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.pendidikan || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Kewarganegaraan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.warga_negara || 'Indonesia' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Penyandang Disabilitas</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.difabel === 'Y' ? 'Ya (Disabilitas)' : 'Tidak' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nama Ayah</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.nama_ayah || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nama Ibu</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.pihak.nama_ibu || '-' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Tab 2: Alamat & Kontak -->
          <template #alamat>
            <div class="pt-4 space-y-4 text-xs">
              <div class="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                <span class="text-gray-400 block">Alamat Lengkap</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {{ detailData.pihak.alamat || '-' }}
                </p>
                <div v-if="detailData.pihak.rtrw" class="text-xs text-gray-500">
                  RT / RW: {{ detailData.pihak.rtrw }}
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div class="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <span class="text-gray-400 block text-[11px] mb-0.5">Kelurahan / Desa</span>
                  <span class="font-medium text-gray-800 dark:text-gray-200">
                    {{ detailData.pihak.kelurahan_nama || '-' }}
                  </span>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <span class="text-gray-400 block text-[11px] mb-0.5">Kecamatan</span>
                  <span class="font-medium text-gray-800 dark:text-gray-200">
                    {{ detailData.pihak.kecamatan_nama || '-' }}
                  </span>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <span class="text-gray-400 block text-[11px] mb-0.5">Kabupaten / Kota</span>
                  <span class="font-medium text-gray-800 dark:text-gray-200">
                    {{ detailData.pihak.kabupaten || '-' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-phone" class="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[11px]">Telepon / HP</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200">
                      {{ detailData.pihak.telepon || '-' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-blue-500 shrink-0" />
                  <div class="overflow-hidden">
                    <span class="text-gray-400 block text-[11px]">Email</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200 truncate block">
                      {{ detailData.pihak.email || '-' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-printer" class="w-5 h-5 text-gray-500 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[11px]">Fax</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200">
                      {{ detailData.pihak.fax || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Tab 3: Riwayat Perkara SIPP -->
          <template #perkara>
            <div class="pt-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  Tercatat dalam <strong>{{ detailData?.perkara?.length || 0 }} perkara</strong> di SIPP
                </span>
              </div>

              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th class="px-3 py-2.5 w-10 text-center">No</th>
                      <th class="px-3 py-2.5">Nomor Perkara</th>
                      <th class="px-3 py-2.5">Tanggal Daftar</th>
                      <th class="px-3 py-2.5">Jenis Perkara</th>
                      <th class="px-3 py-2.5">Posisi Pihak</th>
                      <th class="px-3 py-2.5">Status Putusan</th>
                      <th class="px-3 py-2.5">Proses Terakhir</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr
                      v-for="(cas, cIdx) in detailData?.perkara || []"
                      :key="cas.perkara_id"
                      class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                    >
                      <td class="px-3 py-2 text-center text-gray-400">{{ cIdx + 1 }}</td>
                      <td class="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {{ cas.nomor_perkara }}
                      </td>
                      <td class="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {{ formatDate(cas.tanggal_pendaftaran) }}
                      </td>
                      <td class="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {{ cas.jenis_perkara_nama }}
                      </td>
                      <td class="px-3 py-2">
                        <UBadge
                          :color="getPosisiPihakColor(cas.status_perkara)"
                          variant="subtle"
                          size="xs"
                          class="text-[10px] px-1.5 py-0"
                        >
                          {{ cas.status_perkara || `Pihak ke-${cas.pihak_ke}` }}
                        </UBadge>
                      </td>
                      <td class="px-3 py-2">
                        <span v-if="cas.tanggal_putusan" class="text-emerald-600 dark:text-emerald-400 font-medium">
                          Putus: {{ formatDate(cas.tanggal_putusan) }}
                          <span v-if="cas.status_putusan_nama" class="block text-[10px] text-gray-400">
                            ({{ cas.status_putusan_nama }})
                          </span>
                        </span>
                        <span v-else class="text-amber-600 dark:text-amber-400 text-[11px]">
                          Sedang Berjalan
                        </span>
                      </td>
                      <td class="px-3 py-2 text-gray-500 text-[11px]">
                        {{ cas.proses_terakhir_text || cas.tahapan_terakhir_text || '-' }}
                      </td>
                    </tr>
                    <tr v-if="!detailData?.perkara?.length">
                      <td colspan="7" class="px-3 py-6 text-center text-gray-400">
                        Tidak ada riwayat perkara yang tercatat atas nama pihak ini.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <!-- Tab 4: Audit & Log SIPP -->
          <template #audit>
            <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <span class="text-gray-400 block mb-1 font-medium">Data Diinput</span>
                <div class="space-y-1">
                  <div class="text-gray-700 dark:text-gray-300">
                    Oleh: <strong>{{ detailData.pihak.diinput_oleh || '-' }}</strong>
                  </div>
                  <div class="text-gray-500 text-[11px]">
                    Tanggal: {{ formatDateTime(detailData.pihak.diinput_tanggal) }}
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <span class="text-gray-400 block mb-1 font-medium">Terakhir Diperbaharui</span>
                <div class="space-y-1">
                  <div class="text-gray-700 dark:text-gray-300">
                    Oleh: <strong>{{ detailData.pihak.diperbaharui_oleh || '-' }}</strong>
                  </div>
                  <div class="text-gray-500 text-[11px]">
                    Tanggal: {{ formatDateTime(detailData.pihak.diperbaharui_tanggal) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </UTabs>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex items-center justify-end">
          <UButton
            color="gray"
            variant="outline"
            size="sm"
            @click="closeDetail"
          >
            Tutup
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedPihakId,
  isDetailModalOpen,
  closeDetail,
  formatDate,
  formatDateTime
} = usePrincipal()

const tabItems = [
  { label: 'Identitas & Pribadi', icon: 'i-heroicons-identification', slot: 'identitas' },
  { label: 'Alamat & Kontak', icon: 'i-heroicons-map-pin', slot: 'alamat' },
  { label: 'Riwayat Perkara SIPP', icon: 'i-heroicons-document-text', slot: 'perkara' },
  { label: 'Audit Sistem', icon: 'i-heroicons-clock', slot: 'audit' }
]

const { data: detailData, pending: isLoading } = useLazyFetch('/api/principal/detail', {
  server: false,
  query: computed(() => ({ id: selectedPihakId.value })),
  watch: [selectedPihakId],
  immediate: false,
  default: () => null
})

const getPosisiPihakColor = (posisi) => {
  if (!posisi) return 'gray'
  const p = posisi.toLowerCase()
  if (p.includes('penggugat') || p.includes('pemohon')) return 'primary'
  if (p.includes('tergugat') || p.includes('termohon')) return 'rose'
  return 'amber'
}
</script>
