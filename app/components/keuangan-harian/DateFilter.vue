<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <!-- Pilihan Tanggal -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap flex items-center gap-1.5">
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Tanggal Transaksi:
        </span>
        <UInput
          v-model="selectedDate"
          type="date"
          size="sm"
          class="w-44"
          placeholder="Pilih Tanggal..."
        />
      </div>

      <!-- Shortcut Presets -->
      <div class="flex items-center gap-1.5">
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          @click="setPresetToday"
        >
          Hari Ini
        </UButton>
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          @click="setPresetYesterday"
        >
          Kemarin
        </UButton>
        <UButton
          v-if="selectedDate"
          size="xs"
          color="red"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="resetDate"
        >
          Reset
        </UButton>
      </div>

      <!-- Slot Tambahan untuk Filter Khusus (misal: Filter Kode PNBP) -->
      <slot name="extra-filter" />
    </div>

    <!-- Tombol Cetak & Ekspor Excel -->
    <div class="flex items-center gap-2 self-end md:self-auto">
      <UButton
        size="sm"
        color="gray"
        variant="outline"
        icon="i-heroicons-printer"
        :disabled="!selectedDate || !hasData"
        @click="printWindow"
      >
        Cetak
      </UButton>
      <UButton
        size="sm"
        color="emerald"
        variant="solid"
        icon="i-heroicons-document-arrow-down"
        :disabled="!selectedDate || !hasData"
        @click="$emit('export')"
      >
        Export Excel
      </UButton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hasData: {
    type: Boolean,
    default: false
  }
})

defineEmits(['export'])

const {
  selectedDate,
  setPresetToday,
  setPresetYesterday,
  resetDate,
  printWindow
} = useKeuanganHarian()
</script>
