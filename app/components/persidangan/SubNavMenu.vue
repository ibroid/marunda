<template>
  <div class="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs overflow-x-auto text-xs">
    <NuxtLink
      v-for="item in navList"
      :key="item.to"
      :to="item.to"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition shrink-0"
      :class="[
        $route.path === item.to
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-semibold ring-1 ring-primary-500/20'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
      ]"
    >
      <UIcon :name="item.icon" class="w-4 h-4 shrink-0" :class="item.iconColor" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </div>
</template>

<script setup>
const navList = [
  {
    label: 'Ikhtisar Semua',
    to: '/persidangan',
    icon: 'i-heroicons-squares-2x2',
    iconColor: 'text-gray-500'
  },
  {
    label: 'Ruang Sidang Belum di-Isi',
    to: '/persidangan/ruang-sidang',
    icon: 'i-heroicons-building-office',
    iconColor: 'text-rose-500'
  },
  {
    label: 'Penundaan Belum di-Isi',
    to: '/persidangan/penundaan',
    icon: 'i-heroicons-exclamation-triangle',
    iconColor: 'text-amber-500'
  },
  {
    label: 'Ditegur / Ditentukan Kmdn',
    to: '/persidangan/ditegur',
    icon: 'i-heroicons-user-group',
    iconColor: 'text-purple-500'
  },
  {
    label: 'Jadwal Sidang',
    to: '/persidangan/jadwal',
    icon: 'i-heroicons-calendar-days',
    iconColor: 'text-primary-500'
  },
  {
    label: 'Sidkel Belum Ditentukan',
    to: '/persidangan/sidang-keliling',
    icon: 'i-heroicons-map-pin',
    iconColor: 'text-cyan-500'
  }
]
</script>
