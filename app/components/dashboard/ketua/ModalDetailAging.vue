<template>
  <UModal v-model="isModalAgingOpen" :ui="{ width: 'sm:max-w-5xl' }">
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
                  {{ data?.total || 0 }} Perkara
                </UBadge>
                <UBadge color="gray" variant="subtle" size="xs">
                  Tahun {{ selectedYear }}
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
              @click="closeModalAging"
            />
          </div>
        </div>
      </template>

      <!-- Body Modal -->
      <div class="space-y-4">
        <!-- Filter Tabs Kategori Usia -->
        <div class="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-lg text-xs">
          <button
            v-for="tab in categoryTabs"
            :key="tab.key"
            type="button"
            class="px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5"
            :class="selectedAgingKategori === tab.key
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
            @click="switchCategory(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="getCategoryCount(tab.key) !== null"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
              :class="selectedAgingKategori === tab.key ? tab.badgeActiveClass : tab.badgeInactiveClass"
            >
              {{ getCategoryCount(tab.key) }}
            </span>
          </button>
        </div>

        <!-- Search Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara, pihak, jenis perkara, majelis..."
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
            Total Ditemukan: <strong class="text-gray-700 dark:text-gray-300">{{ data?.total || 0 }}</strong> perkara
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
            <thead class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-5">
              <tr>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">No</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara &amp; Pihak</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Pendaftaran</th>
                <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300">Usia Perkara</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim &amp; PP</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Proses Terakhir</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Aksi</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(item, idx) in (data?.daftar || [])"
                :key="item.perkara_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>
                <td class="py-2.5 px-3">
                  <span class="font-semibold text-primary-600 dark:text-primary-400 block">{{ item.nomor_perkara }}</span>
                  <span class="text-[11px] text-gray-500">{{ item.jenis_perkara_nama }}</span>
                  <div
                    v-if="item.para_pihak"
                    class="text-[10px] text-gray-400 line-clamp-1 max-w-xs mt-0.5"
                    :title="cleanHtml(item.para_pihak)"
                  >
                    {{ cleanHtml(item.para_pihak) }}
                  </div>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {{ formatDate(item.tanggal_pendaftaran) }}
                </td>
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UBadge
                    :color="getUsiaColor(item.usia_hari)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ item.usia_hari }} Hari
                  </UBadge>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-medium text-gray-800 dark:text-gray-200">
                    {{ item.majelis_hakim_nama || '-' }}
                  </div>
                  <div v-if="item.panitera_pengganti_nama" class="text-[11px] text-gray-400">
                    PP: {{ item.panitera_pengganti_nama }}
                  </div>
                </td>
                <td class="py-2.5 px-3 text-gray-500 max-w-xs truncate" :title="item.proses_terakhir_text">
                  {{ item.proses_terakhir_text || '-' }}
                </td>
                <td class="py-2.5 px-3 text-center">
                  <UButton
                    size="2xs"
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-arrow-top-right-on-square"
                    :loading="loadingPerkaraId === item.perkara_id"
                    title="Buka detail perkara di SIPP"
                    @click="openSipp(item.perkara_id)"
                  >
                    Buka SIPP
                  </UButton>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="!isLoading && (!data?.daftar || data?.daftar?.length === 0)">
                <td colspan="7" class="py-12 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p class="text-sm font-medium">Tidak ada perkara ditemukan</p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ searchInput ? 'Coba ubah kata kunci pencarian Anda' : 'Tidak ada perkara pada kategori usia ini' }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="data?.total > limit" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span class="text-xs text-gray-500">
            Menampilkan {{ ((page - 1) * limit) + 1 }} - {{ Math.min(page * limit, data?.total || 0) }} dari {{ data?.total }} perkara
          </span>
          <UPagination
            v-model="page"
            :page-count="limit"
            :total="data?.total || 0"
            size="xs"
          />
        </div>
      </div>

      <!-- Footer Modal -->
      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-gray-500">
            * SEMA No. 2 Tahun 2014 menetapkan batas penyelesaian perkara tingkat pertama maksimal 5 bulan (150 hari).
          </span>
          <UButton
            color="gray"
            variant="solid"
            size="xs"
            @click="closeModalAging"
          >
            Tutup
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const toast = useToast()
const {
  selectedYear,
  sharedAging,
  refreshSignal,
  isModalAgingOpen,
  selectedAgingKategori,
  selectedAgingTitle,
  closeModalAging
} = useDashboardKetua()

const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const searchDebounced = ref('')
const loadingPerkaraId = ref(null)

let debounceTimer = null
watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchDebounced.value = val
    page.value = 1
  }, 350)
})

const categoryTabs = [
  {
    key: 'all',
    label: 'Semua (> 3 Bulan)',
    badgeActiveClass: 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300',
    badgeInactiveClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    key: '3_5_bulan',
    label: '3 - 5 Bulan',
    badgeActiveClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    badgeInactiveClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    key: '5_6_bulan',
    label: '5 - 6 Bulan',
    badgeActiveClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
    badgeInactiveClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    key: '6_12_bulan',
    label: '6 - 12 Bulan',
    badgeActiveClass: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
    badgeInactiveClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    key: 'diatas_1_tahun',
    label: '> 1 Tahun',
    badgeActiveClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    badgeInactiveClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
]

function getCategoryCount(key) {
  if (!sharedAging.value) return null
  if (key === 'all') return sharedAging.value.totalTunggakan || 0
  if (key === '3_5_bulan') return sharedAging.value.usia3_5Bulan || 0
  if (key === '5_6_bulan') return sharedAging.value.usia5_6Bulan || 0
  if (key === '6_12_bulan') return sharedAging.value.usia6_12Bulan || 0
  if (key === 'diatas_1_tahun') return sharedAging.value.usiaDiatas1Tahun || 0
  return null
}

function switchCategory(key) {
  selectedAgingKategori.value = key
  page.value = 1
}

const headerConfig = computed(() => {
  switch (selectedAgingKategori.value) {
    case '3_5_bulan':
      return {
        title: 'Daftar Perkara Usia 3 - 5 Bulan (91-150 hari)',
        description: 'Perkara dalam batas waktu normal menuju batas akhir penanganan (perlu percepatan sidang)',
        icon: 'i-heroicons-clock',
        color: 'amber',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        iconClass: 'text-amber-600 dark:text-amber-400'
      }
    case '5_6_bulan':
      return {
        title: 'Daftar Perkara Usia 5 - 6 Bulan (151-180 hari)',
        description: 'Perkara mendekati dan melewati batas standar SEMA No. 2/2014 (maksimal 5 bulan)',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'orange',
        bgClass: 'bg-orange-50 dark:bg-orange-950/40',
        iconClass: 'text-orange-600 dark:text-orange-400'
      }
    case '6_12_bulan':
      return {
        title: 'Daftar Perkara Usia 6 - 12 Bulan (181-365 hari)',
        description: 'Perkara telah melewati standar waktu penanganan perkara, memerlukan monitoring intensif',
        icon: 'i-heroicons-exclamation-circle',
        color: 'red',
        bgClass: 'bg-red-50 dark:bg-red-950/40',
        iconClass: 'text-red-600 dark:text-red-400'
      }
    case 'diatas_1_tahun':
      return {
        title: 'Daftar Perkara Usia > 1 Tahun (> 365 hari)',
        description: 'Tunggakan perkara kronis yang memerlukan atensi langsung Ketua dan Majelis Hakim',
        icon: 'i-heroicons-fire',
        color: 'rose',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40',
        iconClass: 'text-rose-600 dark:text-rose-400'
      }
    default:
      return {
        title: 'Daftar Perkara Belum Putus Usia > 3 Bulan',
        description: 'Semua perkara aktif yang masa penanganannya telah melewati 90 hari kalender',
        icon: 'i-heroicons-clock',
        color: 'primary',
        bgClass: 'bg-primary-50 dark:bg-primary-950/40',
        iconClass: 'text-primary-600 dark:text-primary-400'
      }
  }
})

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/aging/detail', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    kategori: selectedAgingKategori.value,
    page: page.value,
    limit: limit.value,
    q: searchDebounced.value
  })),
  watch: [selectedYear, selectedAgingKategori, page, searchDebounced],
  default: () => null
})

const isLoading = computed(() => pending.value)

watch(isModalAgingOpen, (isOpen) => {
  if (isOpen) {
    page.value = 1
    searchInput.value = ''
    searchDebounced.value = ''
    refresh()
  }
})

watch(refreshSignal, () => {
  if (isModalAgingOpen.value) {
    refresh()
  }
})

function getUsiaColor(usiaHari) {
  if (usiaHari > 365) return 'rose'
  if (usiaHari > 180) return 'red'
  if (usiaHari > 150) return 'orange'
  return 'amber'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function cleanHtml(htmlStr) {
  if (!htmlStr) return '-'
  return htmlStr.replace(/<br\s*\/?>/gi, ', ').replace(/<[^>]+>/g, '').trim()
}

async function openSipp(perkaraId) {
  if (!perkaraId) {
    toast.add({
      title: 'Perhatian',
      description: 'ID Perkara tidak ditemukan.',
      color: 'amber'
    })
    return
  }

  const width = Math.min(1280, Math.floor(window.screen.availWidth * 0.9))
  const height = Math.min(850, Math.floor(window.screen.availHeight * 0.9))
  const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2))
  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=yes`
  const windowName = `sipp_perkara_${perkaraId}`

  const newWindow = window.open('about:blank', windowName, windowFeatures)
  loadingPerkaraId.value = perkaraId

  try {
    const res = await $fetch('/api/sipp/encrypt', {
      method: 'POST',
      body: {
        perkara_id: perkaraId
      }
    })

    if (res?.url) {
      if (newWindow) {
        newWindow.location.href = res.url
        newWindow.focus()
      } else {
        window.open(res.url, windowName, windowFeatures)
      }
    } else {
      if (newWindow) newWindow.close()
      throw new Error(res?.message || 'Gagal mendapatkan URL SIPP dari hasil enkripsi.')
    }
  } catch (err) {
    if (newWindow) newWindow.close()
    const errorMsg =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Gagal terhubung ke service enkripsi SIPP.'

    toast.add({
      title: 'Gagal Membuka SIPP',
      description: errorMsg,
      color: 'red'
    })
  } finally {
    loadingPerkaraId.value = null
  }
}
</script>
