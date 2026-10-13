import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear

  try {
    const agingQuery = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 91 AND 150 THEN 1 ELSE 0 END) AS usia_3_5_bulan,
        SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 151 AND 180 THEN 1 ELSE 0 END) AS usia_5_6_bulan,
        SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) BETWEEN 181 AND 365 THEN 1 ELSE 0 END) AS usia_6_12_bulan,
        SUM(CASE WHEN DATEDIFF(CURDATE(), p.tanggal_pendaftaran) > 365 THEN 1 ELSE 0 END) AS usia_diatas_1_tahun
      FROM perkara p
      WHERE p.tanggal_pendaftaran >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        AND NOT EXISTS (
        SELECT 1 FROM perkara_putusan pp
        WHERE pp.perkara_id = p.perkara_id AND pp.tanggal_putusan IS NOT NULL
      )
    `)

    const usia3_5Bulan = Number(agingQuery[0]?.usia_3_5_bulan || 0)
    const usia5_6Bulan = Number(agingQuery[0]?.usia_5_6_bulan || 0)
    const usia6_12Bulan = Number(agingQuery[0]?.usia_6_12_bulan || 0)
    const usiaDiatas1Tahun = Number(agingQuery[0]?.usia_diatas_1_tahun || 0)
    const totalTunggakan = usia3_5Bulan + usia5_6Bulan + usia6_12Bulan + usiaDiatas1Tahun

    return serializeBigInt({
      success: true,
      year,
      aging: {
        usia3_5Bulan,
        usia5_6Bulan,
        usia6_12Bulan,
        usiaDiatas1Tahun,
        totalTunggakan
      }
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal memuat data aging perkara'
    }
  }
})
