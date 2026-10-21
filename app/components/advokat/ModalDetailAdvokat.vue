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
              <UIcon name="i-heroicons-briefcase" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-gray-900 dark:text-white">
                  {{ detailData?.advokat?.nama || 'Detail Advokat' }}
                </h3>
                <UBadge
                  v-if="detailData?.advokat?.nomor_induk"
                  color="primary"
                  variant="subtle"
                  size="xs"
                >
                  NIA: {{ detailData.advokat.nomor_induk }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ID Advokat SIPP: #{{ detailData?.advokat?.id || selectedAdvokatId }}
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
      <div v-else-if="detailData?.advokat" class="space-y-5">
        <UTabs :items="tabItems" class="w-full">
          <!-- Tab 1: Profil & Legalitas Advokat -->
          <template #profil>
            <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div>
                <span class="text-gray-400 block mb-0.5">Nama Advokat / Kantor</span>
                <span class="font-semibold text-gray-900 dark:text-white text-sm">
                  {{ detailData.advokat.nama }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nomor Induk Advokat (NIA)</span>
                <span class="font-mono font-medium text-gray-800 dark:text-gray-200">
                  {{ detailData.advokat.nomor_induk || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nomor SK Menkeh / Kemenkumham</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.advokat.no_sk_menkeh || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Tanggal SK Menkeh</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ formatDate(detailData.advokat.tanggal_sk_menkeh) }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Tanggal Penyumpahan Pengadilan Tinggi</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ formatDate(detailData.advokat.tanggal_penyumpahan_pt) }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Tanggal Penyumpahan PN</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ formatDate(detailData.advokat.tanggal_penyumpahan_pn) }}
                </span>
              </div>

              <div v-if="detailData.advokat.pangkat">
                <span class="text-gray-400 block mb-0.5">Pangkat</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.advokat.pangkat }}
                </span>
              </div>

              <div v-if="detailData.advokat.jabatan">
                <span class="text-gray-400 block mb-0.5">Jabatan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.advokat.jabatan }}
                </span>
              </div>

              <div v-if="detailData.advokat.kesatuan">
                <span class="text-gray-400 block mb-0.5">Kesatuan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.advokat.kesatuan }}
                </span>
              </div>
            </div>
          </template>

          <!-- Tab 2: Kantor & Kontak -->
          <template #kontak>
            <div class="pt-4 space-y-4 text-xs">
              <div class="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                <span class="text-gray-400 block">Alamat Kantor Hukum</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {{ detailData.advokat.alamat_kantor || detailData.advokat.alamat_rumah || '-' }}
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-phone" class="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[11px]">Telepon / HP</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200">
                      {{ detailData.advokat.telepon || '-' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-blue-500 shrink-0" />
                  <div class="overflow-hidden">
                    <span class="text-gray-400 block text-[11px]">Email</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200 truncate block">
                      {{ detailData.advokat.email || '-' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UIcon name="i-heroicons-printer" class="w-5 h-5 text-gray-500 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[11px]">Fax</span>
                    <span class="font-medium text-gray-800 dark:text-gray-200">
                      {{ detailData.advokat.fax || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Tab 3: Daftar Perkara Kuasa Hukum -->
          <template #perkara>
            <div class="pt-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  Menangani <strong>{{ detailData?.perkara?.length || 0 }} perkara</strong> di SIPP
                </span>
              </div>

              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 sticky top-0">
                    <tr>
                      <th class="px-3 py-2.5 w-10 text-center">No</th>
                      <th class="px-3 py-2.5">Nomor Perkara</th>
                      <th class="px-3 py-2.5">Tanggal Daftar</th>
                      <th class="px-3 py-2.5">Jenis Perkara</th>
                      <th class="px-3 py-2.5">Posisi Kuasa</th>
                      <th class="px-3 py-2.5">Nomor & Tanggal Kuasa</th>
                      <th class="px-3 py-2.5">Status Putusan</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr
                      v-for="(cas, cIdx) in detailData?.perkara || []"
                      :key="cas.perkara_pengacara_id"
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
                          :color="Number(cas.pihak_ke) === 1 ? 'primary' : 'rose'"
                          variant="subtle"
                          size="xs"
                          class="text-[10px] px-1.5 py-0"
                        >
                          {{ cas.pihak_ke_text }}
                        </UBadge>
                      </td>
                      <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                        <span v-if="cas.nomor_kuasa" class="font-mono">{{ cas.nomor_kuasa }}</span>
                        <span v-else class="text-gray-400">-</span>
                        <span v-if="cas.tanggal_kuasa" class="block text-[10px] text-gray-400">
                          Tgl: {{ formatDate(cas.tanggal_kuasa) }}
                        </span>
                      </td>
                      <td class="px-3 py-2">
                        <span v-if="cas.tanggal_putusan" class="text-emerald-600 dark:text-emerald-400 font-medium">
                          Putus: {{ formatDate(cas.tanggal_putusan) }}
                          <span v-if="cas.status_putusan_nama" class="block text-[10px] text-gray-400">
                            ({{ cas.status_putusan_nama }})
                          </span>
                        </span>
                        <span v-else class="text-amber-600 dark:text-amber-400 text-[11px]">
                          {{ cas.proses_terakhir_text || 'Sedang Berjalan' }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!detailData?.perkara?.length">
                      <td colspan="7" class="px-3 py-6 text-center text-gray-400">
                        Belum ada perkara kuasa yang tercatat atas nama advokat ini.
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
                    Oleh: <strong>{{ detailData.advokat.diinput_oleh || '-' }}</strong>
                  </div>
                  <div class="text-gray-500 text-[11px]">
                    Tanggal: {{ formatDateTime(detailData.advokat.diinput_tanggal) }}
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700">
                <span class="text-gray-400 block mb-1 font-medium">Terakhir Diperbaharui</span>
                <div class="space-y-1">
                  <div class="text-gray-700 dark:text-gray-300">
                    Oleh: <strong>{{ detailData.advokat.diperbaharui_oleh || '-' }}</strong>
                  </div>
                  <div class="text-gray-500 text-[11px]">
                    Tanggal: {{ formatDateTime(detailData.advokat.diperbaharui_tanggal) }}
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
  selectedAdvokatId,
  isDetailModalOpen,
  closeDetail,
  formatDate,
  formatDateTime
} = useAdvokat()

const tabItems = [
  { label: 'Profil Legalitas', icon: 'i-heroicons-identification', slot: 'profil' },
  { label: 'Kantor & Kontak', icon: 'i-heroicons-map-pin', slot: 'kontak' },
  { label: 'Daftar Perkara Kuasa', icon: 'i-heroicons-scale', slot: 'perkara' },
  { label: 'Audit Sistem', icon: 'i-heroicons-clock', slot: 'audit' }
]

const { data: detailData, pending: isLoading } = useLazyFetch('/api/advokat/detail', {
  server: false,
  query: computed(() => ({ id: selectedAdvokatId.value })),
  watch: [selectedAdvokatId],
  immediate: false,
  default: () => null
})
</script>
