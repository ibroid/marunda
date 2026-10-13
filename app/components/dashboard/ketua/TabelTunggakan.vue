<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 text-rose-500" />
            Daftar Perkara Belum Putus Usia &gt; 3 Bulan (Perlu Atensi Majelis)
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">Menampilkan perkara dengan masa penanganan terlama</p>
        </div>
        <span v-if="!isLoading" class="text-xs text-gray-500">{{ data?.daftar?.length || 0 }} Perkara</span>
        <USkeleton v-else class="h-4 w-20" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Nomor Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Jenis Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Tgl Pendaftaran</th>
            <th class="py-2.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">Usia Perkara</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Majelis Hakim</th>
            <th class="py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-300">Proses Terakhir</th>
            <th class="py-2.5 px-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-28">Aksi</th>
          </tr>
        </thead>
        <!-- Skeleton Rows -->
        <tbody v-if="isLoading" class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="i in 5" :key="i">
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-32" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-24" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-20" />
            </td>
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-5 w-16 mx-auto rounded-full" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-32" />
            </td>
            <td class="py-2.5 px-3">
              <USkeleton class="h-4 w-28" />
            </td>
            <td class="py-2.5 px-3 text-center">
              <USkeleton class="h-6 w-16 mx-auto rounded" />
            </td>
          </tr>
        </tbody>
        <!-- Real Rows -->
        <tbody v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="p in data?.daftar" :key="p.perkara_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="py-2.5 px-3 font-medium text-primary-600 dark:text-primary-400">{{ p.nomor_perkara }}</td>
            <td class="py-2.5 px-3">{{ p.jenis_perkara_nama }}</td>
            <td class="py-2.5 px-3">{{ formatDate(p.tanggal_pendaftaran) }}</td>
            <td class="py-2.5 px-3 text-center">
              <UBadge
                :color="p.usia_hari > 180 ? 'red' : p.usia_hari > 150 ? 'orange' : 'amber'"
                variant="subtle"
                size="xs"
              >
                {{ p.usia_hari }} Hari
              </UBadge>
            </td>
            <td class="py-2.5 px-3 font-medium text-gray-700 dark:text-gray-300">{{ p.majelis_hakim_nama || '-' }}</td>
            <td class="py-2.5 px-3 text-gray-500">{{ p.proses_terakhir_text || '-' }}</td>
            <td class="py-2.5 px-3 text-center">
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-top-right-on-square"
                :loading="loadingPerkaraId === p.perkara_id"
                title="Buka detail perkara di SIPP"
                @click="openSipp(p.perkara_id)"
              >
                Buka SIPP
              </UButton>
            </td>
          </tr>
          <tr v-if="!data?.daftar?.length">
            <td colspan="7" class="py-6 text-center text-gray-400 text-xs">
              Tidak ada perkara belum putus usia &gt; 3 bulan. Kinerja penanganan perkara berjalan sangat baik!
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup>
const toast = useToast()
const loadingPerkaraId = ref(null)
const { selectedYear, refreshSignal } = useDashboardKetua()

const { data, pending, refresh } = useLazyFetch('/api/dashboard/ketua/tunggakan', {
  server: false,
  query: computed(() => ({ year: selectedYear.value })),
  watch: [selectedYear],
  default: () => null
})

const isLoading = computed(() => pending.value || !data.value)

watch(selectedYear, () => {
  data.value = null
})

watch(refreshSignal, () => {
  refresh()
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function openSipp(perkaraId) {
  if (!perkaraId) {
    toast.add({
      title: 'Perhatian',
      description: 'ID Perkara tidak ditemukan.',
      color: 'amber'
    })
    return
  }

  const width = Math.min(1280, Math.floor(window.screen.availWidth * 0.9))
  const height = Math.min(850, Math.floor(window.screen.availHeight * 0.9))
  const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2))
  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=yes`
  const windowName = `sipp_perkara_${perkaraId}`

  const newWindow = window.open('about:blank', windowName, windowFeatures)
  loadingPerkaraId.value = perkaraId

  try {
    const res = await $fetch('/api/sipp/encrypt', {
      method: 'POST',
      body: {
        perkara_id: perkaraId
      }
    })

    if (res?.url) {
      if (newWindow) {
        newWindow.location.href = res.url
        newWindow.focus()
      } else {
        window.open(res.url, windowName, windowFeatures)
      }
    } else {
      if (newWindow) newWindow.close()
      throw new Error(res?.message || 'Gagal mendapatkan URL SIPP dari hasil enkripsi.')
    }
  } catch (err) {
    if (newWindow) newWindow.close()
    const errorMsg =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      'Gagal terhubung ke service enkripsi SIPP.'

    toast.add({
      title: 'Gagal Membuka SIPP',
      description: errorMsg,
      color: 'red'
    })
  } finally {
    loadingPerkaraId.value = null
  }
}
</script>
