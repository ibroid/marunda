import { defineEventHandler, getQuery } from 'h3'
import { prisma, serializeBigInt } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const currentYear = new Date().getFullYear()
  const year = query.year && !isNaN(Number(query.year)) ? Number(query.year) : currentYear
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  try {
    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(pp.perkara_id) AS total
      FROM perkara_putusan pp
      JOIN perkara p ON p.perkara_id = pp.perkara_id
      WHERE pp.tanggal_putusan >= '${startDate}' AND pp.tanggal_putusan <= '${endDate}'
        AND (pp.tanggal_minutasi IS NULL OR pp.tanggal_minutasi = '0000-00-00' OR pp.tanggal_minutasi = '')
    `)

    const total = Number(countResult[0]?.total || 0)

    return serializeBigInt({
      success: true,
      year,
      total
    })
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat menghitung total belum minutasi'
    }
  }
})
