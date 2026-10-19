<template>
  <UModal v-model="isModalAtensiOpen" :ui="{ width: 'sm:max-w-5xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Header Modal -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="p-2.5 rounded-xl flex items-center justify-center shadow-xs"
              :class="headerConfig.bgClass"
            >
              <UIcon :name="headerConfig.icon" class="w-5 h-5" :class="headerConfig.iconClass" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ headerConfig.title }}
                </h3>
                <UBadge :color="headerConfig.color" variant="subtle" size="xs">
                  {{ totalCases }} Perkara
                </UBadge>
                <UBadge color="gray" variant="subtle" size="xs">
                  Hari Ini
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ headerConfig.description }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              title="Tutup dialog"
              @click="closeModalAtensi"
            />
          </div>
        </div>
      </template>

      <!-- Body Modal -->
      <div class="space-y-4">
        <!-- Search Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara, pihak, majelis, PP..."
            size="sm"
            class="w-full sm:w-80"
          >
            <template #trailing>
              <UButton
                v-if="searchInput"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="searchInput = ''"
              />
            </template>
          </UInput>
          <span class="text-xs text-gray-500 self-end sm:self-center">
            Total Ditemukan: <strong class="text-gray-700 dark:text-gray-300">{{ totalCases }}</strong> perkara
          </span>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto min-h-[320px] max-h-[60vh] relative border border-gray-200 dark:border-gray-800 rounded-lg">
          <!-- Loading Overlay -->
          <div
            v-if="isLoading"
            class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex flex-col items-center justify-center gap-2"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-7 h-7 animate-spin text-primary-500" />
            <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Memuat rincian data perkara...</span>
          </div>

          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-1">
              <tr>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">No</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara &amp; Pihak</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">{{ modalAtensiType === 'redaksi_materai_tanpa_putusan' ? 'Tgl Biaya' : 'Tgl Putus' }}</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim &amp; PP</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Status Atensi</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(item, idx) in daftarPerkara"
                :key="item.perkara_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <!-- Nomor Urut -->
                <td class="py-2.5 px-3 text-center text-gray-400 font-medium font-mono">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara, Jenis & Pihak -->
                <td class="py-2.5 px-3">
                  <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-primary-600 dark:text-primary-400">{{ item.nomor_perkara }}</span>
                    <UBadge
                      v-if="item.jenis_perkara_nama"
                      color="gray"
                      variant="subtle"
                      size="2xs"
                    >
                      {{ item.jenis_perkara_nama }}
                    </UBadge>
                  </div>
                  <div
                    v-if="item.para_pihak"
                    class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-sm mt-0.5"
                    :title="cleanHtml(item.para_pihak)"
                  >
                    {{ cleanHtml(item.para_pihak) }}
                  </div>
                </td>

                <!-- Tanggal Putusan / Biaya & Selisih Hari -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="font-medium text-gray-800 dark:text-gray-200 block">
                    {{ formatDate(modalAtensiType === 'redaksi_materai_tanpa_putusan' ? item.tanggal_biaya : item.tanggal_putusan) }}
                  </span>
                  <UBadge
                    v-if="modalAtensiType === 'redaksi_materai_tanpa_putusan'"
                    color="orange"
                    variant="subtle"
                    size="xs"
                    class="mt-0.5"
                  >
                    Hari ini
                  </UBadge>
                  <UBadge
                    v-else
                    :color="item.selisih_hari > 14 ? 'red' : item.selisih_hari > 7 ? 'amber' : item.selisih_hari <= 0 ? 'emerald' : 'blue'"
                    variant="subtle"
                    size="xs"
                    class="mt-0.5"
                  >
                    <template v-if="item.selisih_hari === 0">
                      Hari ini
                    </template>
                    <template v-else>
                      {{ item.selisih_hari }} hari lalu
                    </template>
                  </UBadge>
                </td>

                <!-- Majelis Hakim & Panitera Pengganti -->
                <td class="py-2.5 px-3 max-w-xs">
                  <div class="text-[11px] font-medium text-gray-700 dark:text-gray-300 line-clamp-1" :title="cleanHtml(item.majelis_hakim_nama)">
                    <span class="text-gray-400 font-normal">MH:</span> {{ cleanHtml(item.majelis_hakim_nama) || '-' }}
                  </div>
                  <div class="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    <span class="text-gray-400">PP:</span> {{ item.panitera_pengganti_nama || '-' }}
                  </div>
                </td>

                <!-- Kolom Status Spesifik sesuai Indikator -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <!-- Type: putus_hari_ini -->
                  <div v-if="modalAtensiType === 'putus_hari_ini'" class="space-y-1">
                    <UBadge
                      :color="item.status_minutasi === 'Sudah Minutasi' ? 'green' : 'amber'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ item.status_minutasi }}
                    </UBadge>
                    <UBadge
                      :color="item.status_edoc === 'e-Doc Ada' ? 'green' : 'purple'"
                      variant="subtle"
                      size="xs"
                      class="ml-1"
                    >
                      {{ item.status_edoc }}
                    </UBadge>
                  </div>

                  <!-- Type: putus_belum_minutasi -->
                  <div v-else-if="modalAtensiType === 'putus_belum_minutasi'">
                    <UBadge color="red" variant="subtle" size="xs">
                      Belum Minutasi
                    </UBadge>
                  </div>

                  <!-- Type: belum_edoc_putusan -->
                  <div v-else-if="modalAtensiType === 'belum_edoc_putusan'">
                    <UBadge color="purple" variant="subtle" size="xs">
                      File Amar Belum Ada
                    </UBadge>
                  </div>

                  <!-- Type: belum_biaya_redaksi_materai -->
                  <div v-else-if="modalAtensiType === 'belum_biaya_redaksi_materai'">
                    <UBadge color="rose" variant="subtle" size="xs">
                      {{ item.status_biaya || 'Belum Redaksi / Meterai' }}
                    </UBadge>
                  </div>

                  <!-- Type: redaksi_materai_tanpa_putusan -->
                  <div v-else-if="modalAtensiType === 'redaksi_materai_tanpa_putusan'" class="space-y-1">
                    <UBadge color="red" variant="subtle" size="xs">
                      Belum Putus
                    </UBadge>
                    <div v-if="item.uraian_biaya" class="text-[10px] text-gray-500 max-w-xs truncate" :title="item.uraian_biaya">
                      {{ item.uraian_biaya }}
                    </div>
                  </div>

                  <!-- Default fallback -->
                  <div v-else>
                    <span class="text-gray-400">-</span>
                  </div>
                </td>

                <!-- Tombol Aksi Buka SIPP -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UButton
                    size="2xs"
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-arrow-top-right-on-square"
                    :loading="loadingPerkaraId === item.perkara_id"
                    title="Buka rincian perkara langsung di SIPP"
                    @click="openSipp(item.perkara_id)"
                  >
                    Buka SIPP
                  </UButton>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="!isLoading && !daftarPerkara.length">
                <td colspan="6" class="py-12 text-center text-gray-400 text-xs">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-emerald-500" />
                    <span>
                      {{ searchInput ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Tidak ada perkara atensi untuk kategori ini pada hari ini' }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Modal -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            Menampilkan
            <strong>{{ totalCases > 0 ? (page - 1) * limit + 1 : 0 }}</strong>
            -
            <strong>{{ Math.min(page * limit, totalCases) }}</strong>
            dari
            <strong>{{ totalCases }}</strong> perkara
          </span>
          <div class="flex items-center gap-3">
            <UPagination
              v-if="totalCases > limit"
              v-model="page"
              :page-count="limit"
              :total="totalCases"
              :max="5"
              size="xs"
              :disabled="isLoading"
            />
            <UButton
              color="gray"
              variant="solid"
              size="xs"
              @click="closeModalAtensi"
            >
              Tutup
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedYear,
  isModalAtensiOpen,
  modalAtensiType,
  modalAtensiTitle,
  modalAtensiTotal,
  loadingPerkaraId,
  closeModalAtensi,
  formatDate,
  cleanHtml,
  openSipp
} = useDashboardEksekutif()

const page = ref(1)
const limit = 10
const searchInput = ref('')
const daftarPerkara = ref([])
const totalCases = ref(0)
const isLoading = ref(false)
let searchTimeout = null

// Konfigurasi Header Modal berdasarkan tipe atensi
const headerConfig = computed(() => {
  switch (modalAtensiType.value) {
    case 'putus_hari_ini':
      return {
        title: 'Daftar Perkara: Putus Hari Ini',
        description: 'Perkara yang diputus hari ini — perlu segera diminutasi dan diunggah dokumen putusannya',
        color: 'amber',
        icon: 'i-heroicons-clock',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
        iconClass: 'text-amber-600 dark:text-amber-400'
      }
    case 'putus_belum_minutasi':
      return {
        title: 'Daftar Perkara: Putus Hari Ini Belum Minutasi',
        description: 'Perkara yang diputus hari ini namun belum selesai diminutasi oleh Majelis & PP (One Day Minutation)',
        color: 'red',
        icon: 'i-heroicons-document-text',
        bgClass: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
        iconClass: 'text-red-600 dark:text-red-400'
      }
    case 'belum_edoc_putusan':
      return {
        title: 'Daftar Perkara: Putus Hari Ini Belum Upload e-Doc',
        description: 'Perkara yang diputus hari ini yang belum mengunggah dokumen elektronik file amar putusan (One Day Publish)',
        color: 'purple',
        icon: 'i-heroicons-arrow-up-tray',
        bgClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
        iconClass: 'text-purple-600 dark:text-purple-400'
      }
    case 'belum_biaya_redaksi_materai':
      return {
        title: 'Daftar Perkara: Putus Hari Ini Belum Biaya Redaksi / Meterai',
        description: 'Perkara yang diputus hari ini (non-prodeo) yang belum diinput transaksi biaya redaksi atau meterai',
        color: 'rose',
        icon: 'i-heroicons-banknotes',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
        iconClass: 'text-rose-600 dark:text-rose-400'
      }
    case 'redaksi_materai_tanpa_putusan':
      return {
        title: 'Daftar Perkara: Redaksi & Materai Hari Ini Tanpa Putusan',
        description: 'Perkara dengan transaksi biaya redaksi atau meterai hari ini namun belum ada tanggal putusan di SIPP',
        color: 'orange',
        icon: 'i-heroicons-banknotes',
        bgClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
        iconClass: 'text-orange-600 dark:text-orange-400'
      }
    default:
      return {
        title: modalAtensiTitle.value || 'Daftar Perkara Atensi Hari Ini',
        description: 'Daftar rincian perkara atensi kepatuhan hari ini',
        color: 'primary',
        icon: 'i-heroicons-exclamation-triangle',
        bgClass: 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400',
        iconClass: 'text-primary-600 dark:text-primary-400'
      }
  }
})

// Fungsi memuat data dari API detail
async function loadDetailData(showOverlay = true) {
  if (showOverlay) isLoading.value = true
  try {
    const res = await $fetch('/api/dashboard/eksekutif/atensi/detail', {
      query: {
        year: selectedYear.value,
        type: modalAtensiType.value,
        page: page.value,
        limit,
        q: searchInput.value.trim()
      }
    })
    if (res?.success) {
      daftarPerkara.value = res.daftar || []
      totalCases.value = res.total || 0
    }
  } catch (err) {
    console.error('Gagal memuat detail atensi eksekutif:', err)
  } finally {
    isLoading.value = false
  }
}

// Watchers
watch(isModalAtensiOpen, (isOpen) => {
  if (isOpen) {
    page.value = 1
    searchInput.value = ''
    totalCases.value = modalAtensiTotal.value || 0
    loadDetailData(true)
  }
})

watch(page, () => {
  if (isModalAtensiOpen.value) {
    loadDetailData(true)
  }
})

watch(searchInput, () => {
  if (!isModalAtensiOpen.value) return
  page.value = 1
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadDetailData(true)
  }, 300)
})

watch(selectedYear, () => {
  if (isModalAtensiOpen.value) {
    page.value = 1
    loadDetailData(true)
  }
})
</script>
