<template>
  <div class="border-b border-gray-200 dark:border-gray-800">
    <nav class="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Tabs">
      <button
        type="button"
        class="group inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap"
        :class="[
          activeMainTab === 'katalog'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
        ]"
        @click="activeMainTab = 'katalog'"
      >
        <UIcon
          name="i-heroicons-document-chart-bar"
          class="w-4 h-4 mr-2"
          :class="activeMainTab === 'katalog' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'"
        />
        <span>Katalog Laporan LIPA & RK</span>
        <UBadge
          size="xs"
          variant="subtle"
          color="primary"
          class="ml-2 font-mono"
        >
          {{ lipaCatalog.length }}
        </UBadge>
      </button>

      <button
        type="button"
        class="group inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap"
        :class="[
          activeMainTab === 'input_manual'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
        ]"
        @click="activeMainTab = 'input_manual'"
      >
        <UIcon
          name="i-heroicons-pencil-square"
          class="w-4 h-4 mr-2"
          :class="activeMainTab === 'input_manual' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'"
        />
        <span>Input Laporan Manual DIPA</span>
        <UBadge
          size="xs"
          variant="subtle"
          color="amber"
          class="ml-2"
        >
          DIPA 04
        </UBadge>
      </button>

      <button
        type="button"
        class="group inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap"
        :class="[
          activeMainTab === 'monitoring'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
        ]"
        @click="activeMainTab = 'monitoring'"
      >
        <UIcon
          name="i-heroicons-check-badge"
          class="w-4 h-4 mr-2"
          :class="activeMainTab === 'monitoring' ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'"
        />
        <span>Monitoring Pelaporan Online</span>
        <UBadge
          size="xs"
          variant="subtle"
          color="emerald"
          class="ml-2"
        >
          Checklist
        </UBadge>
      </button>
    </nav>
  </div>
</template>

<script setup>
const { activeMainTab, lipaCatalog } = useLaporan()
</script>
