<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <!-- Tab Register Buttons with Summary Counts -->
    <div class="flex flex-wrap border-b md:border-b-0 border-gray-200 dark:border-gray-700 gap-1.5">
      <button
        v-for="tab in registerTabs"
        :key="tab.id"
        class="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition"
        :class="activeJenis === tab.id
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60'"
        @click="setJenis(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <UBadge
          v-if="!isLoading && getCountForTab(tab.id) !== undefined"
          :color="activeJenis === tab.id ? 'white' : 'gray'"
          :variant="activeJenis === tab.id ? 'solid' : 'subtle'"
          size="xs"
          class="font-mono text-[10px]"
          :class="activeJenis === tab.id ? 'text-primary-700 font-bold' : ''"
        >
          {{ getCountForTab(tab.id) }}
        </UBadge>
        <USkeleton v-else-if="isLoading" class="h-4 w-6 rounded-full" />
      </button>
    </div>

    <!-- Search Input -->
    <div class="w-full md:w-72">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        placeholder="Cari nomor perkara / pihak..."
        size="sm"
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
</template>

<script setup>
const { selectedYear, activeJenis, searchQuery, refreshSignal, registerTabs, setJenis } = useRegister()

const { data, pending, refresh } = useLazyFetch('/api/register/summary', {
  server: false,
  query: computed(() => ({
    year: selectedYear.value
  })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

function getCountForTab(tabId) {
  if (!data.value?.summary) return undefined
  if (tabId === 'gugatan') return data.value.summary.totalGugatan
  if (tabId === 'permohonan') return data.value.summary.totalPermohonan
  if (tabId === 'prodeo') return data.value.summary.totalProdeo
  return undefined
}

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})
</script>
