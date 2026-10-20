<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-200/80 dark:border-gray-700/80 shadow-sm overflow-x-auto">
    <div class="flex items-center gap-1.5 min-w-max">
      <NuxtLink
        v-for="item in menus"
        :key="item.slug"
        :to="`/keuangan-harian/${item.slug}`"
        class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
        :class="[
          activeSlug === item.slug
            ? 'bg-emerald-600 text-white font-semibold shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
        ]"
      >
        <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
        <span class="whitespace-nowrap">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeSlug: {
    type: String,
    required: true
  }
})

const { menus } = useKeuanganHarian()
</script>
