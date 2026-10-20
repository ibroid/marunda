<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="space-y-1">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <UIcon :name="currentMenu?.icon || 'i-heroicons-banknotes'" class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{{ currentMenu?.label || 'Keuangan Harian' }}</span>
            <UBadge
              v-if="selectedDate"
              color="emerald"
              variant="subtle"
              size="xs"
              class="font-mono text-xs"
            >
              {{ formatDateLong(selectedDate) }}
            </UBadge>
            <UBadge
              v-else
              color="amber"
              variant="subtle"
              size="xs"
              class="text-xs"
            >
              Pilih Tanggal Transaksi
            </UBadge>
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ currentMenu?.deskripsi || 'Monitoring pencatatan transaksi kas keuangan perkara harian SIPP.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tombol Aksi -->
    <div class="flex items-center gap-2">
      <UButton
        color="gray"
        variant="outline"
        size="sm"
        icon="i-heroicons-arrow-path"
        :disabled="!selectedDate"
        @click="triggerRefresh"
      >
        Perbarui Data
      </UButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentSlug: {
    type: String,
    required: true
  }
})

const { menus, selectedDate, triggerRefresh, formatDateLong } = useKeuanganHarian()

const currentMenu = computed(() => {
  return menus.find(m => m.slug === props.currentSlug) || menus[0]
})
</script>
