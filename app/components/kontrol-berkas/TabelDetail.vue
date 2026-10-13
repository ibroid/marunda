<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Title & Category Selector -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Daftar Perkara: {{ categoryTitle }}
            </h3>
            <UBadge color="gray" variant="subtle" size="xs">
              {{ data?.pagination?.total || 0 }} Perkara
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Audit status kelengkapan file SK Penetapan Majelis, Panitera Pengganti, dan Jurusita
          </p>
        </div>

        <!-- Search Input -->
        <div class="w-full md:w-72">
          <UInput
            v-model="searchInput"
            icon="i-heroicons-magnifying-glass"
            size="sm"
            color="white"
            placeholder="Cari nomor perkara / pihak..."
            :trailing="searchInput ? true : false"
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
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
        <button
          v-for="cat in categoryTabs"
          :key="cat.id"
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5"
          :class="[
            activeKategori === cat.id
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          @click="setKategori(cat.id)"
        >
          <UIcon :name="cat.icon" class="w-3.5 h-3.5" />
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </template>

    <!-- Table Responsive -->
    <div class="overflow-x-auto -mx-4 sm:mx-0">
      <table class="w-full text-left text-xs divide-y divide-gray-200 dark:divide-gray-800">
        <thead class="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 font-semibold">
          <tr>
            <th class="px-3.5 py-3 text-center w-12">No</th>
            <th class="px-3.5 py-3 min-w-[170px]">Nomor Perkara</th>
            <th class="px-3.5 py-3 min-w-[110px]">Tgl Daftar</th>
            <th class="px-3.5 py-3 min-w-[200px]">Jenis &amp; Para Pihak</th>
            <th class="px-3.5 py-3 min-w-[180px]">Penetapan Majelis (PMH)</th>
            <th class="px-3.5 py-3 min-w-[180px]">Penetapan Panitera (PPP)</th>
            <th class="px-3.5 py-3 min-w-[180px]">Penetapan Jurusita (PJS)</th>
            <th class="px-3.5 py-3 text-center min-w-[90px]">Status</th>
            <th class="px-3.5 py-3 text-center min-w-[90px]">Aksi SIPP</th>
          </tr>
        </thead>

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 6" :key="i" class="animate-pulse">
            <td class="px-3.5 py-3 text-center"><USkeleton class="h-3 w-4 mx-auto" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-4 w-32" /></td>
            <td class="px-3.5 py-3"><USkeleton class="h-3 w-16" /></td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-3 w-28" />
              <USkeleton class="h-2.5 w-40" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-20 rounded-full" />
              <USkeleton class="h-2.5 w-24" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-20 rounded-full" />
              <USkeleton class="h-2.5 w-24" />
            </td>
            <td class="px-3.5 py-3 space-y-1">
              <USkeleton class="h-4 w-20 rounded-full" />
              <USkeleton class="h-2.5 w-24" />
            </td>
            <td class="px-3.5 py-3 text-center"><USkeleton class="h-5 w-16 mx-auto rounded-full" /></td>
            <td class="px-3.5 py-3 text-center"><USkeleton class="h-6 w-14 mx-auto rounded" /></td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800/80">
          <tr
            v-for="(item, idx) in data?.items || []"
            :key="item.perkara_id"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
          >
            <!-- No -->
            <td class="px-3.5 py-3 text-center text-gray-400 font-mono">
              {{ rowNumber(idx) }}
            </td>

            <!-- Nomor Perkara -->
            <td class="px-3.5 py-3 font-medium text-gray-900 dark:text-white">
              <div class="font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer" @click="openSipp(item.perkara_id)">
                {{ item.nomor_perkara }}
              </div>
            </td>

            <!-- Tanggal Daftar -->
            <td class="px-3.5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {{ formatDate(item.tanggal_pendaftaran) }}
            </td>

            <!-- Jenis Perkara & Pihak -->
            <td class="px-3.5 py-3">
              <div class="font-medium text-gray-800 dark:text-gray-200">{{ item.jenis_perkara_nama }}</div>
              <div class="text-[11px] text-gray-400 mt-0.5 line-clamp-2 max-w-xs">
                {{ item.para_pihak || '-' }}
              </div>
            </td>

            <!-- PMH -->
            <td class="px-3.5 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <UBadge
                  :color="item.has_pmh_dok ? 'green' : 'red'"
                  :variant="item.has_pmh_dok ? 'subtle' : 'solid'"
                  size="xs"
                >
                  <UIcon :name="item.has_pmh_dok ? 'i-heroicons-check' : 'i-heroicons-x-mark'" class="w-3 h-3 mr-0.5" />
                  {{ item.has_pmh_dok ? 'Sudah Ada File' : 'Belum Ada File' }}
                </UBadge>
              </div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1" :title="item.majelis_hakim_nama || 'Belum ditunjuk'">
                {{ item.majelis_hakim_nama ? cleanHtml(item.majelis_hakim_nama) : 'Belum ditentukan' }}
              </div>
            </td>

            <!-- PPP -->
            <td class="px-3.5 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <UBadge
                  :color="item.has_ppp_dok ? 'green' : 'red'"
                  :variant="item.has_ppp_dok ? 'subtle' : 'solid'"
                  size="xs"
                >
                  <UIcon :name="item.has_ppp_dok ? 'i-heroicons-check' : 'i-heroicons-x-mark'" class="w-3 h-3 mr-0.5" />
                  {{ item.has_ppp_dok ? 'Sudah Ada File' : 'Belum Ada File' }}
                </UBadge>
              </div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1" :title="item.panitera_pengganti_text || 'Belum ditunjuk'">
                {{ item.panitera_pengganti_text ? cleanHtml(item.panitera_pengganti_text) : 'Belum ditentukan' }}
              </div>
            </td>

            <!-- PJS -->
            <td class="px-3.5 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <UBadge
                  :color="item.has_pjs_dok ? 'green' : 'red'"
                  :variant="item.has_pjs_dok ? 'subtle' : 'solid'"
                  size="xs"
                >
                  <UIcon :name="item.has_pjs_dok ? 'i-heroicons-check' : 'i-heroicons-x-mark'" class="w-3 h-3 mr-0.5" />
                  {{ item.has_pjs_dok ? 'Sudah Ada File' : 'Belum Ada File' }}
                </UBadge>
              </div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1" :title="item.jurusita_text || 'Belum ditunjuk'">
                {{ item.jurusita_text ? cleanHtml(item.jurusita_text) : 'Belum ditentukan' }}
              </div>
            </td>

            <!-- Status Kelengkapan Keseluruhan -->
            <td class="px-3.5 py-3 text-center whitespace-nowrap">
              <UBadge
                :color="item.is_lengkap ? 'green' : 'red'"
                variant="subtle"
                size="xs"
                class="font-semibold"
              >
                {{ item.is_lengkap ? 'Lengkap' : 'Belum Lengkap' }}
              </UBadge>
            </td>

            <!-- Tombol SIPP -->
            <td class="px-3.5 py-3 text-center whitespace-nowrap">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === item.perkara_id"
                title="Buka detail perkara di SIPP"
                @click="openSipp(item.perkara_id)"
              >
                SIPP
              </UButton>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!data?.items?.length">
            <td colspan="9" class="px-4 py-10 text-center">
              <div class="max-w-sm mx-auto space-y-2">
                <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-emerald-500 mx-auto" />
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Perkara Ditemukan
                </p>
                <p class="text-xs text-gray-400">
                  Seluruh perkara pada kriteria filter ini telah sesuai atau data pencarian tidak ditemukan.
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Menampilkan
          <strong class="text-gray-900 dark:text-white">
            {{ data?.items?.length ? ((currentPage - 1) * 25) + 1 : 0 }}
          </strong>
          sampai
          <strong class="text-gray-900 dark:text-white">
            {{ ((currentPage - 1) * 25) + (data?.items?.length || 0) }}
          </strong>
          dari
          <strong class="text-gray-900 dark:text-white">
            {{ data?.pagination?.total || 0 }}
          </strong>
          perkara
        </div>

        <div v-if="(data?.pagination?.totalPages || 0) > 1">
          <UPagination
            v-model="currentPage"
            :page-count="25"
            :total="data?.pagination?.total || 0"
            size="xs"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const {
  selectedMonth,
  selectedYear,
  isFilterApplied,
  activeKategori,
  searchQuery,
  currentPage,
  refreshSignal,
  setKategori,
  formatDate
} = useKontrolBerkasPenetapan()

const toast = useToast()
const loadingPerkaraId = ref(null)

const searchInput = ref(searchQuery.value)
let debounceTimeout = null

watch(searchInput, (val) => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    searchQuery.value = val
    currentPage.value = 1
  }, 400)
})

const categoryTabs = [
  { id: 'semua_belum', label: 'Belum Lengkap (Semua)', icon: 'i-heroicons-exclamation-triangle' },
  { id: 'belum_pmh', label: 'Belum PMH', icon: 'i-heroicons-document-text' },
  { id: 'belum_ppp', label: 'Belum PPP', icon: 'i-heroicons-document-text' },
  { id: 'belum_pjs', label: 'Belum PJS', icon: 'i-heroicons-document-text' },
  { id: 'sudah_lengkap', label: 'Sudah Lengkap', icon: 'i-heroicons-check-badge' },
  { id: 'semua', label: 'Semua Perkara', icon: 'i-heroicons-folder-open' }
]

const categoryTitle = computed(() => {
  const map = {
    semua_belum: 'Perkara Belum Lengkap Unggah Berkas Penetapan',
    belum_pmh: 'Perkara Belum Upload Penetapan Majelis Hakim (PMH)',
    belum_ppp: 'Perkara Belum Upload Penetapan Panitera Pengganti (PPP)',
    belum_pjs: 'Perkara Belum Upload Penetapan Jurusita (PJS)',
    sudah_lengkap: 'Perkara Sudah Lengkap Semua File Penetapan',
    semua: 'Semua Perkara Terdaftar'
  }
  return map[activeKategori.value] || activeKategori.value
})

const { data, pending, refresh } = useLazyFetch('/api/kontrol/berkas-penetapan/list', {
  server: false,
  query: computed(() => ({
    month: selectedMonth.value !== null ? selectedMonth.value : 0,
    year: selectedYear.value,
    kategori: activeKategori.value,
    search: searchQuery.value,
    page: currentPage.value,
    limit: 25
  })),
  immediate: false,
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(
  [selectedMonth, selectedYear, activeKategori, searchQuery, currentPage, isFilterApplied],
  () => {
    if (isFilterApplied.value && selectedMonth.value !== null && selectedYear.value) {
      data.value = null
      refresh()
    }
  },
  { immediate: true }
)

watch(refreshSignal, () => {
  if (isFilterApplied.value) {
    refresh()
  }
})

function rowNumber(idx) {
  return ((currentPage.value - 1) * 25) + idx + 1
}

function cleanHtml(str) {
  if (!str) return '-'
  return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
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
