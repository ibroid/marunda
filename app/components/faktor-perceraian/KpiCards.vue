<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <!-- Card 1: Total Perceraian -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-rose-400 group"
      @click="openTotalDetail('all', 'Semua Faktor Perceraian')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Total Perceraian
        </span>
        <div class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-heart" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {{ formatNumber(data?.summary?.totalPerceraian) }}
            </span>
            <span class="text-xs font-medium text-gray-400">Akta Cerai</span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-rose-500" />
            <span>Klik untuk rincian perkara</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 2: Cerai Gugat (Diajukan Istri) -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-pink-400 group"
      @click="openTotalDetail('Cerai Gugat', 'Cerai Gugat (Diajukan Istri)')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Cerai Gugat (Istri)
        </span>
        <div class="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-user-minus" class="w-5 h-5" />
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
              {{ formatNumber(data?.summary?.ceraiGugat) }}
            </span>
            <UBadge color="pink" variant="subtle" size="xs">
              {{ data?.summary?.persentaseGugat }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-pink-500" />
            <span>Dominasi gugatan perceraian</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 3: Cerai Talak (Diajukan Suami) -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-indigo-400 group"
      @click="openTotalDetail('Cerai Talak', 'Cerai Talak (Diajukan Suami)')"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Cerai Talak (Suami)
        </span>
        <div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
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
            <span class="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {{ formatNumber(data?.summary?.ceraiTalak) }}
            </span>
            <UBadge color="indigo" variant="subtle" size="xs">
              {{ data?.summary?.persentaseTalak }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-indigo-500" />
            <span>Permohonan ikrar talak</span>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 4: Faktor Terbanyak / Dominan -->
    <UCard
      class="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-amber-400 group"
      @click="openFaktorDominanDetail"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Faktor Terbanyak
        </span>
        <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
          <UIcon name="i-heroicons-fire" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {{ formatNumber(data?.summary?.faktorDominan?.total) }}
            </span>
            <UBadge color="amber" variant="subtle" size="xs">
              {{ data?.summary?.faktorDominan?.persentase }}%
            </UBadge>
          </div>
          <p class="text-[11px] text-gray-600 dark:text-gray-300 font-medium mt-1 truncate" :title="data?.summary?.faktorDominan?.nama">
            {{ data?.summary?.faktorDominan?.nama || '-' }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Card 5: Rata-rata per Bulan -->
    <UCard class="relative overflow-hidden">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Rata-rata / Bulan
        </span>
        <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3">
        <div v-if="isLoading" class="space-y-1.5">
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-3 w-32" />
        </div>
        <div v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {{ formatNumber(data?.summary?.rataRataPerBulan) }}
            </span>
            <span class="text-xs font-medium text-gray-400">Kasus/Bln</span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1">
            Dari {{ data?.summary?.faktorAktif || 0 }} faktor aktif terdata
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const {
  selectedYear,
  selectedJenisCerai,
  selectedMonth,
  refreshSignal,
  formatNumber,
  openDetailModal
} = useFaktorPerceraian()

const { data, pending, refresh } = useLazyFetch('/api/faktor-perceraian/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value,
    month: selectedMonth.value,
    jenis_cerai: selectedJenisCerai.value
  })),
  watch: [selectedYear, selectedMonth, selectedJenisCerai, refreshSignal],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

function openTotalDetail(jenis = 'all', label = 'Semua Faktor Perceraian') {
  openDetailModal({
    faktorId: null,
    faktorNama: label,
    jenisCerai: jenis,
    totalCount: jenis === 'Cerai Gugat'
      ? data.value?.summary?.ceraiGugat
      : jenis === 'Cerai Talak'
        ? data.value?.summary?.ceraiTalak
        : data.value?.summary?.totalPerceraian
  })
}

function openFaktorDominanDetail() {
  const dominan = data.value?.summary?.faktorDominan
  if (!dominan || !dominan.id) return
  openDetailModal({
    faktorId: dominan.id,
    faktorNama: dominan.nama,
    jenisCerai: selectedJenisCerai.value,
    totalCount: dominan.total
  })
}
</script>
