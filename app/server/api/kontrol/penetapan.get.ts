import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const auditCounts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.penetapan_majelis_hakim IS NULL OR pp.penetapan_majelis_hakim = '')
        ) AS belum_pmh,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.panitera_pengganti_id IS NULL OR pp.panitera_pengganti_id = 0)
        ) AS belum_pp,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.jurusita_id IS NULL OR pp.jurusita_id = 0)
        ) AS belum_jsp,

        (SELECT COUNT(p.perkara_id)
         FROM perkara p
         LEFT JOIN perkara_penetapan pp ON p.perkara_id = pp.perkara_id
         WHERE YEAR(p.tanggal_pendaftaran) = ${year}
           AND (pp.penetapan_hari_sidang IS NULL OR pp.penetapan_hari_sidang = '')
        ) AS belum_phs
    `)

    const counts = auditCounts[0] || {}

    return serializeBigInt({
      success: true,
      year,
      counts: {
        belumPmh: Number(counts.belum_pmh || 0),
        belumPp: Number(counts.belum_pp || 0),
        belumJsp: Number(counts.belum_jsp || 0),
        belumPhs: Number(counts.belum_phs || 0)
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat audit penetapan perkara'
    }
  }
})
