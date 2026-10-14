import { PrismaClient } from '@prisma/client'

// Singleton PrismaClient instance
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()
globalForPrisma.prisma = prisma

// Helper untuk serialize BigInt ke string/number agar JSON response tidak error
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )
}

export interface DbConfig {
  host: string
  port: number
  database: string
  user: string
}

export interface DbConnectionStatus {
  connected: boolean
  isOffline: boolean
  message: string
  details?: string
  config: {
    host: string
    port: number
    database: string
  }
  timestamp: string
}

// Helper untuk membaca info koneksi dari DATABASE_URL
export function parseDbConfig(): DbConfig {
  try {
    const rawUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/sipppaju'
    const parsed = new URL(rawUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 3306,
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'sipp',
      user: parsed.username || 'root'
    }
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      database: 'sipp',
      user: 'root'
    }
  }
}

// Cek koneksi database secara menyeluruh via Prisma query dengan timeout
export async function checkDatabaseConnection(timeoutMs = 3000): Promise<DbConnectionStatus> {
  const config = parseDbConfig()
  const now = new Date().toISOString()

  try {
    let timer: NodeJS.Timeout
    const queryPromise = prisma.$queryRawUnsafe('SELECT 1')
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
    })

    await Promise.race([queryPromise, timeoutPromise])
    clearTimeout(timer!)

    return {
      connected: true,
      isOffline: false,
      message: 'Database SIPP Terhubung',
      config: {
        host: config.host,
        port: config.port,
        database: config.database
      },
      timestamp: now
    }
  } catch (error: any) {
    const isOffline = isDatabaseOfflineError(error)
    return {
      connected: false,
      isOffline,
      message: isOffline
        ? `Server database SIPP (${config.host}:${config.port}) tidak merespons atau sedang offline.`
        : (error.message || 'Gagal mengeksekusi query database'),
      details: error.code || error.message,
      config: {
        host: config.host,
        port: config.port,
        database: config.database
      },
      timestamp: now
    }
  }
}

// Helper untuk mendeteksi apakah error berasal dari database offline
export function isDatabaseOfflineError(error: any): boolean {
  if (!error) return false
  const msg = String(error.message || '')
  const name = String(error.name || '')
  const code = String(error.code || '')

  return (
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientRustPanicError' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'P1017' ||
    msg.includes("Can't reach database server") ||
    msg.includes('Connection refused') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND')
  )
}

// Helper untuk membuat response error terstandar
export function createDbErrorResponse(error: any, defaultMessage = 'Gagal memuat data dari database') {
  const isOffline = isDatabaseOfflineError(error)
  const config = parseDbConfig()

  return {
    success: false,
    isDbOffline: isOffline,
    message: isOffline
      ? `Tidak dapat terhubung ke server database SIPP (${config.host}:${config.port}). Pastikan server database sedang aktif.`
      : (error?.message || defaultMessage),
    error: error?.message || null
  }
}
