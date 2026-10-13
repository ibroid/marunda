<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-2"
      >
        <USkeleton class="h-4 w-40" />
        <USkeleton class="h-3 w-28" />
        <USkeleton class="h-8 w-full mt-3 rounded-lg" />
      </div>
    </div>

    <!-- Daftar Pilihan Hakim -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="h in listHakim"
        :key="h.id"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-primary-600 dark:text-primary-400">Hakim Pengadilan</span>
            <UBadge :color="h.aktif ? 'emerald' : 'gray'" variant="subtle" size="xs">
              {{ h.aktif ? 'Aktif' : 'Non-Aktif' }}
            </UBadge>
          </div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mt-1.5">{{ h.nama }}</h3>
          <p class="text-xs text-gray-500 mt-0.5">NIP: {{ h.nip }}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end">
          <UButton
            :to="`/kinerja/hakim/${h.id}`"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-heroicons-arrow-right"
            trailing
          >
            Lihat Kinerja
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data, pending } = useLazyFetch('/api/kinerja/hakim/options', {
  server: false,
  default: () => ({ data: [] })
})

const isLoading = computed(() => pending.value || !data.value)
const listHakim = computed(() => data.value?.data || [])

// Jika ada hakim, redirect otomatis ke hakim pertama
watch(listHakim, (list) => {
  if (list && list.length > 0) {
    navigateTo(`/kinerja/hakim/${list[0].id}`, { replace: true })
  }
}, { immediate: true })
</script>
