<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-indigo-500" />
          Cerai Talak BHT Belum Pelaksanaan Ikrar
        </h3>
        <UBadge v-if="!isLoading" color="indigo" variant="subtle" size="xs">
          {{ data?.total || 0 }} Perkara
        </UBadge>
        <USkeleton v-else class="h-5 w-20 rounded-full" />
      </div>
    </template>

    <div class="overflow-x-auto min-h-[340px] relative">
      <!-- Loading overlay saat ganti halaman -->
      <div v-if="pending && data" class="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-indigo-500" />
      </div>

      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Putus</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl BHT</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-28">Aksi</th>
          </tr>
        </thead>
        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-36" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-20" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-20" />
            </td>
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-6 w-16 mx-auto rounded" />
            </td>
          </tr>
        </tbody>
        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="p in data?.daftar" :key="p.perkara_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="py-2.5 px-3 font-medium text-primary-600 dark:text-primary-400">{{ p.nomor_perkara }}</td>
            <td class="py-2.5 px-3">{{ formatDate(p.tanggal_putusan) }}</td>
            <td class="py-2.5 px-3 font-medium text-indigo-600 dark:text-indigo-400">{{ formatDate(p.tanggal_bht) }}</td>
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
          <tr v-if="!data?.daftar?.length">
            <td colspan="4" class="py-6 text-center text-gray-400 text-xs">
              Semua perkara CT yang sudah BHT telah melaksanakan ikrar talak.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div v-if="isLoading" class="flex items-center justify-between">
        <USkeleton class="h-4 w-44" />
        <USkeleton class="h-6 w-28 rounded" />
      </div>
      <div v-else-if="(data?.total || 0) > 0" class="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
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
const { selectedYear, refreshSignal, loadingPerkaraId, formatDate, openSipp } = useDashboardPanitera()

const page = ref(1)
const limit = 10

const { data, pending, refresh } = useLazyFetch('/api/dashboard/panitera/ct', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    page: page.value,
    limit
  })),
  watch: [selectedYear, page],
  default: () => null
})

const isLoading = computed(() => pending.value && !data.value)

watch(selectedYear, () => {
  page.value = 1
  data.value = null
})

watch(refreshSignal, () => {
  page.value = 1
  refresh()
})
</script>
