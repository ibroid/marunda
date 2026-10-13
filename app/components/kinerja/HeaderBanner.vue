<template>
  <div class="bg-gradient-to-r from-emerald-800 to-primary-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2">
        <UBadge color="white" variant="solid" size="xs" class="text-primary-950 font-bold uppercase tracking-wider">
          Standar Badilag &amp; MA-RI
        </UBadge>
        <span class="text-xs text-primary-200">Formula Evaluasi Terpadu</span>
      </div>
      <h2 class="text-xl font-bold tracking-tight mt-1">Raport &amp; Penilaian Kinerja SIPP</h2>
      <p class="text-sm text-primary-200 mt-0.5">
        Evaluasi performa penanganan, minutasi, dan publikasi perkara SIPP — Tahun {{ selectedYear }}
      </p>
    </div>

    <div class="flex items-center flex-wrap gap-2.5">
      <USelect
        v-model="selectedYear"
        :options="yearOptions"
        option-attribute="label"
        value-attribute="value"
        size="sm"
        class="w-36 text-gray-900"
      />

      <UButton
        to="/kinerja/hakim"
        icon="i-heroicons-user-group"
        color="white"
        variant="outline"
        size="sm"
        class="text-white border-white/40 hover:bg-white/10"
      >
        Kinerja Hakim
      </UButton>

      <UButton
        icon="i-heroicons-arrow-path"
        color="white"
        variant="solid"
        size="sm"
        :loading="isRefreshing"
        @click="handleRefresh"
      >
        Perbarui Data
      </UButton>
    </div>
  </div>
</template>

<script setup>
const { selectedYear, yearOptions, triggerRefresh } = useKinerja()
const isRefreshing = ref(false)

function handleRefresh() {
  isRefreshing.value = true
  triggerRefresh()
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}
</script>
