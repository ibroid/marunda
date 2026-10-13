<template>
  <div class="max-w-3xl mx-auto py-6 sm:py-10 px-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-900/60 shadow-xl overflow-hidden">
      <!-- Header Banner Merah -->
      <div class="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <UIcon name="i-heroicons-server-stack" class="w-7 h-7 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-red-700 shadow-sm uppercase tracking-wider">
                <span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                Database Offline
              </span>
              <span class="text-xs text-red-100 font-medium hidden sm:inline">Koneksi SIPP Terputus</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              Tidak Dapat Terhubung ke Database SIPP
            </h2>
          </div>
        </div>
      </div>

      <!-- Body Konten -->
      <div class="p-6 sm:p-8 space-y-6">
        <!-- Deskripsi Utama -->
        <div class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div class="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            <p class="font-semibold text-red-900 dark:text-red-200">
              Aplikasi tidak dapat berkomunikasi dengan server database MySQL.
            </p>
            <p class="mt-1 text-xs sm:text-sm">
              {{ dbErrorMessage || 'Server database sedang offline atau port tidak dapat dijangkau. Seluruh data perkara dan laporan tidak dapat ditampilkan sampai database dihidupkan kembali.' }}
            </p>
          </div>
        </div>

        <!-- Detail Konfigurasi & Server -->
        <div class="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Detail Target Database
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span class="text-gray-400 block mb-0.5">Host Server</span>
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ dbStatus?.config?.host || 'localhost' }}
              </span>
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span class="text-gray-400 block mb-0.5">Port MySQL</span>
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ dbStatus?.config?.port || '3306' }}
              </span>
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span class="text-gray-400 block mb-0.5">Nama Database</span>
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {{ dbStatus?.config?.database || 'sipppaju' }}
              </span>
            </div>
          </div>

          <div v-if="dbStatus?.details" class="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-950 p-2.5 rounded text-gray-600 dark:text-gray-400 overflow-x-auto">
            Status: {{ dbStatus.details }}
          </div>
        </div>

        <!-- Petunjuk Pemecahan Masalah -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <UIcon name="i-heroicons-wrench-screwdriver" class="w-4 h-4 text-primary-500" />
            Langkah Perbaikan (Troubleshooting):
          </h4>
          <ol class="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 list-decimal list-inside pl-1">
            <li>
              <strong class="text-gray-900 dark:text-white">Aktifkan Layanan MySQL:</strong>
              Pastikan service MySQL / MariaDB (misalnya di <em>XAMPP Control Panel</em>, <em>Laragon</em>, atau <em>services.msc</em>) berstatus <strong>RUNNING</strong>.
            </li>
            <li>
              <strong class="text-gray-900 dark:text-white">Periksa Jaringan &amp; Port:</strong>
              Pastikan port <code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">3306</code> terbuka dan tidak diblokir oleh Firewall atau antivirus.
            </li>
            <li>
              <strong class="text-gray-900 dark:text-white">Periksa Konfigurasi .env:</strong>
              Pastikan parameter <code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">DATABASE_URL</code> pada file <code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">app/.env</code> sudah sesuai dengan konfigurasi database SIPP lokal/server Anda.
            </li>
          </ol>
        </div>

        <!-- Tombol Aksi -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            <UButton
              color="primary"
              size="md"
              icon="i-heroicons-arrow-path"
              :loading="isCheckingDb"
              class="w-full sm:w-auto justify-center"
              @click="handleRetry"
            >
              Coba Hubungkan Kembali
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="md"
              icon="i-heroicons-eye-slash"
              class="w-full sm:w-auto justify-center"
              @click="bypassOfflineWarning"
            >
              Lihat Tampilan (Mode Terbatas)
            </UButton>
          </div>
          <span class="text-[11px] text-gray-400 text-center sm:text-right">
            Sistem otomatis mengecek berkala
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const {
  isCheckingDb,
  dbStatus,
  dbErrorMessage,
  retryConnection,
  bypassOfflineWarning
} = useDatabaseStatus()

const handleRetry = async () => {
  await retryConnection()
}
</script>
