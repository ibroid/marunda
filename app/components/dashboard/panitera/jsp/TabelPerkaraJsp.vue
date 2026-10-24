<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-75 disabled:cursor-wait"
            :class="activeTab === 'pbt' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            @click="setTab('pbt')"
          >
            <UIcon v-if="pending && activeTab === 'pbt'" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <UIcon v-else name="i-heroicons-document-magnifying-glass" class="w-3.5 h-3.5" />
            <span>Tunggakan PBT Tergugat ({{ sharedSummary?.totalPbt || 0 }})</span>
          </button>
          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-75 disabled:cursor-wait"
            :class="activeTab === 'tugas' ? 'bg-teal-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            @click="setTab('tugas')"
          >
            <UIcon v-if="pending && activeTab === 'tugas'" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <UIcon v-else name="i-heroicons-queue-list" class="w-3.5 h-3.5" />
            <span>Semua Tugas Penetapan ({{ sharedSummary?.totalTugas || 0 }})</span>
          </button>
        </div>

        <div class="text-xs text-gray-500">
          Total {{ data?.total || 0 }} Perkara
        </div>
      </div>
    </template>

    <div class="overflow-x-auto min-h-[380px] relative">
      <!-- Loading overlay -->
      <div v-if="pending && data?.daftar" class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-teal-600" />
      </div>

      <!-- TAB 1: Tunggakan PBT Tergugat -->
      <table v-if="activeTab === 'pbt'" class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-12">No</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Panitera Sidang</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Putus</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Status Putusan</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Status Terakhir</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-28">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <!-- Skeleton Rows -->
          <template v-if="isLoading">
            <tr v-for="n in 5" :key="'skeleton-pbt-' + n" class="animate-pulse">
              <td class="py-3 px-3 text-center"><USkeleton class="h-4 w-4 mx-auto" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-32 mb-1" /><USkeleton class="h-3 w-20" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-36 mb-1" /><USkeleton class="h-3 w-24" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-28" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-20" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-16 rounded-full" /></td>
              <td class="py-3 px-3"><USkeleton class="h-3.5 w-24" /></td>
              <td class="py-3 px-3 text-center"><USkeleton class="h-6 w-16 mx-auto rounded" /></td>
            </tr>
          </template>

          <!-- Real Rows -->
          <template v-else>
            <tr
              v-for="(p, idx) in data?.daftar || []"
              :key="p.perkara_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                {{ (page - 1) * limit + idx + 1 }}
              </td>
              <td class="py-2.5 px-3 font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap" :title="cleanHtml(p.para_pihak)">
                {{ p.nomor_perkara }}
                <span class="block text-[11px] font-normal text-gray-500">{{ p.jenis_perkara_nama }}</span>
              </td>
              <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300 max-w-xs" :title="cleanHtml(p.majelis_hakim_nama)">
                <div class="line-clamp-2 text-[11px] leading-tight">
                  {{ cleanHtml(p.majelis_hakim_nama) || '-' }}
                </div>
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                <div class="text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[160px] truncate" :title="p.panitera_pengganti_nama">
                  {{ p.panitera_pengganti_nama || '-' }}
                </div>
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                {{ formatDate(p.tanggal_putusan) }}
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                <UBadge color="orange" variant="subtle" size="xs">
                  Verstek
                </UBadge>
              </td>
              <td class="py-2.5 px-3 text-gray-500 text-[11px] max-w-xs truncate" :title="p.proses_terakhir_text">
                {{ p.proses_terakhir_text || '-' }}
              </td>
              <td class="py-2.5 px-3 text-center whitespace-nowrap">
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
            <tr v-if="!data?.daftar?.length">
              <td colspan="8" class="py-10 text-center text-gray-400 text-xs">
                <UIcon name="i-heroicons-check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p class="font-medium text-gray-700 dark:text-gray-300">Tidak ada tunggakan pemberitahuan isi putusan (PBT).</p>
                <p class="text-green-600 dark:text-green-400 mt-1">
                  Semua perkara verstek yang ditugaskan kepada Jurusita ini telah terkirim PBT atau sudah berkekuatan hukum tetap (BHT)!
                </p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- TAB 2: Semua Tugas Penetapan -->
      <table v-else class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-12">No</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Daftar</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Panitera Sidang</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Status Putusan</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Proses Terakhir</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-28">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <!-- Skeleton Rows -->
          <template v-if="isLoading">
            <tr v-for="n in 5" :key="'skeleton-tugas-' + n" class="animate-pulse">
              <td class="py-3 px-3 text-center"><USkeleton class="h-4 w-4 mx-auto" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-32 mb-1" /><USkeleton class="h-3 w-20" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-20" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-36 mb-1" /><USkeleton class="h-3 w-24" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-28" /></td>
              <td class="py-3 px-3"><USkeleton class="h-4 w-20 rounded-full" /></td>
              <td class="py-3 px-3"><USkeleton class="h-3.5 w-24" /></td>
              <td class="py-3 px-3 text-center"><USkeleton class="h-6 w-16 mx-auto rounded" /></td>
            </tr>
          </template>

          <!-- Real Rows -->
          <template v-else>
            <tr
              v-for="(p, idx) in data?.daftar || []"
              :key="p.perkara_id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-2.5 px-3 text-center text-gray-400 font-medium">
                {{ (page - 1) * limit + idx + 1 }}
              </td>
              <td class="py-2.5 px-3 font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap" :title="cleanHtml(p.para_pihak)">
                {{ p.nomor_perkara }}
                <span class="block text-[11px] font-normal text-gray-500">{{ p.jenis_perkara_nama }}</span>
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                {{ formatDate(p.tanggal_pendaftaran) }}
              </td>
              <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300 max-w-xs" :title="cleanHtml(p.majelis_hakim_nama)">
                <div class="line-clamp-2 text-[11px] leading-tight">
                  {{ cleanHtml(p.majelis_hakim_nama) || '-' }}
                </div>
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                <div class="text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[160px] truncate" :title="p.panitera_pengganti_nama">
                  {{ p.panitera_pengganti_nama || '-' }}
                </div>
              </td>
              <td class="py-2.5 px-3 whitespace-nowrap">
                <template v-if="p.tanggal_putusan">
                  <UBadge color="green" variant="subtle" size="xs">
                    Putus: {{ formatDate(p.tanggal_putusan) }}
                  </UBadge>
                </template>
                <template v-else>
                  <UBadge color="amber" variant="subtle" size="xs">
                    Dalam Sidang
                  </UBadge>
                </template>
              </td>
              <td class="py-2.5 px-3 text-gray-500 text-[11px] max-w-xs truncate" :title="p.proses_terakhir_text">
                {{ p.proses_terakhir_text || '-' }}
              </td>
              <td class="py-2.5 px-3 text-center whitespace-nowrap">
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
            <tr v-if="!data?.daftar?.length">
              <td colspan="8" class="py-10 text-center text-gray-400 text-xs">
                Tidak ada data perkara yang ditugaskan untuk jurusita ini pada tahun {{ selectedYear }}.
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div v-if="(data?.total || 0) > 0" class="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
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
  jspId,
  selectedYear,
  activeTab,
  page,
  limit,
  refreshSignal,
  sharedSummary,
  loadingPerkaraId,
  setTab,
  formatDate,
  cleanHtml,
  openSipp
} = useJurusitaDetail()

const { data, pending, refresh } = useLazyFetch(() => `/api/dashboard/panitera/jsp/${jspId.value}/list`, {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    tab: activeTab.value,
    page: page.value,
    limit
  })),
  watch: [selectedYear, activeTab, page, jspId],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch([selectedYear, activeTab], () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
