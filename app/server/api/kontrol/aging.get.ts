import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const auditCounts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 120
        ) AS tunggakan_4bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 150
        ) AS tunggakan_5bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 180
        ) AS tunggakan_6bulan,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_putusan pp ON p.perkara_id = pp.perkara_id
         WHERE pp.tanggal_putusan IS NULL
           AND DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 365
        ) AS tunggakan_12bulan
    `)

    const counts = auditCounts[0] || {}

    return serializeBigInt({
      success: true,
      counts: {
        tunggakan4Bulan: Number(counts.tunggakan_4bulan || 0),
        tunggakan5Bulan: Number(counts.tunggakan_5bulan || 0),
        tunggakan6Bulan: Number(counts.tunggakan_6bulan || 0),
        tunggakan12Bulan: Number(counts.tunggakan_12bulan || 0)
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat monitoring usia perkara'
    }
  }
})
