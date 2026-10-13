<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nomor perkara, pihak, majelis, PP..."
          size="sm"
          class="w-full sm:w-80"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template v-if="search" #trailing>
            <UButton
              color="gray"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="search = ''"
            />
          </template>
        </UInput>
        <span v-if="!isLoading" class="text-xs text-gray-500">
          Total: {{ data?.total || 0 }} perkara
        </span>
        <USkeleton v-else class="h-4 w-24" />
      </div>
    </template>

    <div class="overflow-x-auto min-h-[350px] relative">
      <!-- Loading Overlay saat refresh pagination/search -->
      <div v-if="pending && data?.daftar" class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center">
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

        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 8" :key="'skeleton-minutasi-' + i" class="animate-pulse">
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-4 w-6 mx-auto" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-40 mb-1" />
              <USkeleton class="h-3 w-28 mb-1" />
              <USkeleton class="h-3 w-48" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-24 mb-1" />
              <USkeleton class="h-3.5 w-16" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-32" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-44" />
            </td>
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-6 w-16 mx-auto rounded" />
            </td>
          </tr>
        </tbody>

        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="(item, idx) in data?.daftar || []"
            :key="item.perkara_id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
              {{ (page - 1) * limit + idx + 1 }}
            </td>
            <td class="py-2.5 px-3">
              <span class="font-semibold text-primary-600 dark:text-primary-400 block">{{ item.nomor_perkara }}</span>
              <span class="text-[11px] text-gray-500">{{ item.jenis_perkara_nama }}</span>
              <div v-if="item.para_pihak" class="text-[10px] text-gray-400 line-clamp-1 max-w-sm" :title="cleanHtml(item.para_pihak)">
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
          <tr v-if="!data?.daftar?.length">
            <td colspan="6" class="py-12 text-center text-gray-400 text-xs">
              {{ search ? 'Tidak ada perkara yang cocok dengan kata kunci pencarian.' : 'Tidak ada perkara yang belum diminutasi untuk tahun ' + selectedYear }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div v-if="isLoading" class="flex items-center justify-between">
        <USkeleton class="h-4 w-44" />
        <USkeleton class="h-6 w-32 rounded" />
      </div>
      <div v-else-if="(data?.total || 0) > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span class="text-gray-500">
          Menampilkan {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, data?.total || 0) }} dari {{ data?.total || 0 }} perkara
        </span>
        <UPagination
          v-if="(data?.total || 0) > limit"
          v-model="page"
          :page-count="limit"
          :total="data?.total || 0"
          :max="5"
          size="xs"
          :disabled="pending"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup>
const {
  selectedYear,
  page,
  limit,
  search,
  refreshSignal,
  loadingPerkaraId,
  formatDate,
  cleanHtml,
  openSipp
} = usePaniteraMinutasi()

const debouncedSearch = ref(search.value)
let searchDebounceTimer = null

watch(search, (newVal) => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    page.value = 1
  }, 350)
})

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/minutasi/list', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    page: page.value,
    limit,
    q: debouncedSearch.value
  })),
  watch: [selectedYear, page, debouncedSearch],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([selectedYear, debouncedSearch], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
