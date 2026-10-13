<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
      <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4 text-primary-500" />
      Audit Penetapan Perkara Baru
    </h3>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <USkeleton class="h-3.5 w-20" />
          <USkeleton class="h-5 w-8 rounded-full" />
        </div>
        <USkeleton class="h-3 w-32" />
      </div>
    </div>

    <!-- Real Content -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- 1. Belum PMH -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition hover:border-primary-500"
        :class="{ 'ring-2 ring-primary-500': activeKategori === 'belum_pmh' }"
        @click="selectKategori('belum_pmh')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Belum PMH</span>
          <UBadge :color="(data?.counts?.belumPmh || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.counts?.belumPmh || 0 }}
          </UBadge>
        </div>
        <p class="text-xs text-gray-400 mt-2">Penetapan Majelis Hakim</p>
      </div>

      <!-- 2. Belum PP -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition hover:border-primary-500"
        :class="{ 'ring-2 ring-primary-500': activeKategori === 'belum_pp' }"
        @click="selectKategori('belum_pp')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Belum PP</span>
          <UBadge :color="(data?.counts?.belumPp || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.counts?.belumPp || 0 }}
          </UBadge>
        </div>
        <p class="text-xs text-gray-400 mt-2">Penunjukan Panitera Pengganti</p>
      </div>

      <!-- 3. Belum JSP -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition hover:border-primary-500"
        :class="{ 'ring-2 ring-primary-500': activeKategori === 'belum_jsp' }"
        @click="selectKategori('belum_jsp')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Belum JSP</span>
          <UBadge :color="(data?.counts?.belumJsp || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.counts?.belumJsp || 0 }}
          </UBadge>
        </div>
        <p class="text-xs text-gray-400 mt-2">Penunjukan Jurusita</p>
      </div>

      <!-- 4. Belum PHS -->
      <div
        class="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition hover:border-primary-500"
        :class="{ 'ring-2 ring-primary-500': activeKategori === 'belum_phs' }"
        @click="selectKategori('belum_phs')"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Belum PHS</span>
          <UBadge :color="(data?.counts?.belumPhs || 0) > 0 ? 'red' : 'green'" size="xs">
            {{ data?.counts?.belumPhs || 0 }}
          </UBadge>
        </div>
        <p class="text-xs text-gray-400 mt-2">Penetapan Hari Sidang</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, activeKategori, refreshSignal, selectKategori } = useKontrol()

const { data, pending, refresh } = useLazyFetch('/api/kontrol/penetapan', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
