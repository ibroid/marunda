import { defineEventHandler } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const currentYear = new Date().getFullYear()

    const [totalRes, yearRes, pihak1Res, pihak2Res, hasKetRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM perkara_pihak5`),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) AS total
        FROM perkara_pihak5 pp5
        JOIN perkara p ON pp5.perkara_id = p.perkara_id
        WHERE YEAR(p.tanggal_pendaftaran) = ${currentYear}
      `),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM perkara_pihak5 WHERE saksi_pihak_ke = 1`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS total FROM perkara_pihak5 WHERE saksi_pihak_ke = 2`),
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(DISTINCT saksi_id) AS total FROM perkara_keterangan_saksi WHERE saksi_id IS NOT NULL`)
    ])

    const total = Number(totalRes[0]?.total || 0)
    const tahunIni = Number(yearRes[0]?.total || 0)
    const saksiPenggugat = Number(pihak1Res[0]?.total || 0)
    const saksiTergugat = Number(pihak2Res[0]?.total || 0)
    const denganKeterangan = Number(hasKetRes[0]?.total || 0)

    return serializeBigInt({
      success: true,
      data: {
        total,
        tahunIni,
        tahunLabel: currentYear,
        saksiPenggugat,
        saksiTergugat,
        denganKeterangan
      }
    })
  } catch (error: any) {
    console.error('Error fetching saksi summary:', error)
    return {
      success: false,
      message: error?.message || 'Gagal memuat ringkasan data saksi',
      data: {
        total: 0,
        tahunIni: 0,
        tahunLabel: new Date().getFullYear(),
        saksiPenggugat: 0,
        saksiTergugat: 0,
        denganKeterangan: 0
      }
    }
  }
})
