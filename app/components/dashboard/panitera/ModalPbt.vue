<template>
  <UModal v-model="isModalPbtOpen" :ui="{ width: 'sm:max-w-4xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-orange-50 dark:bg-orange-950/40 rounded-lg text-orange-600 dark:text-orange-400">
              <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Daftar Perkara Tunggakan PBT (JSP)
                <UBadge color="orange" variant="subtle" size="xs">
                  {{ totalPbtCases }} Perkara
                </UBadge>
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">
                Perkara putusan verstek belum BHT yang belum ada data pemberitahuan putusan ke Tergugat — Tahun {{ selectedYear }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="closeModalPbt"
            />
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Search & Filter Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <UInput
            v-model="searchPbt"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nomor perkara, pihak, jurusita..."
            size="sm"
            class="w-full sm:w-80"
          >
            <template #trailing>
              <UButton
                v-if="searchPbt"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="searchPbt = ''"
              />
            </template>
          </UInput>
          <span class="text-xs text-gray-500 self-end sm:self-center">
            Total: {{ totalPbtCases }} perkara
          </span>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto min-h-[300px] relative border border-gray-200 dark:border-gray-800 rounded-lg">
          <!-- Loading Overlay -->
          <div v-if="loadingPbt" class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-orange-500" />
          </div>

          <table class="w-full text-left text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">No</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara &amp; Pihak</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Putus</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Jurusita (JSP)</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Status Putusan</th>
                <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(item, idx) in daftarPbt" :key="item.perkara_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                  {{ (pagePbt - 1) * limitPbt + idx + 1 }}
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
                  <NuxtLink
                    v-if="item.jurusita_id"
                    :to="`/dashboard/panitera/jsp/${item.jurusita_id}?year=${selectedYear}&tab=pbt`"
                    class="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 hover:underline block text-[11px]"
                    :title="`Buka detail beban tugas ${item.jurusita_nama}`"
                  >
                    {{ item.jurusita_nama }}
                  </NuxtLink>
                  <span v-else class="font-medium text-gray-700 dark:text-gray-300 block text-[11px]">
                    {{ item.jurusita_nama || '-' }}
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <UBadge color="orange" variant="subtle" size="xs">
                    {{ item.status_putusan_nama || 'Verstek' }}
                  </UBadge>
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
              <tr v-if="!loadingPbt && !daftarPbt.length">
                <td colspan="6" class="py-8 text-center text-gray-400 text-xs">
                  {{ searchPbt ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Tidak ada perkara tunggakan PBT untuk tahun ' + selectedYear }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span class="text-gray-500">
            Menampilkan {{ totalPbtCases > 0 ? (pagePbt - 1) * limitPbt + 1 : 0 }} - {{ Math.min(pagePbt * limitPbt, totalPbtCases) }} dari {{ totalPbtCases }} perkara
          </span>
          <UPagination
            v-if="totalPbtCases > limitPbt"
            v-model="pagePbt"
            :page-count="limitPbt"
            :total="totalPbtCases"
            :max="5"
            size="xs"
            :disabled="loadingPbt"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const {
  selectedYear,
  isModalPbtOpen,
  totalPbtCases,
  loadingPerkaraId,
  closeModalPbt,
  formatDate,
  cleanHtml,
  openSipp
} = useDashboardPanitera()

const pagePbt = ref(1)
const limitPbt = 10
const searchPbt = ref('')
const daftarPbt = ref([])
const loadingPbt = ref(false)
let searchPbtTimeout = null

async function loadModalPbt(showOverlay = true) {
  if (showOverlay) loadingPbt.value = true
  try {
    const res = await $fetch('/api/dashboard/panitera/pbt', {
      query: {
        year: selectedYear.value,
        page: pagePbt.value,
        limit: limitPbt,
        q: searchPbt.value
      }
    })
    if (res?.success) {
      daftarPbt.value = res.daftar || []
      totalPbtCases.value = res.total || 0
    }
  } catch (err) {
    console.error('Gagal memuat daftar perkara tunggakan PBT:', err)
  } finally {
    loadingPbt.value = false
  }
}

watch(isModalPbtOpen, (isOpen) => {
  if (isOpen) {
    pagePbt.value = 1
    searchPbt.value = ''
    loadModalPbt(true)
  }
})

watch(pagePbt, () => {
  if (isModalPbtOpen.value) {
    loadModalPbt(true)
  }
})

watch(searchPbt, () => {
  if (!isModalPbtOpen.value) return
  pagePbt.value = 1
  if (searchPbtTimeout) clearTimeout(searchPbtTimeout)
  searchPbtTimeout = setTimeout(() => {
    loadModalPbt(true)
  }, 300)
})

watch(selectedYear, () => {
  if (isModalPbtOpen.value) {
    pagePbt.value = 1
    loadModalPbt(true)
  }
})
</script>
