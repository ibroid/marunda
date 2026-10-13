import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const perkaraId = body?.perkara_id

  if (!perkaraId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'perkara_id wajib disertakan'
    })
  }

  const config = useRuntimeConfig()
  const rawUrl =
    process.env.NUXT_ENCRYPT_API_URL ||
    process.env.ENCRYPT_API_URL ||
    (config.encryptApiUrl && !config.encryptApiUrl.includes('localhost:8080') ? config.encryptApiUrl : null) ||
    'http://192.168.0.141:8080'
  const encryptApiUrl = rawUrl.replace(/\/+$/, '')
  const encryptApiKey = process.env.ENCRYPT_API_KEY || config.encryptApiKey || ''
  const sippBaseUrl = (process.env.SIPP_BASE_URL || config.public?.sippBaseUrl || 'http://192.168.0.222/SIPP').replace(/\/+$/, '')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (encryptApiKey) {
    headers['X-API-Key'] = encryptApiKey
  }

  try {
    // Request ke endpoint enkripsi dibungkus base64: POST /encrypt/base64
    const response = await $fetch<any>(`${encryptApiUrl}/encrypt/base64`, {
      method: 'POST',
      headers,
      body: {
        data: String(perkaraId)
      }
    })

    if (!response || !response.result) {
      throw new Error(response?.message || 'Gagal mendapatkan hasil enkripsi (respons kosong)')
    }

    const encryptedId = response.result
    const targetUrl = `${sippBaseUrl}/perkara_detil_agama/${encryptedId}`

    return {
      success: true,
      result: encryptedId,
      url: targetUrl
    }
  } catch (error: any) {
    const errorMsg =
      error?.data?.message ||
      error?.message ||
      `Gagal terhubung ke service enkripsi di ${encryptApiUrl}`

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: errorMsg,
      data: {
        message: errorMsg
      }
    })
  }
})
