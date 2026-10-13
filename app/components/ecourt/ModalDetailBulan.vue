<template>
  <UModal v-model="isModalDetailOpen" :ui="{ width: 'sm:max-w-5xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <!-- Modal Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary-50 dark:bg-primary-950/40 rounded-lg text-primary-600 dark:text-primary-400">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Rincian Perkara Masuk — {{ selectedMonthName }} {{ selectedYear }}
                </h3>
                <UBadge color="gray" variant="subtle" size="xs">
                  {{ counts.total }} Perkara
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                Daftar perkara yang didaftarkan pada bulan {{ selectedMonthName }} melalui e-Court maupun Konvensional
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="closeModalDetail"
            />
          </div>
        </div>
      </template>

      <!-- Modal Body -->
      <div class="space-y-4">
        <!-- Filter Bar: Jalur Pendaftaran & Search Input -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Channel Tabs -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="channelFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setChannel('all')"
            >
              <span>Semua</span>
              <UBadge color="gray" size="xs" variant="subtle">{{ counts.total }}</UBadge>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="channelFilter === 'ecourt' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setChannel('ecourt')"
            >
              <span class="w-2 h-2 rounded-full bg-primary-500 inline-block"></span>
              <span>e-Court</span>
              <UBadge color="primary" size="xs" variant="subtle">{{ counts.ecourt }}</UBadge>
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5"
              :class="channelFilter === 'konvensional' ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
              @click="setChannel('konvensional')"
            >
              <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Konvensional</span>
              <UBadge color="amber" size="xs" variant="subtle">{{ counts.konvensional }}</UBadge>
            </button>
          </div>

          <!-- Search Input -->
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari no. perkara, pihak, jenis..."
            size="sm"
            class="w-full sm:w-72"
          >
            <template #trailing>
              <UButton
                v-if="searchQuery"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="searchQuery = ''"
              />
            </template>
          </UInput>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto min-h-[320px] relative border border-gray-200 dark:border-gray-800 rounded-lg">
          <!-- Loading Overlay -->
          <div
            v-if="loading"
            class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center backdrop-blur-xs"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
          </div>

          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-10 text-center">No</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara &amp; Register</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Daftar</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center">Jalur</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Jenis Perkara</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Para Pihak</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Proses Terakhir</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(item, idx) in daftarPerkara"
                :key="item.perkara_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <!-- Nomor Urut -->
                <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                  {{ (page - 1) * limit + idx + 1 }}
                </td>

                <!-- Nomor Perkara & Register e-Court -->
                <td class="py-2.5 px-3">
                  <span class="font-semibold text-gray-900 dark:text-white block">
                    {{ item.nomor_perkara }}
                  </span>
                  <span
                    v-if="item.nomor_register"
                    class="text-[10px] text-primary-600 dark:text-primary-400 font-mono block"
                    title="Nomor Register e-Filing"
                  >
                    Reg: {{ item.nomor_register }}
                  </span>
                </td>

                <!-- Tanggal Pendaftaran -->
                <td class="py-2.5 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {{ formatDate(item.tanggal_pendaftaran) }}
                </td>

                <!-- Jalur Pendaftaran (e-Court vs Konvensional) -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <UBadge
                    v-if="item.jenis_pendaftaran === 'ecourt'"
                    color="primary"
                    variant="subtle"
                    size="xs"
                    class="font-semibold"
                  >
                    e-Court
                  </UBadge>
                  <UBadge
                    v-else
                    color="amber"
                    variant="subtle"
                    size="xs"
                    class="font-semibold"
                  >
                    Konvensional
                  </UBadge>
                </td>

                <!-- Jenis Perkara -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="font-medium text-gray-800 dark:text-gray-200">
                    {{ item.jenis_perkara_nama || '-' }}
                  </span>
                </td>

                <!-- Para Pihak -->
                <td class="py-2.5 px-3 max-w-xs">
                  <div
                    class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2"
                    :title="cleanHtml(item.para_pihak)"
                  >
                    {{ cleanHtml(item.para_pihak) || '-' }}
                  </div>
                </td>

                <!-- Status Proses Terakhir -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                    {{ item.proses_terakhir_text || '-' }}
                  </span>
                </td>

                <!-- Tombol Buka SIPP -->
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
                    SIPP
                  </UButton>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="!loading && !daftarPerkara.length">
                <td colspan="8" class="py-12 text-center text-gray-400 text-xs">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>
                    {{
                      searchQuery
                        ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.'
                        : 'Tidak ada data perkara untuk bulan ' + selectedMonthName + ' ' + selectedYear
                    }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Footer: Info Paginasi & Kontrol Halaman -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span class="text-gray-500 dark:text-gray-400">
            Menampilkan {{ totalCases > 0 ? (page - 1) * limit + 1 : 0 }} -
            {{ Math.min(page * limit, totalCases) }} dari {{ totalCases }} perkara
          </span>
          <UPagination
            v-if="totalCases > limit"
            v-model="page"
            :page-count="limit"
            :total="totalCases"
            :max="5"
            size="xs"
            :disabled="loading"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedYear,
  isModalDetailOpen,
  selectedMonth,
  selectedMonthName,
  loadingPerkaraId,
  closeModalDetail,
  formatDate,
  cleanHtml,
  openSipp
} = useEcourt()

const page = ref(1)
const limit = 10
const channelFilter = ref('all')
const searchQuery = ref('')
const daftarPerkara = ref([])
const totalCases = ref(0)
const counts = ref({
  total: 0,
  ecourt: 0,
  konvensional: 0
})
const loading = ref(false)
let searchTimeout = null

function setChannel(ch) {
  channelFilter.value = ch
  page.value = 1
  loadDetail(true)
}

async function loadDetail(showOverlay = true) {
  if (!selectedMonth.value) return
  if (showOverlay) loading.value = true

  try {
    const res = await $fetch('/api/ecourt/detail', {
      query: {
        year: selectedYear.value,
        month: selectedMonth.value,
        page: page.value,
        limit,
        channel: channelFilter.value,
        q: searchQuery.value
      }
    })

    if (res?.success) {
      daftarPerkara.value = res.daftar || []
      totalCases.value = res.total || 0
      if (res.counts) {
        counts.value = res.counts
      }
    }
  } catch (err) {
    console.error('Gagal memuat rincian perkara bulanan:', err)
  } finally {
    loading.value = false
  }
}

watch(isModalDetailOpen, (isOpen) => {
  if (isOpen) {
    page.value = 1
    channelFilter.value = 'all'
    searchQuery.value = ''
    loadDetail(true)
  }
})

watch(page, () => {
  if (isModalDetailOpen.value) {
    loadDetail(true)
  }
})

watch(searchQuery, () => {
  if (!isModalDetailOpen.value) return
  page.value = 1
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadDetail(true)
  }, 300)
})

watch(selectedYear, () => {
  if (isModalDetailOpen.value) {
    page.value = 1
    loadDetail(true)
  }
})
</script>
