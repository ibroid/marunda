<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- Info Profil Hakim & Tombol Kembali -->
      <div class="flex items-start sm:items-center gap-3 min-w-0">
        <UButton
          to="/dashboard/ketua"
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          size="sm"
          class="shrink-0"
          title="Kembali ke Dashboard Ketua"
        />

        <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/50 flex items-center justify-center shrink-0 text-primary-600 dark:text-primary-400">
          <UIcon name="i-heroicons-scale" class="w-6 h-6" />
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              {{ sharedHakim?.nama || 'Detail Kinerja Hakim' }}
            </h1>
            <UBadge
              v-if="sharedHakim?.aktif"
              color="emerald"
              variant="subtle"
              size="xs"
              class="font-medium"
            >
              Aktif
            </UBadge>
            <UBadge
              v-else-if="sharedHakim"
              color="gray"
              variant="subtle"
              size="xs"
            >
              Non-Aktif
            </UBadge>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>NIP: <span class="font-medium text-gray-700 dark:text-gray-300">{{ sharedHakim?.nip || '-' }}</span></span>
            <span class="text-gray-300 dark:text-gray-600">•</span>
            <span>Peran: <span class="font-medium text-primary-600 dark:text-primary-400">{{ roleLabel }}</span></span>
            <span class="text-gray-300 dark:text-gray-600">•</span>
            <span>Tahun Evaluasi: <span class="font-bold text-gray-700 dark:text-gray-300">{{ selectedYear }}</span></span>
          </p>
        </div>
      </div>

      <!-- Controls: Switcher Hakim, Peran, Tahun, Refresh -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Switcher Hakim Cepat -->
        <div class="w-44 sm:w-52">
          <USelectMenu
            v-model="currentHakimSelection"
            :options="hakimOptions"
            value-attribute="id"
            option-attribute="nama"
            placeholder="Pilih Hakim..."
            size="sm"
            searchable
            searchable-placeholder="Cari nama hakim..."
          >
            <template #leading>
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-gray-400" />
            </template>
          </USelectMenu>
        </div>

        <!-- Filter Peran Majelis -->
        <USelectMenu
          v-model="roleFilter"
          :options="roleOptions"
          value-attribute="value"
          option-attribute="label"
          size="sm"
          class="w-36"
        >
          <template #leading>
            <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-gray-400" />
          </template>
        </USelectMenu>

        <!-- Filter Tahun -->
        <USelectMenu
          v-model="selectedYear"
          :options="yearOptions"
          value-attribute="value"
          option-attribute="label"
          size="sm"
          class="w-24"
        >
          <template #leading>
            <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
          </template>
        </USelectMenu>

        <!-- Tombol Refresh -->
        <UButton
          color="gray"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="isRefreshing"
          @click="handleRefresh"
        >
          Perbarui
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  hakimId,
  selectedYear,
  roleFilter,
  sharedHakim,
  triggerRefresh,
  switchHakim
} = useKinerjaHakimDetail()

const isRefreshing = ref(false)

const handleRefresh = () => {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

// Fetch list opsi hakim aktif untuk dropdown switch
const { data: optionsData } = useLazyFetch('/api/kinerja/hakim/options', {
  server: false,
  default: () => ({ data: [] })
})

const hakimOptions = computed(() => {
  return optionsData.value?.data || []
})

const currentHakimSelection = computed({
  get: () => hakimId.value,
  set: (val) => {
    if (val) switchHakim(val)
  }
})

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: `${currentYear}`, value: currentYear },
  { label: `${currentYear - 1}`, value: currentYear - 1 },
  { label: `${currentYear - 2}`, value: currentYear - 2 },
  { label: `${currentYear - 3}`, value: currentYear - 3 }
]

const roleOptions = [
  { label: 'Ketua Majelis', value: 'ketua' },
  { label: 'Semua Peran', value: 'semua' }
]

const roleLabel = computed(() => {
  return roleFilter.value === 'semua' ? 'Ketua & Anggota Majelis' : 'Ketua Majelis'
})
</script>
