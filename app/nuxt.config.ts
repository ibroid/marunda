// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },
  experimental: {
    appManifest: false
  },
  vite: {
    server: {
      watch: {
        ignored: [
          '**/aps2018/**',
          '**/estat/**',
          '**/.git/**',
          '**/node_modules/**',
          '**/.nuxt/**'
        ]
      }
    },
    // @ts-expect-error viteNode retry config for Windows IPC named pipe
    viteNode: {
      maxRetryAttempts: 5,
      baseRetryDelay: 300,
      maxRetryDelay: 1500,
      requestTimeout: 60000
    }
  },
  modules: [
    '@nuxt/ui'
  ],
  ui: {
    global: true,
    icons: ['heroicons', 'lucide']
  },
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },
  runtimeConfig: {
    encryptApiUrl: process.env.ENCRYPT_API_URL || 'http://192.168.0.141:8080',
    encryptApiKey: process.env.ENCRYPT_API_KEY || '',
    public: {
      sippBaseUrl: process.env.SIPP_BASE_URL || 'http://192.168.0.222/SIPP'
    }
  },
  app: {
    head: {
      title: 'Monitoring Terpadu SIPP',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistem Terpadu Monitoring dan Evaluasi Kinerja Perkara Pengadilan Agama' }
      ]
    }
  }
})
