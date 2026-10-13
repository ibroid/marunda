<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-3 px-4 border border-gray-200 dark:border-gray-700/80 shadow-2xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Title & Label -->
      <div class="flex items-center gap-2.5">
        <UIcon name="i-heroicons-funnel" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">
          Filter Periode:
        </span>
        <UBadge
          v-if="isFilterApplied"
          color="emerald"
          variant="subtle"
          size="xs"
          class="font-medium"
        >
          {{ formatMonthYear(selectedMonth, selectedYear) }}
        </UBadge>
        <span v-else class="text-[11px] text-gray-400">
          Pilih bulan &amp; tahun untuk memuat data
        </span>
      </div>

      <!-- Controls -->
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="handleSubmit">
        <div class="hidden lg:flex items-center gap-1 mr-1">
          <UButton
            size="2xs"
            color="gray"
            variant="ghost"
            class="text-[11px]"
            @click="setShortcutThisMonth"
          >
            Bulan Ini
          </UButton>
          <UButton
            size="2xs"
            color="gray"
            variant="ghost"
            class="text-[11px]"
            @click="setShortcutLastMonth"
          >
            Bulan Lalu
          </UButton>
          <UButton
            size="2xs"
            color="gray"
            variant="soft"
            class="text-[11px]"
            icon="i-heroicons-calendar"
            @click="setShortcutFullYear"
          >
            1 Tahun Penuh
          </UButton>
        </div>

        <div class="w-44 sm:w-48">
          <USelect
            v-model="tempMonth"
            :options="monthOptions"
            option-attribute="label"
            value-attribute="value"
            size="xs"
          />
        </div>

        <div class="w-24 sm:w-26">
          <USelect
            v-model="tempYear"
            :options="yearOptions"
            option-attribute="label"
            value-attribute="value"
            size="xs"
          />
        </div>

        <UButton
          type="submit"
          color="primary"
          variant="solid"
          size="xs"
          icon="i-heroicons-magnifying-glass"
          class="font-medium shrink-0"
        >
          Tampilkan
        </UButton>

        <UTooltip v-if="isFilterApplied" text="Reset Filter">
          <UButton
            color="gray"
            variant="ghost"
            size="xs"
            icon="i-heroicons-arrow-uturn-left"
            @click="resetFilter"
          />
        </UTooltip>
      </form>
    </div>
  </div>
</template>

<script setup>
const {
  selectedMonth,
  selectedYear,
  tempMonth,
  tempYear,
  isFilterApplied,
  monthOptions,
  yearOptions,
  applyFilter,
  resetFilter,
  formatMonthYear
} = useKontrolBerkasPenetapan()

function handleSubmit() {
  applyFilter(Number(tempMonth.value), Number(tempYear.value))
}

function setShortcutThisMonth() {
  const now = new Date()
  tempMonth.value = now.getMonth() + 1
  tempYear.value = now.getFullYear()
  applyFilter(tempMonth.value, tempYear.value)
}

function setShortcutLastMonth() {
  const now = new Date()
  let m = now.getMonth()
  let y = now.getFullYear()
  if (m === 0) {
    m = 12
    y -= 1
  }
  tempMonth.value = m
  tempYear.value = y
  applyFilter(tempMonth.value, tempYear.value)
}

function setShortcutFullYear() {
  tempMonth.value = 0
  applyFilter(0, Number(tempYear.value))
}
</script>
