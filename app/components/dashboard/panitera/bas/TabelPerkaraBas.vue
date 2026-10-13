<template>
  <UCard>
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-75 disabled:cursor-wait"
            :class="activeFilter === 'kosong' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            @click="setFilter('kosong')"
          >
            <UIcon v-if="pending && activeFilter === 'kosong'" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <span>Belum Upload BAS ({{ sharedSummary?.basKosong || 0 }})</span>
          </button>
          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-75 disabled:cursor-wait"
            :class="activeFilter === 'ada' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            @click="setFilter('ada')"
          >
            <UIcon v-if="pending && activeFilter === 'ada'" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <span>Sudah Upload BAS ({{ sharedSummary?.basAda || 0 }})</span>
          </button>
          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-75 disabled:cursor-wait"
            :class="activeFilter === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            @click="setFilter('all')"
          >
            <UIcon v-if="pending && activeFilter === 'all'" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <span>Semua Sidang ({{ sharedSummary?.totalSidang || 0 }})</span>
          </button>
        </div>

        <!-- Search Input & Loading status -->
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div v-if="pending" class="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium whitespace-nowrap">
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <span>Memuat data...</span>
          </div>
          <div class="w-full md:w-64">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Cari nomor perkara / agenda..."
              size="xs"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template v-if="searchQuery" #trailing>
                <UButton
                  color="gray"
                  variant="link"
                  icon="i-heroicons-x-mark"
                  :padded="false"
                  @click="searchQuery = ''"
                />
              </template>
            </UInput>
          </div>
        </div>
      </div>
    </template>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300 w-12 text-center">No</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor &amp; Jenis Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tanggal &amp; Sidang Ke</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Ruangan &amp; Agenda</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300">Status e-Doc BAS</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Proses Terakhir</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-28">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <!-- Loading Skeleton Rows -->
          <template v-if="isLoading">
            <tr v-for="n in 6" :key="'skeleton-' + n" class="animate-pulse">
              <td class="py-3 px-3 text-center">
                <USkeleton class="h-4 w-5 mx-auto" />
              </td>
              <td class="py-3 px-3">
                <USkeleton class="h-4 w-36 mb-1.5" />
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-2.5 w-44" />
              </td>
              <td class="py-3 px-3">
                <USkeleton class="h-4 w-24 mb-1.5" />
                <USkeleton class="h-3 w-16" />
              </td>
              <td class="py-3 px-3">
                <USkeleton class="h-3.5 w-24 mb-1.5" />
                <USkeleton class="h-3 w-32" />
              </td>
              <td class="py-3 px-3">
                <USkeleton class="h-3.5 w-40" />
              </td>
              <td class="py-3 px-3 text-center">
                <USkeleton class="h-5 w-20 mx-auto rounded-full" />
              </td>
              <td class="py-3 px-3">
                <USkeleton class="h-3.5 w-24" />
              </td>
              <td class="py-3 px-3 text-center">
                <USkeleton class="h-6 w-20 mx-auto rounded" />
              </td>
            </tr>
          </template>

          <!-- Real Data Rows -->
          <template v-else>
            <tr
              v-for="(p, idx) in filteredPerkara"
              :key="p.sidang_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-2.5 px-3 text-center text-gray-400 font-medium">{{ idx + 1 }}</td>
              <td class="py-2.5 px-3">
                <span class="font-semibold text-primary-600 dark:text-primary-400 block">{{ p.nomor_perkara }}</span>
                <span class="text-[11px] text-gray-500">{{ p.jenis_perkara_nama }}</span>
                <div v-if="p.para_pihak" class="text-[10px] text-gray-400 line-clamp-1 max-w-xs" :title="cleanHtml(p.para_pihak)">
                  {{ cleanHtml(p.para_pihak) }}
                </div>
              </td>
              <td class="py-2.5 px-3">
                <span class="font-medium text-gray-800 dark:text-gray-200 block">{{ formatDate(p.tanggal_sidang) }}</span>
                <span class="text-[11px] text-gray-500">Sidang ke-{{ p.urutan }}</span>
              </td>
              <td class="py-2.5 px-3 max-w-xs">
                <span class="font-medium text-gray-700 dark:text-gray-300 block text-[11px]">{{ p.ruangan || '-' }}</span>
                <span class="text-[11px] text-gray-500 line-clamp-2" :title="p.agenda">{{ p.agenda || '-' }}</span>
              </td>
              <td class="py-2.5 px-3 max-w-xs">
                <span class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2" :title="cleanHtml(p.majelis_hakim_nama)">
                  {{ cleanHtml(p.majelis_hakim_nama) || '-' }}
                </span>
              </td>
              <td class="py-2.5 px-3 text-center">
                <UBadge
                  v-if="p.edoc_bas"
                  color="green"
                  variant="subtle"
                  size="xs"
                >
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 mr-1" />
                  Terupload
                </UBadge>
                <UBadge
                  v-else
                  color="red"
                  variant="subtle"
                  size="xs"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 mr-1" />
                  Kosong
                </UBadge>
              </td>
              <td class="py-2.5 px-3 text-gray-500 text-[11px]">
                {{ p.proses_terakhir_text || '-' }}
              </td>
              <td class="py-2.5 px-3 text-center">
                <UButton
                  size="2xs"
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-arrow-top-right-on-square"
                  :loading="loadingPerkaraId === p.perkara_id"
                  title="Buka detail perkara di SIPP"
                  @click="openSipp(p.perkara_id)"
                >
                  Buka SIPP
                </UButton>
              </td>
            </tr>
            <tr v-if="!filteredPerkara.length">
              <td colspan="8" class="py-10 text-center text-gray-400 text-xs">
                <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p class="font-medium">Tidak ada data persidangan yang cocok dengan kriteria pencarian.</p>
                <p v-if="activeFilter === 'kosong'" class="text-green-600 dark:text-green-400 mt-1">
                  Semua file Berita Acara Sidang (BAS) untuk Panitera ini telah diunggah dengan lengkap!
                </p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const {
  ppId,
  selectedYear,
  activeFilter,
  searchQuery,
  refreshSignal,
  sharedSummary,
  loadingPerkaraId,
  setFilter,
  formatDate,
  cleanHtml,
  openSipp
} = usePaniteraBas()

const { data, pending, refresh } = useLazyFetch(() => `/api/dashboard/panitera/bas/${ppId.value}/list`, {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    status: activeFilter.value
  })),
  watch: [selectedYear, activeFilter, ppId],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const filteredPerkara = computed(() => {
  const list = data.value?.daftarPerkara || []
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(item => {
    return (
      (item.nomor_perkara && item.nomor_perkara.toLowerCase().includes(q)) ||
      (item.agenda && item.agenda.toLowerCase().includes(q)) ||
      (item.ruangan && item.ruangan.toLowerCase().includes(q)) ||
      (item.majelis_hakim_nama && item.majelis_hakim_nama.toLowerCase().includes(q)) ||
      (item.jenis_perkara_nama && item.jenis_perkara_nama.toLowerCase().includes(q))
    )
  })
})

watch([selectedYear, activeFilter], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
