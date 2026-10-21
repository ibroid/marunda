import { defineEventHandler } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const [cTotal, cKuasa, cAktif, cNia] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) AS total FROM pihak_pengacara'),
      prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) AS total_kuasa FROM perkara_pengacara'),
      prisma.$queryRawUnsafe<any[]>('SELECT COUNT(DISTINCT pengacara_id) AS advokat_aktif FROM perkara_pengacara'),
      prisma.$queryRawUnsafe<any[]>("SELECT COUNT(*) AS dengan_nia FROM pihak_pengacara WHERE nomor_induk IS NOT NULL AND nomor_induk != ''")
    ])

    const total = Number(cTotal[0]?.total || 0)
    const totalKuasa = Number(cKuasa[0]?.total_kuasa || 0)
    const advokatAktif = Number(cAktif[0]?.advokat_aktif || 0)
    const denganNia = Number(cNia[0]?.dengan_nia || 0)

    return serializeBigInt({
      success: true,
      data: {
        total,
        totalKuasa,
        advokatAktif,
        denganNia
      }
    })
  } catch (error: any) {
    console.error('Error fetching advokat summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan data advokat',
      data: {
        total: 0,
        totalKuasa: 0,
        advokatAktif: 0,
        denganNia: 0
      }
    }
  }
})
