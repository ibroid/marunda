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
              <UIcon name="i-heroicons-identification" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-gray-900 dark:text-white">
                  {{ detailData?.saksi?.nama || 'Detail Data Saksi' }}
                </h3>
                <UBadge
                  v-if="detailData?.saksi?.saksi_pihak_ke"
                  :color="detailData?.saksi?.saksi_pihak_ke === 1 ? 'sky' : (detailData?.saksi?.saksi_pihak_ke === 2 ? 'purple' : 'gray')"
                  variant="subtle"
                  size="xs"
                >
                  {{ detailData?.saksi?.saksi_pihak_ke === 1 ? 'Saksi Penggugat/Pemohon' : (detailData?.saksi?.saksi_pihak_ke === 2 ? 'Saksi Tergugat/Termohon' : 'Saksi') }}
                </UBadge>
                <UBadge
                  v-if="detailData?.saksi?.keterangan_saksi"
                  color="gray"
                  variant="soft"
                  size="xs"
                  class="italic"
                >
                  Hubungan: {{ detailData?.saksi?.keterangan_saksi }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ID Saksi: #{{ detailData?.saksi?.saksi_id || selectedSaksiId }}
                <span v-if="detailData?.saksi?.urutan">• Saksi Urutan ke-{{ detailData?.saksi?.urutan }}</span>
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
      <div v-if="isLoading" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-48" />
          <USkeleton class="h-4 w-28" />
          <USkeleton class="h-4 w-40" />
        </div>
        <USkeleton class="h-40 w-full rounded-lg" />
      </div>

      <!-- Modal Body (Loaded State) -->
      <div v-else-if="detailData?.saksi" class="p-4 sm:p-5 space-y-5">
        <!-- Tab Navigasi Modal -->
        <UTabs :items="tabItems" class="w-full">
          <!-- Tab 1: Profil & Identitas Saksi -->
          <template #profil>
            <div class="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div>
                <span class="text-gray-400 block mb-0.5">Nama Lengkap</span>
                <span class="font-semibold text-gray-900 dark:text-white text-sm">
                  {{ detailData.saksi.nama }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nomor Identitas (NIK / KTP)</span>
                <span class="font-mono font-medium text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.nomor_indentitas || 'Tidak Tercatat' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Jenis Kelamin</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.jenis_kelamin === 'L' ? 'Laki-laki' : (detailData.saksi.jenis_kelamin === 'P' ? 'Perempuan' : '-') }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Tempat & Tanggal Lahir</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.tempat_lahir || '-' }}, {{ formatDate(detailData.saksi.tanggal_lahir) }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Agama</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.agama_nama || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Status Perkawinan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.status_kawin_text || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Pekerjaan</span>
                <span class="text-gray-800 dark:text-gray-200 font-medium">
                  {{ detailData.saksi.pekerjaan || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Pendidikan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.pendidikan || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Nomor Telepon / Kontak</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.telepon || '-' }}
                </span>
              </div>

              <div>
                <span class="text-gray-400 block mb-0.5">Kewarganegaraan</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {{ detailData.saksi.warga_negara || 'Indonesia' }}
                </span>
              </div>

              <div class="sm:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span class="text-gray-400 block mb-0.5">Alamat / Tempat Tinggal</span>
                <span class="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {{ detailData.saksi.alamat || '-' }}
                </span>
              </div>

              <div v-if="detailData.saksi.nama_ayah || detailData.saksi.nama_ibu" class="sm:col-span-2 pt-1 text-gray-500">
                <span>Nama Orang Tua: </span>
                <span class="font-medium text-gray-800 dark:text-gray-200">
                  {{ [detailData.saksi.nama_ayah ? `Ayah: ${detailData.saksi.nama_ayah}` : '', detailData.saksi.nama_ibu ? `Ibu: ${detailData.saksi.nama_ibu}` : ''].filter(Boolean).join(' | ') }}
                </span>
              </div>
            </div>
          </template>

          <!-- Tab 2: Informasi Perkara Yang Disaksikan -->
          <template #perkara>
            <div class="pt-4 space-y-4 text-xs">
              <div class="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span class="text-gray-400 text-[11px] block">Nomor Perkara</span>
                    <span class="text-base font-bold text-primary-600 dark:text-primary-400">
                      {{ detailData.saksi.nomor_perkara || '-' }}
                    </span>
                  </div>
                  <UBadge
                    v-if="detailData.saksi.proses_terakhir_text"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >
                    {{ detailData.saksi.proses_terakhir_text }}
                  </UBadge>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                  <div>
                    <span class="text-gray-400 block mb-0.5">Klasifikasi / Jenis Perkara</span>
                    <span class="font-semibold text-gray-800 dark:text-gray-200">
                      {{ detailData.saksi.jenis_perkara_nama || '-' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-400 block mb-0.5">Tanggal Pendaftaran</span>
                    <span class="text-gray-800 dark:text-gray-200">
                      {{ formatDate(detailData.saksi.tanggal_pendaftaran) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Para Pihak Utama -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Pihak 1 (Penggugat / Pemohon) -->
                <div class="p-3 rounded-lg border border-sky-100 dark:border-sky-950/50 bg-sky-50/40 dark:bg-sky-950/20">
                  <div class="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold mb-1">
                    <UIcon name="i-heroicons-user" class="w-4 h-4" />
                    <span>Penggugat / Pemohon</span>
                  </div>
                  <p class="text-gray-800 dark:text-gray-200 leading-snug">
                    {{ detailData.saksi.pihak1_text || '-' }}
                  </p>
                </div>

                <!-- Pihak 2 (Tergugat / Termohon) -->
                <div class="p-3 rounded-lg border border-purple-100 dark:border-purple-950/50 bg-purple-50/40 dark:bg-purple-950/20">
                  <div class="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold mb-1">
                    <UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
                    <span>Tergugat / Termohon</span>
                  </div>
                  <p class="text-gray-800 dark:text-gray-200 leading-snug">
                    {{ detailData.saksi.pihak2_text || '-' }}
                  </p>
                </div>
              </div>

              <!-- Status Putusan -->
              <div v-if="detailData.saksi.status_putusan_nama || detailData.saksi.tanggal_putusan" class="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-xs font-semibold block">Status Putusan: {{ detailData.saksi.status_putusan_nama || 'Sudah Putus' }}</span>
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Tanggal Putus: {{ formatDate(detailData.saksi.tanggal_putusan) }}
                    </span>
                  </div>
                  <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </template>

          <!-- Tab 3: Catatan / Transkrip BAP Keterangan Sidang -->
          <template #keterangan>
            <div class="pt-4 space-y-4">
              <div v-if="detailData.keterangan && detailData.keterangan.length > 0" class="space-y-3">
                <div class="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span class="font-medium text-gray-700 dark:text-gray-300">
                    Transkrip Tanya Jawab Sidang ({{ detailData.keterangan.length }} Pertanyaan)
                  </span>
                  <span v-if="detailData.keterangan[0]?.tanggal_sidang" class="text-gray-400">
                    Sidang: {{ formatDate(detailData.keterangan[0].tanggal_sidang) }}
                  </span>
                </div>

                <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  <div
                    v-for="(item, idx) in detailData.keterangan"
                    :key="item.id || idx"
                    class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs"
                  >
                    <!-- Pertanyaan -->
                    <div class="flex items-start gap-2">
                      <UBadge color="blue" variant="subtle" size="xs" class="shrink-0 mt-0.5">
                        Tanya #{{ item.urutan_pertanyaan || (idx + 1) }}
                      </UBadge>
                      <div class="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">
                        {{ item.pertanyaan }}
                      </div>
                    </div>

                    <!-- Jawaban -->
                    <div v-if="item.jawaban" class="flex items-start gap-2 pl-3 border-l-2 border-emerald-400 dark:border-emerald-600 ml-2 mt-2">
                      <UBadge color="emerald" variant="subtle" size="xs" class="shrink-0 mt-0.5">
                        Jawab
                      </UBadge>
                      <div class="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {{ item.jawaban }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State Keterangan -->
              <div v-else class="py-10 text-center space-y-2">
                <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
                </div>
                <h4 class="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Belum Ada Catatan Transkrip BAP Sidang
                </h4>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Keterangan tanya jawab saksi belum diinput pada aplikasi SIPP untuk persidangan perkara ini.
                </p>
              </div>
            </div>
          </template>

          <!-- Tab 4: Riwayat Perkara Lain -->
          <template #riwayat>
            <div class="pt-4 space-y-3">
              <div v-if="detailData.otherCases && detailData.otherCases.length > 0" class="space-y-2">
                <p class="text-xs text-gray-500 mb-2">
                  Ditemukan {{ detailData.otherCases.length }} perkara lain yang pernah melibatkan saksi ini:
                </p>

                <div class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                  <div
                    v-for="other in detailData.otherCases"
                    :key="other.saksi_id"
                    class="p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div class="font-semibold text-primary-600 dark:text-primary-400">
                        {{ other.nomor_perkara }}
                      </div>
                      <div class="text-[11px] text-gray-500 mt-0.5">
                        {{ other.jenis_perkara_nama }} • Daftar: {{ formatDate(other.tanggal_pendaftaran) }}
                        <span v-if="other.keterangan_saksi">• ({{ other.keterangan_saksi }})</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="other.saksi_pihak_ke === 1 ? 'sky' : (other.saksi_pihak_ke === 2 ? 'purple' : 'gray')"
                        variant="subtle"
                        size="xs"
                      >
                        {{ other.saksi_pihak_ke === 1 ? 'Saksi Penggugat' : 'Saksi Tergugat' }}
                      </UBadge>
                      <UBadge v-if="other.status_putusan_nama" color="emerald" variant="subtle" size="xs">
                        {{ other.status_putusan_nama }}
                      </UBadge>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State Perkara Lain -->
              <div v-else class="py-10 text-center space-y-2">
                <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <UIcon name="i-heroicons-folder-open" class="w-5 h-5" />
                </div>
                <h4 class="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Hanya Terdaftar Pada 1 Perkara Ini
                </h4>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Saksi ini tidak tercatat menjadi saksi pada perkara lain di database SIPP.
                </p>
              </div>
            </div>
          </template>
        </UTabs>
      </div>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex justify-end">
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
  selectedSaksiId,
  isDetailModalOpen,
  closeDetail,
  formatDate
} = useSaksi()

// Fetch detail saksi hanya saat modal terbuka dan ID saksi ada
const { data, pending } = useLazyFetch(
  () => `/api/saksi/detail?id=${selectedSaksiId.value}`,
  {
    server: false,
    immediate: false,
    watch: [selectedSaksiId],
    default: () => null
  }
)

const isLoading = computed(() => pending.value || !data.value)
const detailData = computed(() => data.value?.data || null)

const tabItems = computed(() => [
  {
    slot: 'profil',
    label: 'Profil Identitas',
    icon: 'i-heroicons-user'
  },
  {
    slot: 'perkara',
    label: 'Perkara Terkait',
    icon: 'i-heroicons-scale'
  },
  {
    slot: 'keterangan',
    label: `Keterangan BAP (${detailData.value?.keterangan?.length || 0})`,
    icon: 'i-heroicons-chat-bubble-bottom-center-text'
  },
  {
    slot: 'riwayat',
    label: `Perkara Lain (${detailData.value?.otherCases?.length || 0})`,
    icon: 'i-heroicons-clock'
  }
])
</script>
