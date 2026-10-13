<template>
  <UModal v-model="isModalMinutasiOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-red-50 dark:bg-red-950/40 rounded-lg text-red-600 dark:text-red-400">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Daftar Perkara Belum Minutasi
                <UBadge color="red" variant="subtle" size="xs">
                  {{ totalMinutasiCases }} Perkara
                </UBadge>
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">
                Perkara yang telah diputus namun belum selesai diminutasi — Tahun {{ selectedYear }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              to="/dashboard/panitera/minutasi"
              variant="ghost"
              color="gray"
              size="xs"
              icon="i-heroicons-arrow-top-right-on-square"
              title="Buka di halaman penuh"
            >
              Halaman Penuh
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="closeModalMinutasi"
            />
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Search & Filter Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <UInput
            v-model="searchMinutasi"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara, pihak, majelis, PP..."
            size="sm"
            class="w-full sm:w-80"
          >
            <template #trailing>
              <UButton
                v-if="searchMinutasi"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="searchMinutasi = ''"
              />
            </template>
          </UInput>
          <span class="text-xs text-gray-500 self-end sm:self-center">
            Total: {{ totalMinutasiCases }} perkara
          </span>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto min-h-[300px] relative border border-gray-200 dark:border-gray-800 rounded-lg">
          <!-- Loading Overlay -->
          <div v-if="loadingMinutasi" class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-red-500" />
          </div>

          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">No</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara &amp; Pihak</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Putus</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Panitera Pengganti</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(item, idx) in daftarMinutasi" :key="item.perkara_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                  {{ (pageMinutasi - 1) * limitMinutasi + idx + 1 }}
                </td>
                <td class="py-2.5 px-3">
                  <span class="font-semibold text-primary-600 dark:text-primary-400 block">{{ item.nomor_perkara }}</span>
                  <span class="text-[11px] text-gray-500">{{ item.jenis_perkara_nama }}</span>
                  <div v-if="item.para_pihak" class="text-[10px] text-gray-400 line-clamp-1 max-w-xs" :title="cleanHtml(item.para_pihak)">
                    {{ cleanHtml(item.para_pihak) }}
                  </div>
                </td>
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <span class="font-medium text-gray-800 dark:text-gray-200 block">{{ formatDate(item.tanggal_putusan) }}</span>
                  <UBadge
                    :color="item.selisih_hari > 14 ? 'red' : item.selisih_hari > 7 ? 'amber' : 'gray'"
                    variant="subtle"
                    size="xs"
                    class="mt-0.5"
                  >
                    {{ item.selisih_hari }} hari lalu
                  </UBadge>
                </td>
                <td class="py-2.5 px-3">
                  <span class="font-medium text-gray-700 dark:text-gray-300 block text-[11px]">{{ item.panitera_pengganti_nama || '-' }}</span>
                </td>
                <td class="py-2.5 px-3 max-w-xs">
                  <span class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2" :title="cleanHtml(item.majelis_hakim_nama)">
                    {{ cleanHtml(item.majelis_hakim_nama) || '-' }}
                  </span>
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
              <tr v-if="!loadingMinutasi && !daftarMinutasi.length">
                <td colspan="6" class="py-8 text-center text-gray-400 text-xs">
                  {{ searchMinutasi ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Tidak ada perkara yang belum diminutasi untuk tahun ' + selectedYear }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span class="text-gray-500">
            Menampilkan {{ totalMinutasiCases > 0 ? (pageMinutasi - 1) * limitMinutasi + 1 : 0 }} - {{ Math.min(pageMinutasi * limitMinutasi, totalMinutasiCases) }} dari {{ totalMinutasiCases }} perkara
          </span>
          <UPagination
            v-if="totalMinutasiCases > limitMinutasi"
            v-model="pageMinutasi"
            :page-count="limitMinutasi"
            :total="totalMinutasiCases"
            :max="5"
            size="xs"
            :disabled="loadingMinutasi"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedYear,
  isModalMinutasiOpen,
  totalMinutasiCases,
  loadingPerkaraId,
  closeModalMinutasi,
  formatDate,
  cleanHtml,
  openSipp
} = useDashboardPanitera()

const pageMinutasi = ref(1)
const limitMinutasi = 10
const searchMinutasi = ref('')
const daftarMinutasi = ref([])
const loadingMinutasi = ref(false)
let searchMinutasiTimeout = null

async function loadModalMinutasi(showOverlay = true) {
  if (showOverlay) loadingMinutasi.value = true
  try {
    const res = await $fetch('/api/dashboard/panitera/minutasi', {
      query: {
        year: selectedYear.value,
        page: pageMinutasi.value,
        limit: limitMinutasi,
        q: searchMinutasi.value
      }
    })
    if (res?.success) {
      daftarMinutasi.value = res.daftar || []
      totalMinutasiCases.value = res.total || 0
    }
  } catch (err) {
    console.error('Gagal memuat daftar perkara belum minutasi:', err)
  } finally {
    loadingMinutasi.value = false
  }
}

watch(isModalMinutasiOpen, (isOpen) => {
  if (isOpen) {
    pageMinutasi.value = 1
    searchMinutasi.value = ''
    loadModalMinutasi(true)
  }
})

watch(pageMinutasi, () => {
  if (isModalMinutasiOpen.value) {
    loadModalMinutasi(true)
  }
})

watch(searchMinutasi, () => {
  if (!isModalMinutasiOpen.value) return
  pageMinutasi.value = 1
  if (searchMinutasiTimeout) clearTimeout(searchMinutasiTimeout)
  searchMinutasiTimeout = setTimeout(() => {
    loadModalMinutasi(true)
  }, 300)
})

watch(selectedYear, () => {
  if (isModalMinutasiOpen.value) {
    pageMinutasi.value = 1
    loadModalMinutasi(true)
  }
})
</script>
