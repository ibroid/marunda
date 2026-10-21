import { defineEventHandler } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const [totalRes, peroranganRes, badanHukumRes, pemerintahRes, denganNikRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM pihak`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM pihak WHERE jenis_pihak_id = 1`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM pihak WHERE jenis_pihak_id = 3`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM pihak WHERE jenis_pihak_id IN (2, 4)`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM pihak WHERE nomor_indentitas IS NOT NULL AND nomor_indentitas != ''`)
    ])

    const total = Number(totalRes[0]?.total || 0)
    const perorangan = Number(peroranganRes[0]?.total || 0)
    const badanHukum = Number(badanHukumRes[0]?.total || 0)
    const pemerintah = Number(pemerintahRes[0]?.total || 0)
    const denganNik = Number(denganNikRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      data: {
        total,
        perorangan,
        badanHukum,
        pemerintah,
        denganNik
      }
    })
  } catch (error: any) {
    console.error('Error fetching principal summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan data pihak',
      data: {
        total: 0,
        perorangan: 0,
        badanHukum: 0,
        pemerintah: 0,
        denganNik: 0
      }
    }
  }
})
