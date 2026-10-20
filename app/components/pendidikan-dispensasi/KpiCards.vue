<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <!-- Card 1: Total Perkara Dispensasi -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-400 group"
      @click="openTotalDetail('all', 'Semua Tingkat Pendidikan')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total Perkara
        </span>
        <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-scale" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {{ formatNumber(data?.summary?.totalPerkara) }}
            </span>
            <span class="text-xs font-medium text-gray-400">Perkara</span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-emerald-500" />
            <span>Klik untuk rincian perkara</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 2: Total Anak / Calon Mempelai -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-400 group"
      @click="openTotalDetail('all', 'Semua Anak / Calon Mempelai')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total Anak Mempelai
        </span>
        <div class="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {{ formatNumber(data?.summary?.totalAnak) }}
            </span>
            <span class="text-xs font-medium text-gray-400">Orang</span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-teal-500" />
            <span>Calon suami & istri</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 3: Calon Suami (Laki-laki) -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-400 group"
      @click="openTotalDetail('all', 'Calon Suami (Laki-laki)', 'pria')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Calon Suami (L)
        </span>
        <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-user" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {{ formatNumber(data?.summary?.calonSuami) }}
            </span>
            <UBadge color="blue" variant="subtle" size="xs">
              {{ data?.summary?.persentaseSuami }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-blue-500" />
            <span>Mempelai Laki-laki</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 4: Calon Istri (Perempuan) -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-pink-400 group"
      @click="openTotalDetail('all', 'Calon Istri (Perempuan)', 'wanita')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Calon Istri (P)
        </span>
        <div class="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-user" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-pink-600 dark:text-pink-400">
              {{ formatNumber(data?.summary?.calonIstri) }}
            </span>
            <UBadge color="pink" variant="subtle" size="xs">
              {{ data?.summary?.persentaseIstri }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-pink-500" />
            <span>Mempelai Perempuan</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 5: Pendidikan Anak Terbanyak -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-amber-400 group"
      @click="openTopDetail"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Pendidikan Terbanyak
        </span>
        <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-trophy" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-28" />
          <USkeleton class="h-3 w-36" />
        </div>
        <div v-else-if="data?.summary?.topPendidikan">
          <div class="flex items-baseline gap-2">
            <span class="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 truncate max-w-[170px]" :title="data.summary.topPendidikan.nama">
              {{ data.summary.topPendidikan.kode || data.summary.topPendidikan.nama }}
            </span>
            <UBadge color="amber" variant="subtle" size="xs">
              {{ data.summary.topPendidikan.persentase }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 truncate">
            <strong>{{ formatNumber(data.summary.topPendidikan.totalAnak) }}</strong> anak ({{ formatNumber(data.summary.topPendidikan.totalPerkara) }} perkara)
          </p>
        </div>
        <div v-else>
          <span class="text-lg font-bold text-gray-400">Tidak Ada Data</span>
          <p class="text-[11px] text-gray-400 mt-1">Belum ada perkara</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedMonth,
  selectedKategori,
  refreshSignal,
  formatNumber,
  openDetailModal
} = usePendidikanDispensasi()

const { data, pending, refresh } = useLazyFetch('/api/pendidikan-dispensasi/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    kategori: selectedKategori.value,
    _t: refreshSignal.value
  })),
  watch: [refreshSignal, selectedYear, selectedMonth, selectedKategori],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

const openTotalDetail = (pendidikanId = 'all', title = 'Semua Tingkat Pendidikan', overrideKategori = null) => {
  openDetailModal({
    pendidikanId: pendidikanId === 'all' ? null : Number(pendidikanId),
    pendidikanKode: '',
    pendidikanNama: title,
    kategori: overrideKategori || selectedKategori.value,
    totalCount: data.value?.summary?.totalAnak || 0
  })
}

const openTopDetail = () => {
  const top = data.value?.summary?.topPendidikan
  if (!top) return
  openDetailModal({
    pendidikanId: top.id,
    pendidikanKode: top.kode,
    pendidikanNama: top.nama,
    kategori: selectedKategori.value,
    totalCount: top.totalAnak
  })
}
</script>
