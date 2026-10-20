<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex relative overflow-x-hidden">
    <!-- Backdrop Overlay untuk Layar Mobile -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-linear"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300 ease-linear"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!isSidebarHidden && isMobile"
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden"
        @click="isSidebarHidden = true"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-all duration-300 ease-in-out fixed lg:sticky top-0 inset-y-0 left-0 z-50 h-screen select-none overflow-hidden"
      :class="[
        isMobile
          ? (isSidebarHidden ? '-translate-x-full w-64' : 'translate-x-0 w-64 shadow-2xl')
          : (isSidebarHidden
              ? 'w-0 border-r-0 opacity-0 pointer-events-none'
              : (effectiveCollapsed ? 'w-20 opacity-100' : 'w-64 opacity-100'))
      ]"
    >
      <!-- App Brand -->
      <div
        class="h-16 flex items-center border-b border-gray-200 dark:border-gray-700 transition-all duration-300 shrink-0"
        :class="[effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-4']"
      >
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-9 h-9 shrink-0 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
            ⚖️
          </div>
          <div v-show="!effectiveCollapsed" class="overflow-hidden whitespace-nowrap">
            <h1 class="font-bold text-sm tracking-tight text-gray-900 dark:text-white leading-tight">MONEV SIPP</h1>
            <p class="text-[11px] text-gray-500 dark:text-gray-400">Pengadilan Agama</p>
          </div>
        </div>

        <!-- Tombol Aksi di Header Sidebar saat Extended -->
        <div v-show="!effectiveCollapsed" class="flex items-center gap-1">
          <!-- Tombol Ciutkan (Collapse) di Desktop -->
          <UTooltip text="Ciutkan Sidebar" class="hidden lg:inline-flex">
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              icon="i-heroicons-chevron-double-left"
              class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              @click="isSidebarCollapsed = true"
            />
          </UTooltip>
          <!-- Tombol Sembunyikan / Tutup -->
          <UTooltip :text="isMobile ? 'Tutup Sidebar' : 'Sembunyikan Sidebar'">
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              :icon="isMobile ? 'i-heroicons-x-mark' : 'i-heroicons-eye-slash'"
              class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              @click="isSidebarHidden = true"
            />
          </UTooltip>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav
        class="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden"
        :class="[effectiveCollapsed ? 'px-2' : 'px-3']"
      >
        <!-- Sub Menu Dashboard -->
        <!-- Mode Collapsed (Mini): Gunakan Dropdown Popup -->
        <div v-if="effectiveCollapsed">
          <UDropdown
            :items="dashboardDropdownItems"
            :popper="{ placement: 'right-start' }"
            class="w-full"
          >
            <UTooltip text="Dashboard" :popper="{ placement: 'right' }" class="w-full">
              <button
                type="button"
                class="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors"
                :class="[
                  isDashboardRoute
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              </button>
            </UTooltip>
          </UDropdown>
        </div>

        <!-- Mode Extended (Full): Accordion Biasa -->
        <div v-else class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isDashboardRoute
                ? 'bg-primary-50/70 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="isDashboardOpen = !isDashboardOpen"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span class="truncate">Dashboard</span>
            </div>
            <UIcon
              :name="isDashboardOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            />
          </button>

          <!-- Submenu Items -->
          <div v-show="isDashboardOpen" class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-primary-900 ml-4">
            <NuxtLink
              v-for="sub in dashboardSubItems"
              :key="sub.to"
              :to="sub.to"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="[
                $route.path === sub.to
                  ? 'bg-primary-100 text-primary-900 font-semibold dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="sub.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ sub.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="pt-2 pb-1">
          <div class="border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <!-- Sub Menu Kontrol & Audit Perkara -->
        <!-- Mode Collapsed (Mini): Gunakan Dropdown Popup -->
        <div v-if="effectiveCollapsed">
          <UDropdown
            :items="kontrolDropdownItems"
            :popper="{ placement: 'right-start' }"
            class="w-full"
          >
            <UTooltip text="Kontrol & Audit Perkara" :popper="{ placement: 'right' }" class="w-full">
              <button
                type="button"
                class="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors"
                :class="[
                  isKontrolRoute
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              </button>
            </UTooltip>
          </UDropdown>
        </div>

        <!-- Mode Extended (Full): Accordion Biasa -->
        <div v-else class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isKontrolRoute
                ? 'bg-primary-50/70 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="isKontrolOpen = !isKontrolOpen"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span class="truncate">Kontrol & Audit Perkara</span>
            </div>
            <UIcon
              :name="isKontrolOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            />
          </button>

          <!-- Submenu Items -->
          <div v-show="isKontrolOpen" class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-primary-900 ml-4">
            <NuxtLink
              v-for="sub in kontrolSubItems"
              :key="sub.to"
              :to="sub.to"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="[
                $route.path === sub.to
                  ? 'bg-primary-100 text-primary-900 font-semibold dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="sub.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ sub.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="pt-2 pb-1">
          <div class="border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <!-- Sub Menu Monitoring Persidangan (Sesuai Menu Monev SIPP) -->
        <!-- Mode Collapsed (Mini): Gunakan Dropdown Popup -->
        <div v-if="effectiveCollapsed">
          <UDropdown
            :items="persidanganDropdownItems"
            :popper="{ placement: 'right-start' }"
            class="w-full"
          >
            <UTooltip text="Monitoring Persidangan" :popper="{ placement: 'right' }" class="w-full">
              <button
                type="button"
                class="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors"
                :class="[
                  isPersidanganRoute
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                <UIcon name="i-heroicons-scale" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              </button>
            </UTooltip>
          </UDropdown>
        </div>

        <!-- Mode Extended (Full): Accordion Biasa -->
        <div v-else class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isPersidanganRoute
                ? 'bg-primary-50/70 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="isPersidanganOpen = !isPersidanganOpen"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-scale" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span class="truncate">Persidangan</span>
            </div>
            <UIcon
              :name="isPersidanganOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            />
          </button>

          <!-- Submenu Items -->
          <div v-show="isPersidanganOpen" class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-primary-900 ml-4">
            <NuxtLink
              v-for="sub in persidanganSubItems"
              :key="sub.to"
              :to="sub.to"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="[
                $route.path === sub.to
                  ? 'bg-primary-100 text-primary-900 font-semibold dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="sub.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ sub.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="pt-2 pb-1">
          <div class="border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <!-- Sub Menu Statistik Geografi -->
        <!-- Mode Collapsed (Mini): Gunakan Dropdown Popup -->
        <div v-if="effectiveCollapsed">
          <UDropdown
            :items="geografiDropdownItems"
            :popper="{ placement: 'right-start' }"
            class="w-full"
          >
            <UTooltip text="Statistik Geografi" :popper="{ placement: 'right' }" class="w-full">
              <button
                type="button"
                class="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors"
                :class="[
                  isGeografiRoute
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                <UIcon name="i-heroicons-map" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              </button>
            </UTooltip>
          </UDropdown>
        </div>

        <!-- Mode Extended (Full): Accordion Biasa -->
        <div v-else class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isGeografiRoute
                ? 'bg-primary-50/70 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="isGeografiOpen = !isGeografiOpen"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-map" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span class="truncate">Statistik Geografi</span>
            </div>
            <UIcon
              :name="isGeografiOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            />
          </button>

          <!-- Submenu Items -->
          <div v-show="isGeografiOpen" class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-primary-900 ml-4">
            <NuxtLink
              v-for="sub in geografiSubItems"
              :key="sub.to"
              :to="sub.to"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="[
                $route.path === sub.to
                  ? 'bg-primary-100 text-primary-900 font-semibold dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="sub.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ sub.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="pt-2 pb-1">
          <div class="border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <!-- Navigation Links Utama (Atas s/d Buku Register Digital) -->
        <UTooltip
          v-for="item in navItemsTop"
          :key="item.to"
          :text="item.label"
          :popper="{ placement: 'right' }"
          :prevent="!effectiveCollapsed"
          class="w-full"
        >
          <NuxtLink
            :to="item.to"
            class="flex items-center rounded-lg text-sm font-medium transition-colors"
            :class="[
              effectiveCollapsed
                ? 'justify-center p-2.5'
                : 'gap-3 px-3 py-2',
              $route.path === item.to
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            <span v-show="!effectiveCollapsed" class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </UTooltip>

        <!-- Sub Menu Keuangan Harian (13 Submenu) -->
        <!-- Mode Collapsed (Mini): Gunakan Dropdown Popup -->
        <div v-if="effectiveCollapsed">
          <UDropdown
            :items="keuanganDropdownItems"
            :popper="{ placement: 'right-start' }"
            class="w-full"
          >
            <UTooltip text="Keuangan Harian" :popper="{ placement: 'right' }" class="w-full">
              <button
                type="button"
                class="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors"
                :class="[
                  isKeuanganRoute
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              </button>
            </UTooltip>
          </UDropdown>
        </div>

        <!-- Mode Extended (Full): Accordion Biasa -->
        <div v-else class="space-y-1">
          <button
            type="button"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isKeuanganRoute
                ? 'bg-primary-50/70 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="isKeuanganOpen = !isKeuanganOpen"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span class="truncate">Keuangan Harian</span>
            </div>
            <UIcon
              :name="isKeuanganOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            />
          </button>

          <!-- Submenu Items (13 Menu Keuangan Harian) -->
          <div v-show="isKeuanganOpen" class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-primary-900 ml-4 max-h-72 overflow-y-auto">
            <NuxtLink
              v-for="sub in keuanganSubItems"
              :key="sub.to"
              :to="sub.to"
              class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="[
                $route.path === sub.to
                  ? 'bg-primary-100 text-primary-900 font-semibold dark:bg-primary-900 dark:text-primary-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200'
              ]"
            >
              <UIcon :name="sub.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ sub.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Navigation Links Utama (Bawah: Laporan Perkara LIPA) -->
        <UTooltip
          v-for="item in navItemsBottom"
          :key="item.to"
          :text="item.label"
          :popper="{ placement: 'right' }"
          :prevent="!effectiveCollapsed"
          class="w-full"
        >
          <NuxtLink
            :to="item.to"
            class="flex items-center rounded-lg text-sm font-medium transition-colors"
            :class="[
              effectiveCollapsed
                ? 'justify-center p-2.5'
                : 'gap-3 px-3 py-2',
              $route.path === item.to
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            <span v-show="!effectiveCollapsed" class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </UTooltip>
      </nav>

      <!-- Sidebar Footer -->
      <div
        class="border-t border-gray-200 dark:border-gray-700 transition-all duration-300 shrink-0"
        :class="[effectiveCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between']"
      >
        <template v-if="effectiveCollapsed">
          <!-- Tombol Perluas (Extend) saat compact -->
          <UTooltip text="Perluas Sidebar (Extend)" :popper="{ placement: 'right' }">
            <UButton
              color="primary"
              variant="ghost"
              size="sm"
              icon="i-heroicons-chevron-double-right"
              @click="isSidebarCollapsed = false"
            />
          </UTooltip>
          <UColorModeButton />
        </template>

        <template v-else>
          <div class="flex items-center gap-1.5 overflow-hidden">
            <UTooltip text="Ciutkan Sidebar" class="hidden lg:inline-flex">
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-chevron-double-left"
                class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                @click="isSidebarCollapsed = true"
              />
            </UTooltip>
            <span class="truncate text-[11px]">v2.0 (Nuxt 3)</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UTooltip text="Sembunyikan Sidebar" class="hidden lg:inline-flex">
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-eye-slash"
                class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                @click="isSidebarHidden = true"
              />
            </UTooltip>
            <UColorModeButton />
          </div>
        </template>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
      <!-- Top Navbar -->
      <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 shrink-0 transition-all duration-300">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <!-- Tombol Toggle Sembunyikan / Tampilkan Sidebar -->
          <UTooltip :text="isSidebarHidden ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'">
            <UButton
              color="gray"
              variant="ghost"
              :icon="isSidebarHidden ? 'i-heroicons-bars-3' : 'i-heroicons-bars-3-bottom-left'"
              class="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              aria-label="Toggle Sidebar"
              @click="toggleSidebarVisibility"
            />
          </UTooltip>

          <!-- Tombol Toggle Extend / Ciutkan (Desktop saat sidebar tampil) -->
          <UTooltip
            v-if="!isSidebarHidden"
            :text="effectiveCollapsed ? 'Perluas Sidebar (Extend)' : 'Ciutkan Sidebar'"
            class="hidden lg:inline-flex"
          >
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              :icon="effectiveCollapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
              class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Toggle Extend/Collapse Sidebar"
              @click="isSidebarCollapsed = !isSidebarCollapsed"
            />
          </UTooltip>

          <div class="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ currentTitle }}
          </h2>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <USelect
            v-model="selectedYear"
            :options="yearOptions"
            class="w-24 sm:w-28"
            size="sm"
          />

          <!-- Status Koneksi Database Dinamis -->
          <UTooltip :text="isDbConnected ? 'Database SIPP Terhubung Normal' : (isDbConnected === false ? 'Database SIPP Terputus (Klik untuk cek ulang)' : 'Memeriksa status...')">
            <UBadge
              v-if="isCheckingDb"
              color="amber"
              variant="subtle"
              size="sm"
              class="inline-flex items-center"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-500" />
              <span>Cek Database...</span>
            </UBadge>

            <UBadge
              v-else-if="isDbConnected"
              color="green"
              variant="subtle"
              size="sm"
              class="hidden md:inline-flex items-center"
            >
              <span class="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              <span>Database SIPP Terhubung</span>
            </UBadge>

            <UBadge
              v-else-if="isDbConnected === false"
              color="red"
              variant="solid"
              size="sm"
              class="inline-flex items-center cursor-pointer hover:bg-red-600 transition-colors shadow-sm"
              @click="retryConnection"
            >
              <span class="w-2 h-2 rounded-full bg-white mr-1.5 animate-ping"></span>
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 mr-1 text-white" />
              <span>Database Offline</span>
            </UBadge>
          </UTooltip>
        </div>
      </header>

      <!-- Persistent Alert Banner saat Database Offline & User Memilih Masuk Mode Terbatas -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="isDbConnected === false && hasIgnoredWarning"
          class="bg-red-600 text-white px-4 py-2.5 sm:px-6 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm shrink-0"
        >
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-white shrink-0 animate-bounce" />
            <span>
              <strong>Peringatan:</strong> Server Database SIPP sedang <strong>OFFLINE</strong>. Data yang tampil kosong atau bernilai 0.
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              size="2xs"
              color="white"
              variant="solid"
              icon="i-heroicons-arrow-path"
              :loading="isCheckingDb"
              @click="retryConnection"
            >
              Hubungkan Ulang
            </UButton>
            <UButton
              size="2xs"
              color="white"
              variant="outline"
              class="border-white/50 text-white hover:bg-white/10"
              @click="restoreOfflineWarning"
            >
              Lihat Panduan Error
            </UButton>
          </div>
        </div>
      </Transition>

      <!-- Page Body -->
      <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <DatabaseOfflineError v-if="isDbConnected === false && !hasIgnoredWarning" />
        <slot v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const selectedYear = useState('selectedYear', () => new Date().getFullYear())

// Status Koneksi Database SIPP
const {
  isDbConnected,
  isCheckingDb,
  hasIgnoredWarning,
  checkDatabaseStatus,
  retryConnection,
  restoreOfflineWarning
} = useDatabaseStatus()

// Inisialisasi pengecekan koneksi database di awal
await useAsyncData('initial-db-status', () => checkDatabaseStatus())

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: `${currentYear}`, value: currentYear },
  { label: `${currentYear - 1}`, value: currentYear - 1 },
  { label: `${currentYear - 2}`, value: currentYear - 2 },
  { label: `${currentYear - 3}`, value: currentYear - 3 }
]

// State Sidebar
const isSidebarHidden = ref(false)
const isSidebarCollapsed = ref(false)
const isMobile = ref(false)

const effectiveCollapsed = computed(() => {
  return !isMobile.value && isSidebarCollapsed.value
})

const toggleSidebarVisibility = () => {
  isSidebarHidden.value = !isSidebarHidden.value
}

// State untuk toggle accordion sub-menu dashboard
const isDashboardOpen = ref(true)

const isDashboardRoute = computed(() => {
  return route.path === '/' || route.path.startsWith('/dashboard')
})

const dashboardSubItems = [
  { label: 'Dashboard Eksekutif', to: '/', icon: 'i-heroicons-chart-pie' },
  { label: 'Dashboard Ketua', to: '/dashboard/ketua', icon: 'i-heroicons-scale' },
  { label: 'Dashboard Panitera', to: '/dashboard/panitera', icon: 'i-heroicons-clipboard-document-list' }
]

const dashboardDropdownItems = computed(() => [
  [
    {
      label: 'Pilihan Dashboard',
      disabled: true
    }
  ],
  dashboardSubItems.map(sub => ({
    label: sub.label,
    icon: sub.icon,
    to: sub.to
  }))
])

// State untuk toggle accordion sub-menu kontrol & audit perkara
const isKontrolOpen = ref(true)

const isKontrolRoute = computed(() => {
  return route.path.startsWith('/kontrol')
})

const kontrolSubItems = [
  { label: 'Audit Alur Perkara', to: '/kontrol', icon: 'i-heroicons-clipboard-document-list' },
  { label: 'Kontrol Berkas Penetapan', to: '/kontrol/berkas-penetapan', icon: 'i-heroicons-document-check' },
  { label: 'Belum Minutasi', to: '/kontrol/belum-minutasi', icon: 'i-heroicons-clock' },
  { label: 'Perkara Non Kabul', to: '/kontrol/non-kabul', icon: 'i-heroicons-no-symbol' }
]

const kontrolDropdownItems = computed(() => [
  [
    {
      label: 'Kontrol & Audit Perkara',
      disabled: true
    }
  ],
  kontrolSubItems.map(sub => ({
    label: sub.label,
    icon: sub.icon,
    to: sub.to
  }))
])

// State untuk toggle accordion sub-menu persidangan
const isPersidanganOpen = ref(true)

const isPersidanganRoute = computed(() => {
  return route.path.startsWith('/persidangan')
})

const persidanganSubItems = [
  {
    label: 'Ruang Sidang Belum di-Isi',
    to: '/persidangan/ruang-sidang',
    icon: 'i-heroicons-building-office'
  },
  {
    label: 'Penundaan Belum di-Isi',
    to: '/persidangan/penundaan',
    icon: 'i-heroicons-exclamation-triangle'
  },
  {
    label: 'Ditegur / Ditentukan Kmdn',
    to: '/persidangan/ditegur',
    icon: 'i-heroicons-user-group'
  },
  {
    label: 'Jadwal Sidang',
    to: '/persidangan/jadwal',
    icon: 'i-heroicons-calendar-days'
  },
  {
    label: 'Sidkel Belum Ditentukan',
    to: '/persidangan/sidang-keliling',
    icon: 'i-heroicons-map-pin'
  }
]

const persidanganDropdownItems = computed(() => [
  [
    {
      label: 'Monitoring Persidangan',
      disabled: true
    }
  ],
  persidanganSubItems.map(sub => ({
    label: sub.label,
    icon: sub.icon,
    to: sub.to
  }))
])

// State untuk toggle accordion sub-menu statistik geografi
const isGeografiOpen = ref(true)

const isGeografiRoute = computed(() => {
  return route.path.startsWith('/statistik-geografi')
})

const geografiSubItems = [
  {
    label: 'Data Per Wilayah',
    to: '/statistik-geografi/wilayah',
    icon: 'i-heroicons-map-pin'
  },
  {
    label: 'Jenis Perkara',
    to: '/statistik-geografi/jenis-perkara',
    icon: 'i-heroicons-rectangle-stack'
  },
  {
    label: 'Faktor Perceraian',
    to: '/statistik-geografi/faktor-perceraian',
    icon: 'i-heroicons-heart'
  },
  {
    label: 'Pendidikan Perceraian',
    to: '/statistik-geografi/pendidikan-perceraian',
    icon: 'i-heroicons-academic-cap'
  },
  {
    label: 'Pendidikan Dispensasi',
    to: '/statistik-geografi/pendidikan-dispensasi',
    icon: 'i-heroicons-academic-cap'
  },
  {
    label: 'Pekerjaan Perceraian',
    to: '/statistik-geografi/pekerjaan-perceraian',
    icon: 'i-heroicons-briefcase'
  }
]

const geografiDropdownItems = computed(() => [
  [
    {
      label: 'Statistik Geografi',
      disabled: true
    }
  ],
  geografiSubItems.map(sub => ({
    label: sub.label,
    icon: sub.icon,
    to: sub.to
  }))
])

// State untuk toggle accordion sub-menu keuangan harian
const isKeuanganOpen = ref(true)

const isKeuanganRoute = computed(() => {
  return route.path.startsWith('/keuangan-harian')
})

const keuanganSubItems = [
  { label: 'Rekap Transaksi Harian', to: '/keuangan-harian/rekap', icon: 'i-heroicons-document-chart-bar' },
  { label: 'Transaksi Harian', to: '/keuangan-harian/transaksi', icon: 'i-heroicons-arrows-right-left' },
  { label: 'Transaksi Panjar', to: '/keuangan-harian/panjar', icon: 'i-heroicons-arrow-down-tray' },
  { label: 'Transaksi PNBP', to: '/keuangan-harian/pnbp', icon: 'i-heroicons-building-library' },
  { label: 'Transaksi ATK', to: '/keuangan-harian/atk', icon: 'i-heroicons-pencil-square' },
  { label: 'Transaksi Panggilan', to: '/keuangan-harian/panggilan', icon: 'i-heroicons-megaphone' },
  { label: 'Transaksi Pemberitahuan', to: '/keuangan-harian/pemberitahuan', icon: 'i-heroicons-envelope' },
  { label: 'Transaksi Materai', to: '/keuangan-harian/materai', icon: 'i-heroicons-tag' },
  { label: 'Pengembalian Sisa Panjar', to: '/keuangan-harian/sisa-panjar', icon: 'i-heroicons-arrow-uturn-left' },
  { label: 'Transaksi Pengiriman', to: '/keuangan-harian/pengiriman', icon: 'i-heroicons-truck' },
  { label: 'Transaksi Pemeriksaan Setempat', to: '/keuangan-harian/pemeriksaan-setempat', icon: 'i-heroicons-map-pin' },
  { label: 'Transaksi Sita', to: '/keuangan-harian/sita', icon: 'i-heroicons-lock-closed' },
  { label: 'Hak-hak kepaniteraan', to: '/keuangan-harian/hhk', icon: 'i-heroicons-scale' }
]

const keuanganDropdownItems = computed(() => [
  [
    {
      label: 'Keuangan Harian',
      disabled: true
    }
  ],
  keuanganSubItems.map(sub => ({
    label: sub.label,
    icon: sub.icon,
    to: sub.to
  }))
])

const navItemsTop = [
  { label: 'Statistik e-Court', to: '/ecourt', icon: 'i-heroicons-globe-alt' },
  { label: 'Raport & Kinerja SIPP', to: '/kinerja', icon: 'i-heroicons-trophy' },
  { label: 'Porsi Beban Kerja & Majelis', to: '/porsi', icon: 'i-heroicons-users' },
  { label: 'Kepatuhan e-Doc Putusan', to: '/edoc', icon: 'i-heroicons-document-text' },
  { label: 'Akta Cerai & Ikrar Talak', to: '/akta-cerai', icon: 'i-heroicons-document-duplicate' },
  { label: 'Buku Register Digital', to: '/register', icon: 'i-heroicons-book-open' }
]

const navItemsBottom = [
  { label: 'Laporan Perkara (LIPA)', to: '/laporan', icon: 'i-heroicons-table-cells' }
]

const allNavItems = [...navItemsTop, ...navItemsBottom]

const currentTitle = computed(() => {
  if (route.path === '/' || route.path === '/dashboard') return 'Dashboard Eksekutif'
  if (route.path === '/dashboard/ketua') return 'Dashboard Ketua (Pimpinan Yudisial)'
  if (route.path.startsWith('/kinerja/hakim/')) return 'Detail Kinerja Individual Hakim'
  if (route.path === '/kinerja/hakim') return 'Daftar Kinerja Hakim'
  if (route.path.startsWith('/dashboard/panitera/bas/')) return 'Daftar Perkara & Monitoring BAS Panitera Pengganti'
  if (route.path.startsWith('/dashboard/panitera/jsp/')) return 'Daftar Perkara & Kinerja Jurusita'
  if (route.path === '/dashboard/panitera') return 'Dashboard Panitera (Kepaniteraan)'
  if (route.path === '/kontrol/non-kabul' || route.path === '/kontrol/non-kabu') return 'Kontrol Perkara Non Kabul'
  if (route.path === '/kontrol/belum-minutasi') return 'Kontrol Perkara Belum Minutasi'
  if (route.path === '/kontrol/berkas-penetapan') return 'Kontrol Berkas Penetapan'
  if (route.path === '/kontrol') return 'Kontrol & Audit Alur Perkara'
  if (route.path === '/persidangan/ruang-sidang') return 'Ruang Sidang Belum di-Isi'
  if (route.path === '/persidangan/penundaan') return 'Penundaan Sidang Belum di-Isi'
  if (route.path === '/persidangan/ditegur') return 'Perkara Ditegur / Ditentukan Kemudian'
  if (route.path === '/persidangan/jadwal') return 'Jadwal Sidang Pengadilan'
  if (route.path === '/persidangan/sidang-keliling') return 'Jadwal Sidang Keliling Belum Ditentukan'
  if (route.path.startsWith('/persidangan')) return 'Monitoring Persidangan SIPP'
  if (route.path === '/statistik-geografi/faktor-perceraian' || route.path.startsWith('/faktor-perceraian')) return 'Statistik Geografi - Faktor Perceraian'
  if (route.path === '/statistik-geografi/jenis-perkara') return 'Statistik Geografi - Jenis Perkara'
  if (route.path === '/statistik-geografi/wilayah' || route.path.startsWith('/statistik-geografi')) return 'Statistik Geografi - Data Per Wilayah'
  if (route.path.startsWith('/keuangan-harian')) {
    const sub = keuanganSubItems.find(item => item.to === route.path)
    return sub ? `Keuangan Harian - ${sub.label}` : 'Keuangan Harian'
  }
  const match = allNavItems.find(item => item.to === route.path)
  return match ? match.label : 'Monitoring SIPP'
})

const checkMobile = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 1024
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  try {
    const savedHidden = localStorage.getItem('monev_sidebar_hidden')
    if (savedHidden !== null) {
      isSidebarHidden.value = savedHidden === 'true'
    } else if (isMobile.value) {
      // Default tersembunyi di mobile
      isSidebarHidden.value = true
    }

    const savedCollapsed = localStorage.getItem('monev_sidebar_collapsed')
    if (savedCollapsed !== null) {
      isSidebarCollapsed.value = savedCollapsed === 'true'
    }
  } catch (e) {
    console.warn('Gagal membaca preferensi sidebar', e)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkMobile)
  }
})

watch(isSidebarHidden, (val) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('monev_sidebar_hidden', String(val))
    } catch {}
  }
})

watch(isSidebarCollapsed, (val) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('monev_sidebar_collapsed', String(val))
    } catch {}
  }
})

// Di mobile, jika navigasi rute berpindah, otomatis tutup sidebar
watch(() => route.path, () => {
  if (isMobile.value) {
    isSidebarHidden.value = true
  }
})
</script>
