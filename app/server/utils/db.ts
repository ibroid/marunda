import { PrismaClient } from '@prisma/client'
import net from 'net'

// Singleton PrismaClient instance
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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

// Cek TCP port cepat (5-10ms) untuk mendeteksi apakah server DB sedang aktif
function checkTcpPort(host: string, port: number, timeoutMs = 1200): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      socket.destroy()
      resolve({ ok: true })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, error: 'Connection timeout' })
    })

    socket.on('error', (err: any) => {
      socket.destroy()
      resolve({ ok: false, error: err.code || err.message })
    })

    socket.connect(port, host)
  })
}

// Cek koneksi database secara menyeluruh (TCP + Prisma query)
export async function checkDatabaseConnection(timeoutMs = 1500): Promise<DbConnectionStatus> {
  const config = parseDbConfig()
  const now = new Date().toISOString()

  // 1. Uji koneksi socket TCP terlebih dahulu (cepat & tidak memblokir event loop)
  const tcpResult = await checkTcpPort(config.host, config.port, timeoutMs)
  if (!tcpResult.ok) {
    return {
      connected: false,
      isOffline: true,
      message: `Tidak dapat terhubung ke server database SIPP (${config.host}:${config.port}). Server database sedang offline atau port tidak dapat dijangkau.`,
      details: tcpResult.error || 'Connection refused',
      config: {
        host: config.host,
        port: config.port,
        database: config.database
      },
      timestamp: now
    }
  }

  // 2. Uji query Prisma untuk memastikan database dan kredensial valid
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
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
