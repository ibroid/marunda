<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isLoading"
          class="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/60 dark:bg-black/75 backdrop-blur-sm select-none p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Memuat Halaman"
          @click.self="stopLoading"
        >
          <!-- Modal Card Container -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700/80 max-w-sm w-full flex flex-col items-center text-center transform transition-all relative"
          >
            <!-- Tombol Tutup Manual jika pengguna ingin membatalkan/menutup -->
            <button
              type="button"
              class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              title="Tutup overlay"
              @click="stopLoading"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>

            <!-- Animated Spinner & Badge -->
            <div class="relative w-20 h-20 flex items-center justify-center mb-4">
              <!-- Glow pulse effect -->
              <div class="absolute inset-0 rounded-full bg-primary-500/20 dark:bg-primary-500/30 animate-ping opacity-75"></div>

              <!-- Outer ring border -->
              <div class="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>

              <!-- Spinning primary arc -->
              <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 border-r-primary-600 dark:border-r-primary-400 animate-spin"></div>

              <!-- Center judicial emblem -->
              <div class="w-11 h-11 rounded-full bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center shadow-inner z-10">
                <span class="text-2xl select-none">⚖️</span>
              </div>
            </div>

            <!-- Title: Mohon Tunggu -->
            <h3 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              Mohon Tunggu
            </h3>

            <!-- Subtitle -->
            <p class="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              {{ targetTitle ? `Sedang memuat ${targetTitle}...` : 'Sedang memuat data halaman...' }}
            </p>

            <!-- Animated Indeterminate Progress Bar -->
            <div class="w-full bg-gray-100 dark:bg-gray-700/80 h-1.5 rounded-full overflow-hidden mt-5 relative">
              <div class="progress-bar-slider bg-primary-600 dark:bg-primary-500 h-full rounded-full"></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
const { isLoading, targetTitle, stopLoading } = usePageLoading()
</script>

<style scoped>
.progress-bar-slider {
  position: absolute;
  width: 45%;
  animation: moveProgressBar 1.4s ease-in-out infinite;
}

@keyframes moveProgressBar {
  0% {
    left: -45%;
  }
  100% {
    left: 100%;
  }
}
</style>
