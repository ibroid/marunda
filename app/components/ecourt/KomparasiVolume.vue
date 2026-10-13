<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Komparasi Pendaftaran: e-Court vs Konvensional</h3>
    </template>

    <!-- Skeleton Loading -->
    <template v-if="!sharedAdopsi">
      <div class="space-y-3">
        <div class="flex justify-between">
          <USkeleton class="h-3.5 w-36" />
          <USkeleton class="h-3.5 w-36" />
        </div>
        <USkeleton class="w-full h-4 rounded-full" />
      </div>
    </template>

    <!-- Real Content -->
    <template v-else>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-xs font-medium mb-1.5">
            <span class="text-primary-700 dark:text-primary-300">
              e-Court: {{ sharedAdopsi?.jumlahEcourtTahunIni || 0 }} Perkara
            </span>
            <span class="text-gray-500">
              Konvensional: {{ sharedAdopsi?.jumlahKonvensionalTahunIni || 0 }} Perkara
            </span>
          </div>
          <div class="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div
              class="bg-primary-600 h-full transition-all"
              :style="{ width: `${sharedAdopsi?.persenTahunIni || 0}%` }"
            ></div>
            <div
              class="bg-gray-400 dark:bg-gray-500 h-full transition-all"
              :style="{ width: `${100 - (sharedAdopsi?.persenTahunIni || 0)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const { sharedAdopsi } = useEcourt()
</script>
